/**
 * Fichier principal de code
 * @author Arnaud Grégoire  <arnaud.gregoire@ensg.eu>
 * @author Victor Lambert <victor.lambert@ensg.eu>
 * @author Amaury Zarzelli <amaury.zarzelli@ensg.eu>
 */

import * as itowns from 'itowns';
import * as THREE from 'three';
import { default as fetchlink } from 'fetch-link';
import GuiTools from './GuiTools.js';

 // Position de départ de la caméra (chateau de Versailles)
let lat1  = 48.806937;
let long1 = 2.116329;
let lat2  = 48.804554;
let long2 = 2.118080;


// Déclaration des différentes variables globales
var positionOnGlobe = { longitude: long1, latitude: lat1, altitude: 100 }; // position qui servira à initialisé la caméra
var UTILS = itowns.UTILS;// chargement du fichier src/utils/DEMUtils.js utile pour calculer l'altitude

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView  = new itowns.GlobeView(viewerDiv, positionOnGlobe);
var promises   = [];
var menuGlobe  = new GuiTools(viewerDiv, 'menuDiv');
menuGlobe.view = globeView;

// Liste des tuiles visibles
var visibleNodes = [];
var visibleNodesMeshes = [];
var deepest = 0;
// Liste des images affichées
var meshes = [];

// div contenant le viewer mapillary
var $mly = document.getElementById("mly");
$mly.style.visibility = "visible";

// On remplit la div correspondate avec le Viewer Mapillary
var mly = new Mapillary.Viewer(
            'mly',
            // Replace this with your own client ID from mapillary.com
            'VTRaYjFvTUZ4THpELTQ1ODFQaV9QUTo2NmI1YTM3MjlmNjM4NDFk',
            null);

//On le positionne à notre vue de départ
mly.moveCloseTo(lat1, long1)
    .then(
        function(node) { console.log(node.key); },
        function(error) { console.error(error); });

function addElevationLayerFromConfig(config) {
    config.source = new itowns.WMTSSource(config.source);
    var layer = new itowns.ElevationLayer(config.id, config);
    globeView.addLayer(layer);
}

function addColorLayerFromConfig(config) {
  config.source = new itowns.WMTSSource(config.source);
  let layer = new itowns.ColorLayer(config.id, config);
  globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/Ortho.json').then(addColorLayerFromConfig));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/WORLD_DTM.json').then(addElevationLayerFromConfig));
promises.push(itowns.Fetcher.json('./layers/IGN_MNT_HIGHRES.json').then(addElevationLayerFromConfig));
// et aussi la couche raster Mapillary
var mapillaryLayer;
promises.push(itowns.Fetcher.json('./layers/test.json').then(function _(config){
  config.source = new itowns.TMSSource(config.source);
  config.fx = 2.5;
  let layer = new itowns.ColorLayer(config.id, config);
  globeView.addLayer(layer);
}).then(function(layer) { mapillaryLayer = layer;}));

/**
 * Send an ajax request to Mapillary asking for mapillary points in the bouding box
 * (long1,lat1) et (long2,lat2)
 * Once every requests is arrived, start the function addMeshes
 * @param {number} long1
 * @param {number} lat1
 * @param {number} long2
 * @param {number} lat2
 */
function requestMapillary(long1, lat1, long2, lat2) {
    let promises_mp = [];
    // request build
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
            if(jsons.length > 0){
                jsons.forEach(json=>{
                    addMeshes(json);
                });
            }

        })
    });
}

/**
 * Build a url for a Mapillary point picture with the given key
 * @param {string} key
 */
function buildPhotoURL(key){
    return "https://d1cuyjsrcm0gby.cloudfront.net/"+ key + "/thumb-320.jpg";
}

/**
 * Extrait du json donné en entrée, la latitude, longitude, altitude, la clé
 * puis lance la fonction addMeshToScene
 * @param {json} json
 */
function addMeshes(json) {
    var result;
    var layer = globeView.tileLayer;
    let altitude;
    let latitude;
    let longitude;
	  let elevation;

    if(json.features.length > 0){
        for (let i = 0; i < json.features.length; i++) {
            latitude  = json.features[i].geometry.coordinates[0];
            longitude = json.features[i].geometry.coordinates[1];
			      elevation = itowns.DEMUtils.getElevationValueAt(layer,new itowns.Coordinates('EPSG:4326', json.features[i].geometry.coordinates[0], json.features[i].geometry.coordinates[1]));
            altitude  = elevation ? elevation.z : 0;
            addMeshToScene(latitude, longitude, altitude, 0xff0000,0.1,json.features[i].properties.key);
        }
    }
}

/**
 * Update the GlobeView object by adding image mesh in it
 * @param {number} long
 * @param {number} lat
 * @param {number} altitude
 * @param {*} color
 * @param {*} size
 * @param {string} key
 */
function addMeshToScene(long, lat, altitude, color, size,key) {
    // creation of the new mesh
    var geometry = new THREE.PlaneGeometry(10, 10)
    var material;
    var mesh;

    // géoréférencement
    let coord = new itowns.Coordinates('EPSG:4326',
                     long,
                     lat,
                    altitude + 5).as('EPSG:4978').xyz();

    // instantiate a loader
    var loader = new THREE.TextureLoader();

    // load a resource
    loader.load(
        // resource URL
        buildPhotoURL(key),

        // onLoad callback
        function ( texture ) {
			texture.minFilter = THREE.LinearFilter;

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

            mesh.quaternion.copy(globeView.camera.camera3D.quaternion);

            // update coordinate of the mesh
            mesh.updateMatrixWorld();

            // add the mesh to the scene
            globeView.scene.add(mesh);
            meshes.push(mesh);
            //console.log(meshes.length);
            removeMeshFromScene();
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

/**
 * Fonction qui enlève les images de la scène jusqu'à ce qu'il n'en reste que 300 (système LIFO)
 * Cette fonction permet un rafraichissement des images, évitant ainsi que le ralentissement de itowns
 * et permettant de ne garder que les dernières images
 */
function removeMeshFromScene() {
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
		menuGlobe.addImageryLayersGUI(globeView.getLayers(function (l) { return l.type === 'color'; }));
		menuGlobe.addElevationLayersGUI(globeView.getLayers(function (l) { return l.type === 'elevation'; }));
		globeView.controls.setTilt(60, true);
    });
});

/**
 * Recursive way of testing which tile layers node are visible
 * @param {object} node
 */
function checkNode(node){
    if(node.visible){
        if(node.children.length > 1){
            for(let i=1; i<node.children.length; i++){
                checkNode(node.children[i]);
            }
        }else{
            if(node.level > deepest){
                visibleNodes = [];
                deepest = node.level;
                visibleNodes.push(node)
            }else if(node.level == deepest){
                visibleNodes.push(node);
            }
        }
    }
}

// ajout de l'évènement "click"
window.addEventListener('click', evenement, false);

/**
 * Permet le rafraichissement de la position de la caméra,
 * déclenche une nouvelle requete mapillary correspondant à la nouvelle position
 * Change quelle couche est visible Raster/image selon le niveau de zoom
 * @param {MouseEvent} event
 */
function evenement(event){
    /*
    Cette partie est inachevé, il s'agissait du raycasting permettant de sélectionner des images dans itowns
    var mouse = globeView.eventToNormalizedCoords(event);
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, globeView.camera.camera3D);
    var intersects = raycaster.intersectObjects( visibleNodesMeshes );

    for ( var i = 0; i < intersects.length; i++ ) {
        console.log(intersects[i]);
        intersects[i].object.material = new THREE.MeshBasicMaterial({ color: "blue" });
    }
    */
    gui_launch_node_research();

    if (visibleNodesMeshes.length > 0) {
        //console.log(visibleNodesMeshes);
        var min = visibleNodesMeshes["0"].position;
        var max = visibleNodesMeshes[visibleNodesMeshes.length-1].position;

        var min_coords = new itowns.Coordinates('EPSG:4978', min).as('EPSG:4326');
        var max_coords = new itowns.Coordinates('EPSG:4978', max).as('EPSG:4326');

        console.log(globeView.controls.getZoom());


        if(globeView.controls.getZoom()>=17){
            requestMapillary(min_coords._values[0],min_coords._values[1],max_coords._values[0],max_coords._values[1]);
            mapillaryLayer.opacity = 0;
            for (var i = 0; i < meshes.length; i++) {
                meshes[i].quaternion.copy(globeView.camera.camera3D.quaternion);
                meshes[i].updateMatrixWorld();
            }
            globeView.notifyChange(true);
            $mly.style.visibility = "visible";
        }
        else{
            mapillaryLayer.opacity = 1;
            globeView.notifyChange(true);
            $mly.style.visibility = "hidden";
        }
    }

    mly.moveCloseTo((min_coords._values[1] + max_coords._values[1])/2, (min_coords._values[0] + max_coords._values[0])/2)
    .then(
        function(node) { return 0; },
        function(error) { console.warn(error); });

}

/**
 * Fonction permettant de voir où sont situés les différents noeuds
 */
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

        visibleNodesMeshes.push(mesh);
    })
}
/**
 * Petite fonction de log
 */
function gui_globeView_log(){
    console.log(globeView);
}

/**
 * Update of which nodes are being watched
 */
function gui_launch_node_research(){
    deepest = 0;
    visibleNodes = [];
    while(visibleNodesMeshes.length > 0){
        var mesh = visibleNodesMeshes.pop();
        globeView.scene.remove(mesh);
    }
    for(let j=0; j<globeView.tileLayer.level0Nodes.length; j++){
        checkNode(globeView.tileLayer.level0Nodes[j]);
    }
    locate_nodes();
}

menuGlobe.addGUI("log_globeView", gui_globeView_log);
menuGlobe.addGUI("launch_node_research", gui_launch_node_research);

//});
