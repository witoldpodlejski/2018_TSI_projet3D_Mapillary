# Projet Mapillary v2

## Objectifs du projet
Durant ce projet il nous était demandé de poursuivre le projet entamé l'année précédente par l'équipe d'Arnaud Grégoire, Victor Lambert et Amaury Zarzelli. Le but du projet est d'afficher une collection de photos mis à disposition par le service Mapillary. Celles-ci devait pouvoir étre affichées en 3D à la position de la capture de la photo.
Le travail éffectué l'année dernière a permis d'afficher les photos à partir d'un certain niveau de zoom et d'indiquer leurs positions avec la couche raster donnée par mapillary (des lignes vertes représentant les routes photographiées avec des points verts pour chaque phot).
Cet affichage bien que fonctionnel n'était pas très ergonomique et nous devions donc l'améliorer.

## Pistes de travail explorées

### Mise à jour de l'application

La première étape du projet a été de rendre fonctionnel l'ancienne version du projet avec la version actuelle de Itowns, cette dernière ayant evoluée depuis l'année passée. Il a donc fallu mettre à jour les libairies dans une version actuelle et modifier le code en remplacant les fonctionnalités obsolètes par leurs nouvelles implémentations.

### Zoom sur une image celon ses paramètres de prise de vue

L'idée est de permettre à l'utilisateur de sélectionner une des images affichées et d'effectuer une translation du point de vue de la caméra courante à un point de vue correspondant à la prise de vue réelle de la photo. Nous avons cherché les paramètres de calibration de l'appareil dans l'API mais ils n'étaient pas fournis par celle-ci et nous ne les avons pas trouvé allieurs non plus.

### Affichage d'une couche vecteur au lieu de la couche raster

Un deuxième essai d'implémentation a été de retirer la couche raster d'affichage des points photgraphiées et de la remplacer par son équivalent en vecteur. Cela permettrait d'avoir un affichage plus soigné (moins pixelisé) et de n'afficher les photos que lorsque l'un des points de la couche vecteur est selectionné. Nous avons réussi à trouver l'adresse de l'API et à comprendre son utilisation. L'import de ces couches fonctionne parfaitement mais il nous a été impossible de les afficher du fait d'erreurs d'option de style.

### Création de formes 3d interactives  

La dernière piste explorée était de remplacer chaque photo par un cercle en 3D qui serait selectionnable par le click de l'utilisateur et afficherait ensuite la photo selectionnée. Nous n'avons pas eu le temps de nous attarder sur cette piste mais le principal point bloquant était de trouver comment déclancher un évènement après le clic sur un objet. Les seuls exemples disponibles utilisaient des couches 3D (cf example 3D titles hierarchy).
  

## Conclusion

Pour conclure nous n'avons pas réussi à apporter d'implémentation majeure à ce projet, hormis sa mise à jour mais nous avons pu débroussailler certaines pistes d'amélioration et découvrir d'autres fonctionalités d'Itowns que celles vues en cours. Nous regrettons le manque de temps et de moyen pour rendre un résultat fonctionel.


**Title:** Projet Mapillary 2019
**Authors:** Witold PodleJski, Benoît Messiaen et Matthieu Peregrini
**Date:** 24/02/2019
