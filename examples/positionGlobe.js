
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

//let cors = "http://localhost:8081/";
let cors = "https://cors-anywhere.herokuapp.com/" // à l'école

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView  = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });
var promises   = [];
var menuGlobe  = new GuiTools('menuDiv');
menuGlobe.view = globeView; 


var visibleNodes = [];
var visibleNodesMeshes = [];
var deepest = 0;
var meshes = [];





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
// promises.push(itowns.Fetcher.json('./layers/JSONLayers/Mapillary.json').then(addLayerCb));
         

function requestMapillary(long1, lat1, long2, lat2) {
    let promises_mp = [];
    fetchlink.all(  "https://a.mapillary.com/v3/images/?"
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
            if(jsons.length > 0){
                jsons.forEach(json=>{
                    //console.log(json);
                    addMeshes(json);
                });
            }

        })
    });
}


/** Build a url for a picture with the given key
 */ 
function buildPhotoURL(key){
    return "https://d1cuyjsrcm0gby.cloudfront.net/"+ key + "/thumb-320.jpg";
}


function addMeshes(json) {
    var result;
    var layer = globeView.wgs84TileLayer;
    let altitude;
    let latitude;
    let longitude;

    if(json.features.length > 0){
        for (let i = 0; i < json.features.length; i++) {
            latitude  = json.features[i].geometry.coordinates[0];
            longitude = json.features[i].geometry.coordinates[1];
            altitude  = itowns.DEMUtils.getElevationValueAt(layer,new itowns.Coordinates('EPSG:4326', json.features[i].geometry.coordinates[0], json.features[i].geometry.coordinates[1])).z;
            //console.log(latitude, longitude, altitude);
            addMeshToScene(latitude, longitude, altitude, 0xff0000,0.1,json.features[i].properties.key);
        }
    }
}

function addMeshToScene(long, lat, altitude, color, size,key) {
    // creation of the new mesh (a cylinder)

   // var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    geometry = new THREE.PlaneGeometry(40, 40)
    var material;
    var mesh;    

    let coord = new itowns.Coordinates('EPSG:4326',
                     long,
                     lat,
                    altitude).as('EPSG:4978').xyz();

    // instantiate a loader
    var loader = new THREE.TextureLoader();

    // load a resource
    loader.load(
        // resource URL
        buildPhotoURL(key),

        // onLoad callback
        function ( texture ) {
            // in this example we create the material when the texture is loaded
            material = new THREE.MeshBasicMaterial( {
                side: THREE.DoubleSide,
                map: texture
             });

            mesh = new THREE.Mesh( geometry, material );
                // position and orientation of the mesh
            mesh.position.copy(coord);

            mesh.lookAt(new THREE.Vector3(1, 0, 0));
            mesh.rotateX(-Math.PI / 2);
            //mesh.rotateY(Math.PI);

            // update coordinate of the mesh
            mesh.updateMatrixWorld();

            // add the mesh to the scene
            globeView.scene.add(mesh);
            meshes.push(mesh);
            //console.log(meshes.length);
            removeMeshToScene();
        },

        // onProgress callback currently not supported
        undefined,

        // onError callback
        function ( err ) {
            console.error( 'An error happened.' );
        }
    );

    ////console.log(mesh.position);

    // make the object usable from outside of the function
    globeView.mesh = mesh;
}

function removeMeshToScene() {
    if(meshes.length >300){
        while (meshes.length > 300){
            globeView.scene.remove(meshes.shift());
        } 
    }
}


// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function globeInitialized() {
    // eslint-disable-next-line no-console
    console.info('Globe initialized');

    Promise.all(promises).then(function init() {
        menuGlobe.addImageryLayersGUI(globeView.getLayers(function filterColor(l) { return l.type === 'color'; }));
        menuGlobe.addElevationLayersGUI(globeView.getLayers(function filterElevation(l) { return l.type === 'elevation'; }));

    Promise.all(promises).then(function (result) {

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
    console.log(meshes.length);
    //console.log("EVENT");
    //console.log(globeView);
    var mouse = globeView.eventToNormalizedCoords(event);
    //console.log(mouse);
    var raycaster = new itowns.THREE.Raycaster();
    raycaster.setFromCamera(mouse, globeView.camera.camera3D);
    var intersects = raycaster.intersectObjects( visibleNodesMeshes );

    for ( var i = 0; i < intersects.length; i++ ) {
        console.log(intersects[i]);
        intersects[i].object.material = new THREE.MeshBasicMaterial({ color: "blue" });
    }
    gui_launch_node_research();

    if (visibleNodesMeshes.length > 0) {
        //console.log(visibleNodesMeshes);
        var min = visibleNodesMeshes["0"].position;
        var max = visibleNodesMeshes[visibleNodesMeshes.length-1].position;    

        var min_coords = new itowns.Coordinates('EPSG:4978', min).as('EPSG:4326');
        var max_coords = new itowns.Coordinates('EPSG:4978', max).as('EPSG:4326');

        console.log(min_coords._values[0],min_coords._values[1],max_coords._values[0],max_coords._values[1]);
        requestMapillary(min_coords._values[0],min_coords._values[1],max_coords._values[0],max_coords._values[1]);
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
        }

        else{
            geometry = new THREE.CylinderGeometry(20, 20, 1000, 8);
        }
        
        var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        var mesh = new THREE.Mesh(geometry, material);

        // position and orientation of the mesh
        mesh.position.copy(new THREE.Vector3(node.matrixWorld.elements[12], node.matrixWorld.elements[13], node.matrixWorld.elements[14]));

        //mesh.lookAt(new THREE.Vector3(0, 0, 0));
        //mesh.rotateX(Math.PI / 2);

        // update coordinate of the mesh
        //mesh.updateMatrixWorld();

        // add the mesh to the scene
        //globeView.scene.add(mesh);
        visibleNodesMeshes.push(mesh);
    })
}

function gui_globeView_log(){
    console.log(globeView);
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
    console.log(visibleNodesMeshes);
}

menuGlobe.addGUI("log_globeView", gui_globeView_log);
menuGlobe.addGUI("launch_node_research", gui_launch_node_research);

});