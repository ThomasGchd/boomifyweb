const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g),m=>m[1]));
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'guide-data.js'),'utf8'),ctx);
const courses = ctx.window.BoomifyGuides;
test('courses are not empty, have distinct stable IDs and an introduction',()=>{
 assert.ok(Array.isArray(courses));
 assert.ok(courses.length>0);
 assert.equal(new Set(Array.from(courses,c=>c.id)).size,courses.length);
 assert.equal(courses[0].id,'acid-techno');
});
test('steps have clear beginner instructions and valid UI targets',()=>{
 for(const course of courses){
  assert.ok(course.title&&course.genre&&course.level&&Array.isArray(course.steps));
  assert.ok(course.steps.length>=3);
  for(const step of course.steps){
   for(const field of ['title','goal','instruction','check','tip','target','action'])assert.ok(typeof step[field]==='string'&&step[field].length>0,field);
   assert.ok(step.target.startsWith('#'));
   assert.ok(ids.has(step.target.slice(1)),step.target+' absent from HTML');
  }
 }
});
test('academy drawer controls exist without modifying project model',()=>{
 for(const id of ['academyBtn','academyPanel','academyClose','academyNext','academyPrev','academyGoto','academyRestart','academyStepTitle','academyProgress'])assert.ok(ids.has(id),id);
 const academy=fs.readFileSync(path.join(root,'academy.js'),'utf8');
 assert.ok(!academy.includes('window.BoomifyStorage'));
 assert.ok(!academy.includes('project.tracks'));
 assert.ok(!academy.includes('openProject('));
});
