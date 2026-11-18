/* Boomify V2 clip group operations. Pure planning: no mutation of arrangement. */
(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function buildClipboard(tracks, refs) {
    if (!Array.isArray(tracks) || !Array.isArray(refs)) return null;
    const wanted = new Set(refs.map(ref => typeof ref === 'string' ? ref : ref.clipId));
    const selected = [];
    tracks.forEach((track, row) => {
      (track.clips || []).forEach(clip => {
        if (wanted.has(clip.id)) selected.push({track, clip, row});
      });
    });
    if (!selected.length) return null;
    selected.sort((a,b) => a.row-b.row || a.clip.start-b.clip.start);
    const anchorRow = selected[0].row;
    const minStart = Math.min(...selected.map(v => v.clip.start));
    const maxEnd = Math.max(...selected.map(v => v.clip.start+v.clip.bars));
    return {
      anchorRow, minStart, maxEnd,
      items:selected.map(({track,clip,row}) => ({
        rowOffset:row-anchorRow, offset:clip.start-minStart,
        sourceTrackId:track.id, type:track.type, clip:clone(clip)
      }))
    };
  }
  function planPaste(clipboard, tracks, destinationRow, start, totalBars) {
    if (!clipboard || !Array.isArray(clipboard.items) || !clipboard.items.length) return {ok:false, reason:'Copie vide. Sélectionne des clips et clique sur Copier.'};
    if (!Number.isInteger(destinationRow) || destinationRow < 0 || !Number.isInteger(start) || start < 0) return {ok:false, reason:'Choisis une piste et une mesure de destination.'};
    if (!Number.isInteger(totalBars) || totalBars <= 0) return {ok:false, reason:'Longueur de projet invalide.'};
    const insertions = [];
    for (const item of clipboard.items) {
      const track = tracks[destinationRow + item.rowOffset];
      if (!track) return {ok:false, reason:'Pas assez de pistes sous cette destination pour coller le groupe.'};
      if (track.type !== item.type) return {ok:false, reason:'Types de pistes incompatibles. Colle sur des pistes du même type.'};
      if (item.type === 'audio' && track.id !== item.sourceTrackId) return {ok:false, reason:'Les clips audio doivent rester sur leur piste source pour conserver le bon sample.'};
      const copy = clone(item.clip);
      copy.start = start + item.offset;
      if (!Number.isInteger(copy.bars) || copy.bars < 1 || copy.start + copy.bars > totalBars) return {ok:false, reason:'Le collage dépasse la dernière mesure du projet.'};
      if ((track.clips || []).some(existing => copy.start < existing.start+existing.bars && copy.start+copy.bars > existing.start)) return {ok:false, reason:'Collage impossible : une des cases de destination est déjà occupée.'};
      if (insertions.some(other => other.trackId === track.id && copy.start < other.clip.start+other.clip.bars && copy.start+copy.bars > other.clip.start)) return {ok:false, reason:'Les clips copiés se chevauchent.'};
      insertions.push({trackId:track.id, clip:copy});
    }
    return {ok:true, insertions};
  }
  window.BoomifyClipOps = Object.freeze({buildClipboard, planPaste});
})();