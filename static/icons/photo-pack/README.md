# Pack d'icônes photo

Ce pack regroupe des icônes SVG prêtes à l'emploi pour illustrer des actions ou sections liées à la photo. Toutes les formes utilisent un tracé linéaire (#ff6b3d) et un fond transparent pour rester lisibles sur l'interface sombre du projet.

## Icônes disponibles
- `photo-camera.svg` — appareil photo principal
- `photo-gallery.svg` — pile d'images/galerie
- `photo-portrait.svg` — portrait cadré
- `photo-landscape.svg` — paysage cadré
- `photo-panorama.svg` — vue panoramique
- `photo-shutter.svg` — obturateur circulaire
- `photo-edit.svg` — édition/retouche
- `photo-upload.svg` — import/envoi vers le cloud
- `photo-download.svg` — export/téléchargement
- `photo-lock.svg` — contenu protégé
- `photo-focus.svg` — ciblage/mise au point

## Utilisation rapide
1. Placer l'icône souhaitée dans votre page :
   ```html
   <img src="{{ url_for('static', filename='icons/photo-pack/photo-camera.svg') }}" alt="Icône appareil photo" class="icon" />
   ```
2. Optionnel : ajouter un style commun pour aligner la taille avec le reste de l'UI :
   ```css
   .icon {
     width: 48px;
     height: 48px;
     filter: drop-shadow(0 0 12px rgba(255, 107, 61, 0.25));
   }
   ```

Les icônes peuvent être recolorées en modifiant `stroke` ou via `filter` CSS si nécessaire.
