# Boomify Studio — Browser Edition

Une première version de DAW dans le navigateur. Projet personnel expérimental, basé sur HTML, CSS, JavaScript et la Web Audio API.

## Démarrer

- En local : ouvre `index.html` dans Chrome ou Edge.
- Avec GitHub Pages : `Settings` → `Pages` → `Deploy from a branch` → `main` → `/(root)` → `Save`.
- Adresse du site : `https://ThomasGchd.github.io/boomifyweb/` pour le dépôt `boomifyweb`.

## Organisation

- `index.html` : interface HTML et chargement des fichiers.
- `style.css` : styles.
- `app.js` : logique de l'application, synthétiseurs, séquenceur, transport et export audio.
- `.nojekyll` : publie les fichiers statiques directement avec GitHub Pages.

Cette version conserve volontairement le moteur d'origine. Nous pourrons ensuite découper `app.js` en modules (transport, audio, piano roll, timeline, mixer) sans réécrire le DAW d'un seul coup.

## Confidentialité et projets

Le code est public si le dépôt GitHub est public. Les fichiers audio importés ne sont pas automatiquement téléversés sur GitHub. Évite de committer des samples sous copyright, des projets personnels ou des mots de passe dans le dépôt.

## Limitations de la première version

Prototype de navigateur : pas de VST Windows (`.dll`), édition des clips encore limitée et timeline à étendre.