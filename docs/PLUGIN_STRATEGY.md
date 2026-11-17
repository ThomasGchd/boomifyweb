# Boomify Studio — Strategie plugins

## Objectif
Permettre a l'utilisateur d'ajouter ses propres instruments et effets au lieu d'exiger qu'ils soient tous integres dans Boomify. Ne pas confondre plugins Web et VST natifs.

## Deux environnements, une experience utilisateur coherente

### 1. Boomify Web (GitHub Pages)
- Web Audio API et, pour le DSP avance, AudioWorklet.
- Etudier **Web Audio Modules 2.0 (WAM2)** comme interface de plugins Web, en premier lieu pour les effets, puis les instruments et les evenements MIDI.
- Les plugins WAM distribuent un module JavaScript, des metadonnees et parfois des ressources WebAssembly. Ces ressources doivent etre chargeables par un hote Web compatible.
- Ne pas promettre qu'un fichier `.dll` ou `.vst3` puisse etre depose sur une page et utilise directement.
- L'import par URL ou paquet local exige une politique de confiance stricte : du JavaScript tiers peut etre dangereux. Preferer des plugins audites/autorises au debut, pas l'execution arbitraire de code.
- Prevoir des interfaces `PluginRegistry`, `PluginInstance`, `PluginState`, `PluginSlot`, `AudioRouting`, independantes du framework UI.

### 2. Edition Windows potentielle (plus tard)
- Possibilite de reemployer l'interface Web dans un conteneur de bureau et de raccorder un moteur/hote de plugins natifs.
- VST3/CLAP impliquent un hote natif, le scan des plugins, les architectures de processeur compatibles, l'isolation des crashs, la communication audio/MIDI et des tests de latence. Ce n'est pas resolu par GitHub Pages, PHP ou un simple serveur local.
- Ne pas affirmer une compatibilite totale ; proceder par prototype technique avant de choisir Electron/Tauri, C++ ou Rust.

## Contrat de sauvegarde des projets
- Stocker pour chaque plugin son type, fournisseur/identifiant, version, parametres, routage, preset/etat et references aux ressources.
- Si un plugin manque, conserver sa configuration et prevenir l'utilisateur ; ne pas effacer les donnees de la session.
- Les projets doivent rester portables et recuperables. Tester les migrations de format.
- Les bibliotheques de samples et autres fichiers utilisateur restent locaux, sauf action explicite de partage.

## Ordre d'implementation
1. Stabiliser timeline, notes, moteur audio et serialisation.
2. Mettre en place une chaine d'effets interne avec une interface de plugin abstraite.
3. Valider un plugin WAM2 exemple, puis la sauvegarde/restauration de ses reglages.
4. Ajouter un navigateur de plugins avec liste compatible, gestion des erreurs, activation/desactivation, presets et information de compatibilite.
5. Evaluer une version desktop et le support natif VST3/CLAP apres preuve de concept.

## References techniques
- WAM2 introduction : https://www.webaudiomodules.com/docs/intro/
- API WAM : https://github.com/webaudiomodules/api
- AudioWorklet : https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- VST3 plugin format : https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical%2BDocumentation/Locations%2BFormat/Plugin%2BFormat.html
