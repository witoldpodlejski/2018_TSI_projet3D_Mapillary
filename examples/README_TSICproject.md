# WebGL - itowns Project - ENSG TSIC2017

Integration of mapillary data into iTowns.

in the files mapillaryIntegration.html and mapillaryIntegration.js

Authors : azarz (Amaury Zarzelli), arnaudgregoire (Arnaud Gregoire), VictorLambert42 (Victor Lambert)

## Objectives

- Raster layer : Using mapillary layer for visualization.
- 3D objects vector layer : 3D objects, position and direction of photograph shooting. Pop-up generation with related images.
- mapillary-js viewer integration.
- (!OPTIONAL) Native iTowns instead of using mapilary-js viewer.

## Workflow

The projects tends to be realized through 3 principal points.

### Real-time positioning

The first data needed are the tiles which are in the field of view of the camera.
In fact, data from mapillary will be queried corresponding to the zoom level and the positions of the tiles.
At every movement of the camera, all the loaded deeper tiles in the field of view will be updated and if not already stored, a query will get the corresponding mapilary data.

### Querying

As soon as new tiles are loaded, queries has to be send in order to get vector datas from mapillary (photograph datas and link to resources).
This queries needs to be asynchronous in order to leave the user free to move.
When the queries are done, some 3D objects needs to be displayed on the map in order to inform the user of the presence of photographs.
Morever, those objects need to be clickable in order to display information about the photograph and the photograph itself in a pop-up.
For this purpose, some of iTowns functions are being studied to display those pop-up.

### 3D Viewer

After reviewing photograph data, the user needs to be able to enter the "viewer mode".
The viewer mode would first use mapillary-js viewer.
Then, the objective is to create a new WebGL scene, displaying the selected photograph in front of the camera.
Each of those photographs would need to be related to its nearest neighbor, in order to navigate between them in the viewer itself.
