const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'presets.test.cjs'),'utf8').split("test('new presets")[0];
const setup=new Function('require','__dirname',source+'\nreturn setup;')(require,__dirname);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function game(count=5){const c=setup(count);const a=html.indexOf('    function prepareBlindSetup(');vm.runInContext(html.slice(a,html.indexOf('\n    function ',a+1)),c);return c;}
test('blind ordinary games secretly choose a valid preset and retain both factions',()=>{
  for(const narrator of [false,true])for(const count of [3,5,9]){
    const c=game(count);c.state.blindSetup=true;c.state.narratorMode=narrator;
    c.shuffle=list=>[...list].reverse();c.assignRoles();
    assert.equal(c.state.activeBlindSetup,true);assert.equal(c.state.mode,'random');
    assert.ok(c.state.blindPresetResult.name);assert.equal(c.state.activeTrickRound,null);
    assert.ok(c.state.players.some(p=>c.roleOf(p).orientation==='good'));
    assert.ok(c.state.players.some(p=>c.roleOf(p).orientation==='evil'));
    assert.equal(c.checkWin().done,false);
  }
});
test('blind trick selection uses hidden rules and ordinary host configuration cannot override it',()=>{
  const c=game();c.state.blindSetup=true;c.state.blindAllowTricks=true;
  vm.runInContext('Math.random=()=>0',c);c.assignRoles();
  assert.equal(c.state.activeTrickRound.id,'great_minds');
  c.state.players[0].hostSetup={challenge:'Speak softly.',recognises:[1],haterTarget:1,abilitySchedule:{1:{action:'kill',value:'1'}}};
  const config=c.hostSettings(c.state.players[0]);
  assert.equal(config.challenge,'Speak softly.');assert.equal(config.recognises,undefined);assert.equal(config.abilitySchedule,undefined);
});
test('blind setup preserves the custom role library for later ordinary games',()=>{
  const c=game();c.state.roles.push({id:'mine',title:'Mine',orientation:'good'});
  const original=JSON.stringify(c.state.roles);c.state.blindSetup=true;c.assignRoles();
  assert.equal(JSON.stringify(c.state.blindLibraryBackup),original);
  c.state.blindSetup=false;c.prepareBlindSetup();assert.equal(JSON.stringify(c.state.roles),original);
});
test('blind setup refuses two players without changing the game',()=>{
  const c=game(2);c.state.blindSetup=true;const original=JSON.stringify(c.state);
  assert.equal(c.assignRoles(),false);assert.equal(JSON.stringify(c.state),original);
});
