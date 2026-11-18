# Boomify Academy — tutoriels par style

## Constat déclencheur (composition Acid)
Lors de sa première composition Acid, l'utilisateur a compris le principe du piano roll, mais pas comment articuler kick, basse, son Acid et choix des paramètres. Le kick natif lui paraît trop creux ; ce constat est aussi un problème audio réel, pas uniquement de pédagogie.

## Parcours utilisateur livré en première itération
- Un bouton **🎓 Apprendre** ouvre un panneau flottant, sans réduire la largeur de l'arrangement.
- Premier cours : **Mon premier morceau Acid** (9 étapes) avec des consignes concrètes, un résultat attendu, une astuce et un raccourci vers la zone de l'interface.
- Le panneau est facultatif, refermable, sa progression est mémorisée localement sous une clé séparée de l'autosave musical, et aucun réglage de projet n'est modifié automatiquement.
- Déroulé : rôles kick/basse/acid ; tempo ; kick 4/4 ; choix Acid 303 ; notes ; cutoff/drive ; équilibre ; arrangement/variations ; sauvegarde/export.
- Les autres styles (Hard Techno, Trance, Hardcore, Hardstyle) sont proposés comme pistes futures, **non déclarés terminés**.

## Architecture
- `guide-data.js` : simple liste de cours et étapes déclaratives, indépendante de Web Audio et du modèle musical.
- `academy.js` : moteur de navigation et de focus du cours, indépendant des sauvegardes et de la lecture.
- `index.html` + `style.css` : panneau facultatif et responsive.
- Le contenu est explicite : pas de détection automatique de réussite. L'utilisateur vérifie lui-même ses résultats.
- Ajouter un style = ajouter un objet avec `id`, `genre`, `title`, `level`, `description`, et `steps[]` (`title`, `goal`, `instruction`, `check`, `tip`, `target`, `action`).
- `tests/guides.test.cjs` vérifie la structure et l'existence des cibles d'interface.

## Limites et suite
- Le guide n'améliore pas le son du kick ; le travail audio est suivi séparément dans l'issue #5.
- Ne pas imposer de vue « débutant » bridée : les tutoriels restent facultatifs pour tous les utilisateurs.
- Éviter les tutoriels purement textuels à long terme : évoluer vers vérification de quelques actions, projet de départ et démonstrations sonores, **sans effacer le travail en cours**.
- Validation utilisateur nécessaire : lisibilité, vraies étapes d'apprentissage, focus des bons contrôles et vérification que le panneau ne gêne pas la composition.
