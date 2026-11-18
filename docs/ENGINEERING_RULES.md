# Boomify Studio — Principes techniques (ADR 001)

Statut : **adopté pour le développement V2**. Ce document protège la capacité de faire évoluer Boomify et évite de transformer l'autosave en dépendance bloquante.

## 1. Une sauvegarde manuelle comme référence
- Le fichier `*.boomify.json` téléchargé depuis le bouton « Projet » reste la **sauvegarde portable de référence**. Il doit conserver les réglages et les samples, être réouvrable et pouvoir être copié/sauvegardé hors du navigateur.
- Ce format aura un numéro de version ; une évolution incompatible nécessitera un lecteur/migration. Ne jamais changer silencieusement la signification des champs.
- Avant toute grosse évolution, préserver la capacité de lire un fichier V1.

## 2. Autosave : filet de sécurité, pas colonne vertébrale
- L'autosave **local** vise à reprendre une session après fermeture ou actualisation ; il n'est **ni une sauvegarde garantie, ni un substitut au fichier exporté**. Les données locales du navigateur peuvent être supprimées (nettoyage, profil privé, quotas, politique du navigateur).
- `storage.js` isole la technologie de stockage. L'arrangement, le moteur audio, le piano roll, les plugins et les tests de génération de notes ne doivent **pas dépendre d'IndexedDB**.
- Conserver de petites métadonnées de projet d'un côté, les Blobs de samples de l'autre ; éviter de réécrire des fichiers audio à chaque modification de note ou de volume.
- La lecture et l'édition doivent continuer même si le stockage local ne fonctionne pas ; afficher alors une erreur explicite et recommander un export manuel.
- Ne jamais supprimer automatiquement un sample du stockage sans une politique de nettoyage validée.
- Les échanges GitHub, la publication Pages et les données de composition ne sont pas liés : pas de push automatique des morceaux vers le dépôt, pas de compte ni de serveur requis.

## 3. Environnements de développement isolés
- `main` = version publique stable, ne pas y fusionner une fonctionnalité non validée.
- Développement et prévisualisations V2 à une origine distincte de la production (exemple : serveur local `http://127.0.0.1:8765/`), car localStorage et IndexedDB sont isolés **par origine** (protocole + nom d'hôte + port), et **pas par chemin**. Une prévisualisation sous le même domaine Pages mais un autre chemin pourrait autrement partager les sauvegardes.
- Ne pas utiliser des données de composition réelles comme jeux de tests ; créer des morceaux factices et un petit WAV synthétique.
- Aucune modification de résolution d'écran ou installation du système n'est requise.

## 4. Tests et limites de la V2
- Tests automatisés : édition du pattern, Vider/Annuler, import de WAV, sérialisation, sauvegarde et restauration, fichiers manquants, export WAV, commandes de transport.
- Test manuel dans un vrai navigateur **indispensable** pour vérifier la persistance réelle d'IndexedDB et l'ergonomie (une simulation seule ne suffit pas).
- V2 ne sera pas considérée stable ni fusionnée tant que la réouverture des samples et des projets n'aura pas été confirmée sur le poste utilisateur.
- Ne pas implémenter de synchronisation cloud, multi-utilisateur, historique illimité, système de plugins externes ou moteur de sauvegarde complexe avant d'avoir validé ces fondamentaux.

## 5. Critère pratique pour ajouter de la complexité
Une abstraction, bibliothèque ou service ne sera ajouté que s'il réduit un problème réel de test, de fiabilité ou d'évolution. Un DAW fiable qui démarre vite et permet de produire vaut mieux qu'un framework ambitieux mais difficile à maintenir.
