/* Boomify Academy: optional, non-destructive course overlay. No DAW data changes. */
(() => {
  'use strict';
  const courses = window.BoomifyGuides || [];
  const byId = id => document.getElementById(id);
  const button = byId('academyBtn'), panel = byId('academyPanel');
  if (!button || !panel || !courses.length) return;
  const STORAGE_KEY = 'boomify-academy-progress-v1';
  let course = courses[0], stepIndex = 0, flashTimeout = null;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const chosen = courses.find(item => item.id === saved?.course);
    if (chosen) {
      course = chosen;
      stepIndex = Math.max(0, Math.min(chosen.steps.length - 1, Number(saved.step) || 0));
    }
  } catch (_) { /* Tutorial is always optional even if storage is blocked. */ }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({course:course.id,step:stepIndex})); }
    catch (_) { /* never prevent music creation */ }
  }
  function visible(open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('academy-open', open);
  }
  function render() {
    const step = course.steps[stepIndex];
    byId('academyCourseName').textContent = course.title;
    byId('academyCourseMeta').textContent = course.genre + ' · ' + course.level;
    byId('academyStepCount').textContent = 'Étape ' + (stepIndex+1) + ' / ' + course.steps.length;
    byId('academyProgress').style.width = (100*(stepIndex+1)/course.steps.length) + '%';
    byId('academyStepTitle').textContent = step.title;
    byId('academyGoal').textContent = step.goal;
    byId('academyInstruction').textContent = step.instruction;
    byId('academyCheck').textContent = step.check;
    byId('academyTip').textContent = step.tip;
    byId('academyGoto').textContent = step.action || 'Voir dans Boomify';
    byId('academyPrev').disabled = stepIndex === 0;
    byId('academyNext').textContent = stepIndex === course.steps.length-1 ? 'Terminer le guide ✓' : 'Étape suivante →';
  }
  button.addEventListener('click', () => {
    visible(panel.hidden);
    if (!panel.hidden) render();
  });
  byId('academyClose').addEventListener('click', () => visible(false));
  byId('academyPrev').addEventListener('click', () => {
    if(stepIndex>0){stepIndex--;save();render();}
  });
  byId('academyNext').addEventListener('click', () => {
    if (stepIndex === course.steps.length-1) {visible(false);return;}
    stepIndex++;save();render();
  });
  byId('academyRestart').addEventListener('click', () => {stepIndex=0;save();render();});
  byId('academyGoto').addEventListener('click', () => {
    const target = document.querySelector(course.steps[stepIndex].target);
    if (!target) return;
    visible(false);
    target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
    if (flashTimeout) clearTimeout(flashTimeout);
    document.querySelectorAll('.academy-focus').forEach(node => node.classList.remove('academy-focus'));
    target.classList.add('academy-focus');
    flashTimeout = setTimeout(() => target.classList.remove('academy-focus'), 2300);
  });
  document.addEventListener('pointerdown', event => {
    if(!panel.hidden && !event.target.closest('.academy-wrap')) visible(false);
  });
  window.addEventListener('keydown', event => { if(event.key==='Escape')visible(false); });
  render();
})();
