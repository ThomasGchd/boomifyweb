# Boomify Studio — Vision produit

## Mission validee
Permettre de **produire un morceau complet de A a Z directement sur le Web**, aussi bien lors d'une premiere session MAO qu'avec une pratique avancee. Boomify doit etre un veritable DAW, pas un simple sequencer ni une demo. Une version Windows reste une possibilite future si les limites concretes du navigateur la rendent necessaire, **pas un prealable**.

La production electronique et les harder styles (hard techno, hardcore, acid, hardstyle, trance...) sont une inspiration forte, **sans limiter Boomify a ces genres**. D'autres styles doivent rester pleinement possibles.

## Decisions artistiques et ergonomiques (validees)
- **Identite visuelle** : interface sombre, professionnelle, lisible, industrielle et epuree ; les premieres pistes evoquent favorablement Cakewalk. La DA visuelle peut evoluer en respectant cette direction.
- **Signature/slogan** : **non defini** ; sera imagine et choisi plus tard par le createur. Ne pas figer de tagline dans le produit.
- **Disposition principale** :
  - barre de transport en haut ;
  - **arrangement et timeline prioritaires**, occupant autant que possible toute la largeur de la zone superieure ;
  - **explorateur sous forme de menu / tiroir escamotable**, et non une fenetre ou colonne permanente volant de la place a l'arrangement ; acces aux instruments, effets, samples, plugins et projets ;
  - **piano roll et autres editeurs dans un panneau inferieur** ouvrable, redimensionnable et refermable ; edition contextuelle du clip selectionne.
- **Une seule experience du debutant au professionnel** : aide contextuelle et tutoriels, jamais de capacites volontairement bridees ; controles avances disponibles au besoin.
- **Bibliotheque integree evolutive** : instruments et effets propres a Boomify fournis par defaut, avec presets ; le catalogue pourra grandir. Support de plugins Web tiers compatible et securise a etudier ensuite.
- **Web-first** : la version de production ciblee est la page Web ; pas de dependance a un EXE ni a un serveur applicatif pour composer et exporter.

## Principes non negociables
1. **Accessible, mais pas simpliste** — aide contextuelle, vocabulaire explique, demo, parcours pedagogique et outils experts accessibles sans changer de logiciel.
2. **Produire avant de configurer** — creer kick, basse, melodie et arrangement des la premiere session.
3. **Un projet reste editable** — notes, clips, pistes, effets, automations, presets et sources sont sauvegardables, recuperables et exportables.
4. **Fiabilite audio** — lecture stable, synchronisation, gestion du transport, undo/redo et sauvegardes fiables avant l'accumulation de fonctions.
5. **Ouverture** — plugins internes modulaires et extensibles, puis eventuellement WAM2 ; VST3/CLAP natifs uniquement via un futur hote natif.
6. **Donnees personnelles locales** — samples et projets restent sur l'ordinateur par defaut. Aucun compte obligatoire.
7. **Performance** — separer interface, scheduling et traitement audio (Web Audio, AudioWorklet pour les besoins adaptes).

## Parcours debutant
- Demarrage guide : creer un kick, construire un pattern, composer une basse, une melodie, structurer un morceau, exporter un WAV.
- Explications integrees : BPM, mesures, quantification, enveloppes, filtres, EQ, compression et sidechain.
- Bons parametres initiaux, presets, exemples, aides desactivables ; erreurs reparables.

## Capacites visees pour utilisateurs avances
- Piano roll et clips precis, timeline extensible et zoomable, raccourcis, navigation efficace.
- Routage, mixer, effets chainables, automation, MIDI, import et export de samples, formats de projet versionnes.
- Plugin API interne independante de l'interface, sauvegarde des etats/presets et compatibilite progressive.
- Capacite a produire au-dela d'un simple loop, jusqu'a un morceau entier.

## Etapes de livraison (sans dates artificielles)
1. **V2 — edition et arrangement** : double-clic pour ouvrir un clip ; piano roll inferieur et editions persistantes ; timeline plus vaste et mieux manipulable ; explorateur escamotable ; controles de regression.
2. **Fondations moteur et projets** : transport/scheduling robuste, architecture modulaire, serialization, gestion des sources, sauvegarde/recuperation et undo/redo.
3. **Creation musicale et pedagogie** : sampler, synthese et effets natifs pertinents, bibliotheque de presets, mixer, automation et tutoriels.
4. **Extensions Web** : slots et routage de plugins, etude WAM2 et compatibilite de projets.
5. **Evaluation Windows uniquement si besoin** : reutiliser l'interface HTML dans une application avec fonctions natives ; hebergement VST3/CLAP exigeant un hote natif specifique et une validation technique.

## Workflow
- `main` reste la V1/Vx **publique stable** sur GitHub Pages.
- Branches `feature/*` et `fix/*` ; tests et revue avant fusion.
- Ne pas casser une version fonctionnelle ; annoncer uniquement ce qui a ete effectivement teste.
