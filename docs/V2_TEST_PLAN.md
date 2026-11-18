# Boomify V2 — Plan de validation avant fusion

## État
- Branche : `feature/editable-clips`, PR #1 en brouillon.
- Site public `main` inchangé.
- Correction V2 : autosave IndexedDB pour métadonnées du projet + Blobs de samples séparés, au lieu de perdre les samples via `localStorage`.
- Export manuel JSON : conserve les samples en Data URL ; l'export WAV reste distinct.
- Alerte persistante si l'enregistrement local échoue ou si des samples ne sont pas restaurés.
- Migration : ancien autosave `localStorage` restauré si aucun projet IndexedDB n'est disponible, mais samples précédemment non enregistrés signalés comme manquants.

## Tests automatisés effectués
- Syntaxe JavaScript : `node --check app.js` et `node --check storage.js`.
- Tests Playwright/Chromium locaux avec **simulation IndexedDB** (limite de l'environnement de test) :
  1. Démo audio avec notes prêtes ; vider un clip puis annuler.
  2. Arrangement 8/64 mesures et échelle d'affichage.
  3. Import d'un sample WAV synthétique, création du Blob, sauvegarde de la référence.
  4. Restauration du sample après reconstruction de la page et export du JSON contenant sa Data URL.
  5. Annulation/rétablissement et reprise du BPM après restauration.
  6. Export WAV hors ligne avec en-tête RIFF valide.
  7. Simulation d'un sample manquant => avertissement visible.
  8. Réouverture manuelle d'un JSON complet => sample récupéré et recopié en stockage local.
- Aucune erreur JavaScript détectée pendant ces scénarios.

## Tests manuels **indispensables** avant fusion
Utiliser le site servi en HTTP local (ex. `py -3 -m http.server 8765 --bind 127.0.0.1`), ou une prévisualisation en HTTPS. Ne pas supposer que `file://` permet IndexedDB.

A. Démo : Lecture/Arrêt et son audible.
B. Édition : double-clic basse, `Vider`, `Ctrl+Z` rétablit les notes.
C. Ergonomie : extension mesures, zoom, bibliothèque escamotable, panneau éditeur, plein écran.
D. **Critique** : importer WAV sur piste audio, attendre la sauvegarde auto, recharger la page ; piste/sample toujours présents et audibles, pas d'alerte.
E. Exporter le projet JSON et un WAV : fichiers lisibles.
F. Repartir sur un projet vierge, ouvrir le JSON : notes + sample retrouvés.
G. Retour sur la lisibilité et les gestes d'édition ; rapporter navigateur, capture et étape précise si échec.

## Conditions de fusion
- Aucun test manuel critique en échec (en particulier D, E et F).
- Aucun écrasement de données de projet ; messages d'erreur explicites.
- Compatibilité de la V1 et des projets JSON existants préservée.
- Ne pas fusionner sur `main` sans validation utilisateur.
