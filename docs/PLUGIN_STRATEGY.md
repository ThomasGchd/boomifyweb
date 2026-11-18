# Boomify Studio — Strategie instruments, effets et plugins

## Cap fixe
**Le Web est la plateforme principale de creation**, pas un compromis temporaire. Boomify doit permettre de composer et exporter une production complete sans installeur. L'ouverture aux plugins ne doit pas compromettre cet objectif.

## Trois niveaux d'extensibilite
1. **Instruments et effets natifs Boomify** : bibliotheque initiale suffisamment fournie, evolutive, maintenue dans le projet ; presets et interfaces coherentes ; modules charges a la demande ; offrir notamment de quoi produire acid, hard techno, hardcore, trance, mais sans exclusivite musicale.
2. **Extensions compatibles Web** : etudier Web Audio Modules 2.0 (WAM2) pour des plugins tiers compatibles avec un hote Web. Compatibilite, droits de redistribution, dependances, performances et securite doivent etre testes. L'execution de JavaScript arbitraire a partir de liens ou de fichiers non verifies n'est pas autorisee par defaut.
3. **Hypothese Windows ulterieure seulement si necessaire** : une interface HTML/CSS/JS pourrait etre integree dans une application desktop, avec un pont / hote natif pour VST3 ou CLAP, mais un simple emballage EXE ne rend pas ces plugins compatibles.

## Architecture cible (a construire progressivement)
- Couche presentation : arrangement, piano roll, transport, mixer, menus d'explorateur escamotables.
- Couche musicale : modeles de projets/pistes/clips/notes, tempo, scheduling, automation et sauvegardes.
- Couche audio : noeuds Web Audio, synthese, effets, AudioWorklet si necessaire et rendu offline.
- Couche plugins : contrats `PluginRegistry`, `PluginInstance`, `PluginState`, `PluginSlot`, `AudioRouting` independants de l'interface.
- Charger les instruments/effets lourds **a la demande**, ne pas integrer des dizaines de moteurs inutilises dans le bundle initial.

## Plugins et projets
- Sauvegarder fournisseur/type/identifiant/version, controles, etat et presets, routage et ressources necessaires.
- Si un plugin manque : afficher une explication, garder son etat et proposer un remplacement, sans detruire le projet.
- Projets et bibliotheques de samples locaux par defaut ; les projets doivent rester editables, exportables et recuperables.

## Ordre raisonnable
1. Clips editables, timeline, note editor et sauvegarde stables.
2. Chaine audio/mixer et API de modules internes testable.
3. Bibliotheque native Boomify avec synthese, sampler, effets et presets coherents.
4. Test WAM2, restauration d'etat, puis exploration d'un catalogue tiers securise.
5. Version desktop seulement en presence d'une limitation Web precise et documentee ; preuve de concept avant tout engagement.

## References de travail
- WAM2 : https://www.webaudiomodules.com/docs/intro/
- WAM API : https://github.com/webaudiomodules/api
- AudioWorklet : https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- VST3 : https://steinbergmedia.github.io/vst3_dev_portal/
