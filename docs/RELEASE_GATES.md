# BOOMIFY STUDIO — Cycle de développement et portes de validation

**Décision validée :** des cycles courts « tester → composer → améliorer → retester ». Le Web est la plateforme principale ; la version publique `main` reste stable jusqu'à la validation.

## Principe de passage d'étape
- Une étape n'est **pas terminée** quand le code est écrit : elle l'est quand ses critères sont vérifiés.
- Tout bug constaté dans le périmètre de l'étape est documenté, corrigé **et retesté** avant de poursuivre. Pas de report silencieux.
- Un comportement non encore implémenté n'est pas présenté comme « opérationnel ». Les fonctions indispensables manquantes empêchent la validation et sont traitées pendant l'étape.
- Éviter d'ajouter des options non demandées pendant la phase de correction : priorité à la stabilité.
- Les tests techniques automatisés et les tests manuels en vrai navigateur sont complémentaires.
- Le retour utilisateur sur l'ergonomie est indispensable avant la fusion sur `main`.

## ÉTAPE 1 — Batterie de tests complète : validation V2

**Objectif :** vérifier que Boomify est fiable pour commencer à créer. Statut au 18 novembre 2026 : **ÉTAPE 1 VALIDÉE par l'utilisateur**. Les dix parcours de la campagne de tests ont été exécutés sur son PC : lecture (boucle et unique), piano roll, Vider/Annuler, clips et arrangement, ergonomie, import WAV, sauvegarde automatique, export WAV audible et restauration JSON. Les deux corrections issues des retours ont ensuite été retestées avec succès : métronome visible et fonctionnel ; création de clips vides et duplication fonctionnelles. Les améliorations non bloquantes (navigation, mise en page, choix d'instrument, waveform, plage d'export) restent tracées dans l’issue #4. **Porte de validation franchie : passage à l'étape 2 (composition Acid).**

### Tests à dérouler, dans l'ordre
1. **Lancement & interface :** ouvrir la V2 sur `http://127.0.0.1` (ou autre origine de test dédiée), vérifier l'absence d'erreur visible et les notes préchargées.
2. **Lecture :** lire/arrêter, lecture unique, boucle, métronome, changer BPM, surveiller les blocages audio.
3. **Arrangement :** ajouter/sélectionner/déplacer/dupliquer/supprimer des clips ; tester 8/16/32/64 mesures, zoom et déplacement dans la timeline.
4. **Édition :** ouvrir au double-clic, ajouter/déplacer/allonger/supprimer les notes ; tester les drums, `Vider`, `Ctrl+Z` et `Ctrl+Maj+Z`.
5. **Ergonomie :** menu Bibliothèque, panneau éditeur, modes compact/plein écran, taille d'interface, persistance des préférences d'affichage.
6. **Samples :** importer WAV/MP3 compatible sur une piste, vérifier sa lecture et sa forme d'onde.
7. **Sauvegarde critique :** exporter `*.boomify.json` complet, recharger la page et vérifier l'autosave et les samples, réimporter le JSON dans un projet vierge.
8. **Export audio :** produire un WAV, le réécouter et vérifier qu'il correspond à l'arrangement.
9. **Robustesse :** projet vierge, démo, suppressions/annulations, restauration d'un ancien projet, erreurs clairement affichées.
10. **Retour terrain :** repérer les éléments difficiles à comprendre, les interactions ambiguës, les raccourcis qui gênent.

**Validation :** tous les tests applicables passent ; tout bug remonté est corrigé puis retesté ; les scénarios critiques de sauvegarde, chargement, lecture et export ne connaissent aucun échec. Archiver le compte rendu des résultats et la version testée. Ne pas fusionner la V2 sur `main` avant accord sur les tests.

## ÉTAPE 2 — Première vraie composition Acid

**Objectif :** produire dans Boomify Web une composition Acid musicale, pas uniquement vérifier une boucle.
- Commencer avec les instruments/presets et le séquenceur présents.
- Créer un beat, une ligne de basse acid, des variations et des sections (intro, montée, passage principal, break selon les possibilités de l'outil).
- Modifier les notes et le son, écouter, enregistrer, fermer, rouvrir et exporter un WAV.
- Identifier ce qui marche vraiment et ce qui manque pour rendre la création agréable (timbre acid, expressivité, automations, gestion des clips, workflow).
- Si une fonction indispensable à la composition manque, relever précisément le blocage, le corriger puis reprendre cette étape.
- **Validation :** un morceau/prototype acid volontairement composé, modifiable, rouvrable et exportable, accompagné du bilan d'utilisation.

## ÉTAPE 3 — Améliorations motivées par les tests et la composition
- Transformer les blocages observés en tâches priorisées.
- Ordre privilégié : stabilité/qualité audio, édition/arrangement, instruments/effets, ergonomie, puis extras et randomizer.
- Garder la DA validée : interface sombre professionnelle, arrangement prioritaire, explorateur escamotable, piano roll inférieur, Web-first.
- Développement sur branches dédiées, avec PRs vérifiables et format de projet compatible.

## ÉTAPE 4 — Nouvelle batterie de tests
- Rejouer les scénarios de l'étape 1 sur la nouvelle version (non-régression).
- Tester spécialement les nouvelles fonctions et les interactions avec les anciennes.
- Corriger et retester tous les bugs relevés avant de passer au cycle suivant.
- Préparer la prochaine composition ou validation musicale seulement après franchissement de la porte de qualité.

## Fonctionnement du cycle
**1. Tests + correction de tous les bugs → 2. Composition Acid complète → 3. Améliorations issues de l'usage → 4. Tests complets + corrections → répétition.**

## Rôles
- Développement : architecture, implémentation, tests automatiques, correctifs, documentation, propositions techniques.
- Utilisateur : tests ergonomiques et musicaux en conditions réelles, retours sur la création, validation des étapes.
- Aucune promesse de travail asynchrone : les opérations de développement sont effectuées pendant les sessions de travail.
