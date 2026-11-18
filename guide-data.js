/* Self-contained course data, separate from the audio engine and project file. */
(() => {
  'use strict';
  window.BoomifyGuides = Object.freeze([
    {
      id: 'acid-techno',
      genre: 'Acid Techno',
      title: 'Mon premier morceau Acid',
      level: 'Débutant',
      description: 'Construis un groove, découvre le son Acid, organise une idée et exporte ton premier morceau.',
      steps: [
        {
          title:'Kick, basse et Acid : trois rôles',
          goal:'Comprendre pourquoi le kick seul ne fait pas tout le grave.',
          instruction:'Le kick crée l’impact régulier, la basse apporte du poids et le synthé Acid fournit le caractère résonant et filtré. Ils peuvent jouer ensemble, mais ne sont pas le même instrument.',
          check:'Tu sais quelle piste écouter pour juger le kick, la basse et la ligne Acid.',
          tip:'Le kick natif actuel de Boomify est encore simple : son côté creux est aussi une limite de notre moteur. Tu n’as pas raté un réglage.',
          target:'#timeline',action:'Voir les pistes'
        },
        {
          title:'Préparer un tempo et une mesure',
          goal:'Créer une grille régulière pour une première idée.',
          instruction:'Sauvegarde ton projet actuel si nécessaire. Pour essayer, choisis un tempo autour de 150 BPM et 16 mesures. Pas besoin de changer de projet si tu as déjà commencé.',
          check:'Le BPM et le nombre de mesures correspondent à ton idée.',
          tip:'Ce tempo est une proposition pour cet exercice, pas une règle imposée au style.',
          target:'#bpm',action:'Voir le tempo'
        },
        {
          title:'Programmer un kick quatre temps',
          goal:'Obtenir une pulsation stable.',
          instruction:'Double-clique sur un clip de DRUM RACK. Dans la ligne Kick, active les pas 1, 5, 9 et 13. Lance la lecture ; tu dois entendre quatre coups réguliers par mesure.',
          check:'Le kick tombe sur chacun des quatre temps et la lecture fonctionne.',
          tip:'Tu peux ensuite ajouter un clap aux pas 5 et 13, puis quelques hi-hats. Ne cherche pas encore le mix parfait.',
          target:'#editorSection',action:'Aller au séquenceur'
        },
        {
          title:'Choisir un synthé Acid',
          goal:'Faire entendre un son distinct de la batterie.',
          instruction:'Ouvre « Bibliothèque » et ajoute une piste Synthétiseur si nécessaire. Clique sur une mesure libre de cette piste, double-clique sur le nouveau clip et choisis l’instrument « Acid 303 » dans le piano roll.',
          check:'Une piste synthé utilise le preset Acid 303.',
          tip:'Le preset est une synthèse Acid simplifiée, pas une émulation matérielle complète de TB-303.',
          target:'#libraryBtn',action:'Voir la bibliothèque'
        },
        {
          title:'Dessiner une première phrase',
          goal:'Composer quatre notes que tu pourras modifier librement.',
          instruction:'Essaie par exemple C3, D#3, G3 et A#2, sur les cases 3, 7, 11 et 15 du piano roll (compte les 16 cases de gauche à droite). Garde des notes courtes, puis écoute avec le kick.',
          check:'Tu entends une phrase Acid rythmée, avec de l’espace entre les notes.',
          tip:'Ceci n’est qu’un exemple : remplace les hauteurs, ajoute des silences ou décale des notes pour trouver ton propre groove.',
          target:'#editorSection',action:'Aller au piano roll'
        },
        {
          title:'Donner du caractère au filtre',
          goal:'Comprendre le timbre Acid au-delà de la suite de notes.',
          instruction:'Sélectionne la piste Acid. Dans les paramètres de la piste sous l’éditeur, expérimente progressivement avec Cutoff et Drive tout en écoutant. Change un paramètre à la fois.',
          check:'Tu identifies au moins un réglage qui change clairement le caractère du synthé.',
          tip:'Le cutoff ouvre ou ferme les aigus ; la résonance donne le son « liquide ». Sur le preset actuel, elle n’est pas encore réglable séparément. L’automation de filtre viendra plus tard.',
          target:'#fxStrip',action:'Voir les réglages'
        },
        {
          title:'Équilibrer kick et synthé',
          goal:'Éviter que les basses se masquent mutuellement.',
          instruction:'Écoute le kick seul avec Solo, puis l’Acid seul, puis les deux ensemble. Baisse le volume de la piste synthé si elle masque l’attaque du kick. Garde aussi des espaces dans le rythme.',
          check:'Tu distingues le coup du kick et la phrase Acid quand ils jouent ensemble.',
          tip:'Ajouter une sub-bass est possible, mais une mauvaise superposition peut aussi rendre le mix moins net.',
          target:'#timeline',action:'Voir l’arrangement'
        },
        {
          title:'Faire vivre le motif',
          goal:'Passer d’une boucle à une courte composition.',
          instruction:'Copie un groupe de clips avec Ctrl+clic, puis Copier et Coller sur une autre mesure. Change ensuite quelques notes de la copie, retire certains éléments au début et garde un passage plus énergique ensuite.',
          check:'Au moins deux sections du morceau sonnent différemment.',
          tip:'Le but n’est pas d’empiler des pistes : une variation de notes ou un silence peut déjà créer une transition.',
          target:'#copyClips',action:'Voir Copier / Coller'
        },
        {
          title:'Sauvegarder et réécouter',
          goal:'Conserver un vrai projet modifiable et un fichier audio.',
          instruction:'Clique sur « Projet » pour conserver un fichier .boomify.json, puis « Export WAV ». Réécoute le WAV et rouvre le projet pour vérifier que tu peux encore modifier ses notes.',
          check:'Tu possèdes un projet réouvrable et une première ébauche Acid en WAV.',
          tip:'L’autosave est un filet de sécurité local ; pour conserver ton morceau, exporte toujours aussi le fichier projet.',
          target:'#exportBtn',action:'Voir les exports'
        }
      ]
    }
  ]);
})();
