const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const fixture=fs.readFileSync(path.join(__dirname,'new-roles.test.cjs'),'utf8').split('const messages =')[0];
const game=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
function setup(count){
  const c=game(Array(count).fill('citizen'));
  c.renderSetup=()=>{};
  c.roleByIdOrRestore=id=>c.state.roles.find(r=>r.id===id);
  c.status={textContent:''};c.$=()=>c.status;
  vm.runInContext(html.slice(html.indexOf('    const BUILTIN_PRESETS ='),html.indexOf('    const CONFIG_STORAGE_KEY')),c);
  const start=html.indexOf('    function applyPresetDefinition(');
  vm.runInContext(html.slice(start,html.indexOf('    function selectedPresetDefinition',start)),c);
  c.presets=vm.runInContext('BUILTIN_PRESETS',c);
  const narrator=fs.readFileSync(path.join(__dirname,'../narrator.js'),'utf8');
  const narratorStart=narrator.indexOf('function assignNarratorRoles(');
  const narratorEnd=narrator.indexOf('\nfunction ',narratorStart+1);
  vm.runInContext(narrator.slice(narratorStart,narratorEnd<0?undefined:narratorEnd),c);
  c.online.mode='offline';
  return c;
}
test('sized presets deal the advertised roster and do not immediately end the game',()=>{
  const definitions=setup(3).presets;
  for(const [id,def] of Object.entries(definitions).filter(([,d])=>d.players)){
    for(const mode of ['forward','reverse','narrator']){
      const reverse=mode==='reverse';
      const c=setup(def.players);c.shuffle=list=>reverse?[...list].reverse():[...list];
      c.state.narratorMode=mode==='narrator';
      c.state.requireNeutral=true;c.state.autoSideWinChecks=false;
      assert.equal(c.applyPresetDefinition(def),true,id);
      assert.notEqual(c.assignRoles(),false,id);
      const expected={...def.roles};expected.citizen=def.players-Object.values(def.roles).reduce((a,b)=>a+b,0);
      const actual={};for(const p of c.state.players)actual[p.roleId]=(actual[p.roleId]||0)+1;
      assert.deepEqual(actual,expected,id);
      assert.equal(c.checkWin().done,false,id);
      assert.equal(c.state.autoSideWinChecks,true,id);
      assert.equal(c.state.requireNeutral,def.requireNeutral,id);
    }
  }
});
test('wrong player count leaves settings and role pool untouched',()=>{
  const c=setup(4),before=JSON.stringify(c.state);
  assert.equal(c.applyPresetDefinition(c.presets.three_social),false);
  assert.equal(JSON.stringify(c.state),before);
  assert.match(c.status.textContent,/exactly 3 players/);
});
test('three-player introductions have no night kills and reward eliminating Evil',()=>{
  for(const id of ['three_social','three_clues','three_target']){
    const c=setup(3);c.applyPresetDefinition(c.presets[id]);c.assignRoles();
    assert.ok(c.state.players.every(p=>!['kill','teamKill'].includes(c.roleOf(p).nightAction)));
    const evil=c.state.players.find(p=>c.roleOf(p).orientation==='evil');
    if(evil.roleId==='hater')evil.haterTargetId=c.state.players.find(p=>p!==evil).id;
    evil.alive=false;evil.eliminatedByVote=true;
    assert.equal(c.checkWin().winner,'Good',id);
  }
});
test('legacy and custom role-pool presets preserve unspecified win settings and custom roles',()=>{
  const c=setup(5);c.state.roles.push({id:'my_role',title:'Mine',orientation:'good'});
  c.state.requireNeutral=true;c.state.autoSideWinChecks=false;
  c.applyPresetDefinition({roles:{my_role:1}});
  assert.equal(c.state.requireNeutral,true);assert.equal(c.state.autoSideWinChecks,false);
  assert.equal(c.state.roles.find(r=>r.id==='my_role').randomEnabled,true);
});
