const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const fixture=fs.readFileSync(path.join(__dirname,'new-roles.test.cjs'),'utf8').split('const messages =')[0];
const game=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
function context(){const c=game();vm.runInContext(fs.readFileSync(path.join(__dirname,'../guide.js'),'utf8'),c);return c;}
test('guide explains every role, active ability and night reaction',()=>{
  const c=context();
  for(const section of ['roles','abilities','reactions']){
    const entries=c.guideCatalog(section);assert.ok(entries.length>20);
    for(const entry of entries){assert.ok(entry.name);assert.ok(entry.category);assert.ok(entry.description?.length>15,entry.name);}
  }
  const abilityNames=c.guideCatalog('abilities').map(e=>e.name);
  const reactionNames=c.guideCatalog('reactions').map(e=>e.name);
  assert.ok(!abilityNames.includes('Rock, Paper, Scissors'));
  assert.ok(reactionNames.includes('Rock, Paper, Scissors'));
});
test('guide reflects custom role definitions without reading player assignments',()=>{
  const c=context();c.state.roles.push({id:'example',title:'Example',orientation:'good',description:'A custom example role.',nightAction:'protect',nightReaction:'brace'});
  Object.defineProperty(c.state,'players',{get(){throw Error('Guide read secret assignments');}});
  const entry=c.guideCatalog('roles').find(e=>e.name==='Example');
  assert.match(entry.extra,/Protect a player/);assert.match(entry.extra,/Brace/);
  assert.ok(c.guideCatalog('abilities').length);
});
