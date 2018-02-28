
/* global itowns, document, renderer, GuiTools, Promise */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Annecy lake.
// var positionOnGlobe = { longitude: 6.2230, latitude: 45.8532, altitude: 5000 };

var fetchlink = itowns.fetchLink;
// Position near Gerbier mountain.
/*
let lat1  =  48.859031;
let long1 = 2.293377;
let lat2  = 48.857577;
let long2 = 2.295619;
*/

let lat1  =48.806937;
let long1 = 2.116329;
let lat2  = 48.804554;
let long2 =2.118080;


var positionOnGlobe = { longitude: long1, latitude: lat1, altitude: 100 };
var THREE = itowns.THREE;
var UTILS = itowns.UTILS;

let apiKey = "&key=AIzaSyD2R3pKLOwX6lgTTdVfb1_kQcavwiqrxWM";

let googleURL = "https://maps.googleapis.com/maps/api/elevation/json?locations=";

let cors = "http://localhost:8081/";

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView  = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });
var promises   = [];
var menuGlobe  = new GuiTools('menuDiv');
menuGlobe.view = globeView; 

function onMouseMove( event ) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));
         
let promises_mp = [];

fetchlink.all("https://a.mapillary.com/v3/images/?"
    +"bbox="
    +long1
    +","
    +lat1
    +","
    +long2
    +","
    +lat2
    +"&client_id=VTRaYjFvTUZ4THpELTQ1ODFQaV9QUTo2NmI1YTM3MjlmNjM4NDFk").then(
        results => {
            for(let i=0; i< results.length; i++){
                promises_mp.push(results[i].json());
            };
}).then(() => {
    Promise.all(promises_mp).then(jsons => {
        jsons.forEach(json=>{
            ////console.log(json);
            addMeshes(json);
        });
    })
});

function addMeshes(json) {

    let request = cors + googleURL + json.features[1].geometry.coordinates[1] + "," + json.features[1].geometry.coordinates[0] + apiKey;
    //console.log(request);
    itowns.Fetcher.json(request)
    .then( result => {return result.results[0].elevation})
    .then(altitude =>{
         for (let i = 0; i < json.features.length; i++) {
            addMeshToScene(json.features[i].geometry.coordinates[0],json.features[i].geometry.coordinates[1], altitude ,0xff0000,0.1);
        }
    });


}

function addMeshToScene(long, lat, altitude, color, size) {
    // creation of the new mesh (a cylinder)

    var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    var material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
    var mesh     = new THREE.Mesh( geometry, material );

    let coord = new itowns.Coordinates('EPSG:4326',
                     long,
                     lat,
                    altitude).as('EPSG:4978').xyz();

    // position and orientation of the mesh
    mesh.position.copy(coord);

    mesh.lookAt(new THREE.Vector3(0, 0, 0));
    mesh.rotateX(Math.PI / 2);

    // update coordinate of the mesh
    mesh.updateMatrixWorld();

    // add the mesh to the scene
    globeView.scene.add(mesh);

    ////console.log(mesh.position);

    // make the object usable from outside of the function
    globeView.mesh = mesh;
}

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function globeInitialized() {
    // eslint-disable-next-line no-console
    console.info('Globe initialized');

    Promise.all(promises).then(function init() {
        menuGlobe.addImageryLayersGUI(globeView.getLayers(function filterColor(l) { return l.type === 'color'; }));
        menuGlobe.addElevationLayersGUI(globeView.getLayers(function filterElevation(l) { return l.type === 'elevation'; }));

    Promise.all(promises).then(function (result) {

            ////console.log(result[3]);

            //addMeshToScene(long1,lat1,new THREE.Color( 'skyblue' ),5);
            //addMeshToScene(long2,lat1,new THREE.Color( 'skyblue' ),5);
            //addMeshToScene(long2,lat2,new THREE.Color( 'skyblue' ),5);
            //addMeshToScene(long1,lat2,new THREE.Color( 'skyblue' ),5);

            menuGlobe.addImageryLayersGUI(globeView.getLayers(function (l) { return l.type === 'color'; }));
            menuGlobe.addElevationLayersGUI(globeView.getLayers(function (l) { return l.type === 'elevation'; }));
            globeView.controls.setTilt(60, true);


    });
});


// var evt = new MouseEvent("click", {
//     bubbles: true,
//     cancelable: true,
//     view: window,
//   });




var visibleNodes = [];
var visibleNodesMeshes = [];
var deepest = 0;

function checkNode(node){
    if(node.visible){
        if(node.children.length > 1){
            for(let i=1; i<node.children.length; i++){
                checkNode(node.children[i]);
            }
        }else{
            ////console.log(deepest);
            if(node.level > deepest){
                visibleNodes = [];
                deepest = node.level;
                visibleNodes.push(node)
            }else if(node.level == deepest){
                visibleNodes.push(node);
            }else{
                //visibleNodes.push(node);
            }
        }
    }
}


window.addEventListener('click', evenement, false);
function evenement(event){
    //console.log("EVENT");
    //console.log(globeView);
    var mouse = globeView.eventToNormalizedCoords(event);
    //console.log(mouse);
    var raycaster = new itowns.THREE.Raycaster();
    raycaster.setFromCamera(mouse, globeView.camera.camera3D);
    var intersects = raycaster.intersectObjects( visibleNodesMeshes );
    for ( var i = 0; i < intersects.length; i++ ) {
        //console.log(intersects[i]);
        intersects[i].object.material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    }
    gui_launch_node_research();
    for ( var i = 0; i < visibleNodes.length; i++ ) {
        var obb = visibleNodes[i].children[0].box3D;
        var center = visibleNodes[i].geometry.center;
        var min = center.add(obb.min);
        var max = center.add(obb.max);
        var min_coords = new itowns.Coordinates('EPSG:4978', min).as('EPSG:4326');
        var max_coords = new itowns.Coordinates('EPSG:4978', max).as('EPSG:4326');
        //console.log(min_coords, max_coords);
    }
}

exports.view = globeView;
exports.initialPosition = positionOnGlobe;

function locate_nodes(){
    visibleNodes.forEach(node => {
        var center = node.geometry.center;
        var geometry;
        if(node.wmtsCoords.WGS84G[0].zoom < 10){
            geometry = new THREE.CylinderGeometry(20, 20, 10000, 8);
        }else{
            geometry = new THREE.CylinderGeometry(20, 20, 1000, 8);
        }
        var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        var mesh = new THREE.Mesh(geometry, material);

        // position and orientation of the mesh
        mesh.position.copy(new THREE.Vector3(node.matrixWorld.elements[12], node.matrixWorld.elements[13], node.matrixWorld.elements[14]));

        mesh.lookAt(new THREE.Vector3(0, 0, 0));
        mesh.rotateX(Math.PI / 2);

        // update coordinate of the mesh
        mesh.updateMatrixWorld();

        // add the mesh to the scene
        globeView.scene.add(mesh);
        visibleNodesMeshes.push(mesh);
    })
}

function gui_globeView_log(){
    //console.log(globeView);
}
function gui_launch_node_research(){
    deepest = 0;
    visibleNodes = [];
    while(visibleNodesMeshes.length > 0){
        var mesh = visibleNodesMeshes.pop();
        globeView.scene.remove(mesh);
    }
    for(let j=0; j<globeView.wgs84TileLayer.level0Nodes.length; j++){
        checkNode(globeView.wgs84TileLayer.level0Nodes[j]);
    }
    locate_nodes();
    //console.log(visibleNodes);
    //console.log(visibleNodesMeshes);
}
menuGlobe.addGUI("log_globeView", gui_globeView_log);
menuGlobe.addGUI("launch_node_research", gui_launch_node_research);

});