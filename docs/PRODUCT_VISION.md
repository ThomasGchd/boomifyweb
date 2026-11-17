# Boomify Studio — Vision produit

## Mission
Rendre possible la creation musicale complete, de l'apprentissage des bases a une production approfondie, avec un outil accessible aux debutants sans brider les utilisateurs avances.

Boomify est un veritable DAW, pas uniquement une boite a rythmes ni un demonstrateur. Il doit permettre de produire, arranger, mixer et exporter des morceaux originaux. Il a une sensibilite electronique (acid, trance, harder styles), mais n'enferme pas l'utilisateur dans un genre.

## Principes non negociables
1. **Accessible, mais pas simpliste** — aide contextuelle, vocabulaire explique, projet de demonstration, parcours pedagogique progressif et controles avances accessibles sans changer de logiciel.
2. **Produire avant de configurer** — une premiere session doit permettre de creer un rythme, une basse, une melodie et un arrangement sans installation complexe.
3. **Un projet reste editable** — notes, clips, pistes, effets, automations, presets et sources audio sont sauvegardables, recuperables et exportables.
4. **Fiabilite audio en priorite** — lecture stable, synchronisation, absence de notes bloquees, gestion du transport, recuperation des erreurs, undo/redo et sauvegardes fiables.
5. **Ouverture** — instruments et effets integres, puis plugins web tiers ; envisager une edition native pour les formats VST3/CLAP, sans promettre leur chargement dans Chrome.
6. **Controle de l'utilisateur** — les projets personnels et les samples restent locaux par defaut. Aucun besoin de compte pour composer.
7. **Performance** — separer la vue du moteur audio, preparer le traitement AudioWorklet et limiter les traitements sur le thread de l'interface.

## Parcours debutant
- Demarrage guide : creer un kick, ajouter un pattern, composer une basse, ajouter une melodie, structurer un morceau, exporter un WAV.
- Mini-explications dans le contexte d'utilisation : BPM, mesures, quantification, enveloppe, filtre, EQ, compression, sidechain.
- Parametres utiles par defaut, presets et exemples de projets ; toutes les aides sont desactivables.
- Retours visuels/audio clairs et corrections faciles.

## Attentes utilisateurs avances
- Edition precise des notes et clips ; raccourcis clavier ; zoom et navigation efficaces.
- Routage audio clair, mixer, effets chainables, automation, metronome, boucle, import de samples, MIDI.
- Formats de projet versionnes et portables ; sauvegarde automatique et export fiable.
- Extensibilite par un systeme de plugins avec etat et presets serialisables.

## Priorites par etapes (sans date artificielle)
1. **V2 : base d'arrangement** — clips editables, note-editor fiable, timeline extensible, undo/redo, tests de regression.
2. **Fondations moteur** — transport et scheduling robustes, separation UI/audio, serialization stable, gestion des sources, sauvegarde et recuperation.
3. **Production et apprentissage** — instruments, effets, automation, mixer, onboarding et tutoriels.
4. **Plugins Web** — architecture de slots/inserts ; essai d'hebergement WAM 2.0 et validation de projets.
5. **Evaluation edition native** — recherche d'un hote de plugins natifs (VST3/CLAP) sous Windows, necessitant un moteur/bridge natif et des tests de securite, de compatibilite et de latence.

## Methode de livraison
- `main` = version publique stable publiee sur GitHub Pages.
- Branches courtes `feature/*` ou `fix/*` ; tests et revue avant fusion.
- Ne pas casser une fonctionnalite stable pour ajouter une nouvelle option.
- Les fonctionnalites annoncees doivent avoir ete testees ; documenter explicitement les limitations.
