const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'presets.test.cjs'),'utf8').split("test('new presets")[0];
const setup=new Function('require','__dirname',source+'\nreturn setup;')(require,__dirname);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function load(c,name){const start=html.indexOf(`    function ${name}(`);vm.runInContext(html.slice(start,html.indexOf('\n    function ',start+1)),c);}
for(const [id,orientation] of [['red_herring','good'],['lone_operation','neutral'],['colonised_town','evil'],['great_minds',null]]){
  test(`${id} assigns every seat, ignores ordinary minima, and continues to two`,()=>{
    for(const narrator of [false,true]){
      const c=setup(6);c.state.narratorMode=narrator;c.state.requireEvil=true;c.state.requireNeutral=true;
      c.applyPresetDefinition(c.presets[id]);c.assignRoles();
      assert.equal(c.state.activeTrickRound.id,id);
      if(orientation)assert.ok(c.state.players.every(p=>c.roleOf(p).orientation===orientation));
      else assert.equal(new Set(c.state.players.map(p=>p.roleId)).size,1);
      assert.equal(c.checkWin().done,false);
      // Even a completed special victory must not stop a trick round early.
      c.state.roles.find(r=>r.id===c.state.players[0].roleId).winCondition='votedOut';
      c.state.players[0].alive=false;c.state.players[0].eliminatedByVote=true;
      assert.equal(c.checkWin().done,false);
      c.state.players.slice(0,4).forEach(p=>p.alive=false);
      assert.equal(c.checkWin().done,true);
    }
  });
}
test('hidden trick rounds suppress explicit recognition, public visibility, and team lists',()=>{
  for(const id of ['great_minds','colonised_town']){
    const c=setup(4);c.applyPresetDefinition(c.presets[id]);c.assignRoles();
    c.state.roles.find(r=>r.id===c.state.players[0].roleId).visibility='everyone';
    c.state.players[0].hostSetup={recognises:[1]};
    assert.equal(c.visibleTo(c.state.players[0],c.state.players[1]),false);
    load(c,'coordinatedKillMembers');
    assert.deepEqual(Array.from(c.coordinatedKillMembers(c.state.players[0]),p=>p.id),[0]);
    load(c,'renderKnownRoles');
    c.renderKnownRoles(c.state.players[0],'test');assert.equal(c.status.innerHTML,'');
  }
});
test('surprises can use a role outside Classic and ordinary/manual games clear trick rules',()=>{
  const c=setup(4);c.applyPresetDefinition(c.presets.classic);c.state.surpriseRoundChance=1;
  const original=c.randomChoice;c.randomChoice=list=>list.includes('lone_operation')?'lone_operation':original(list);
  c.assignRoles();assert.equal(c.state.activeTrickRound.id,'lone_operation');
  assert.ok(c.state.players.every(p=>c.roleOf(p).orientation==='neutral'));
  c.state.surpriseRoundChance=0;c.assignRoles();assert.equal(c.state.activeTrickRound,null);
  c.state.mode='manual';c.state.trickPreset='colonised_town';c.assignRoles();assert.equal(c.state.activeTrickRound,null);
});
test('trick state survives authoritative save and restore',()=>{
  const c=setup(4);c.applyPresetDefinition(c.presets.colonised_town);c.assignRoles();
  load(c,'serializeAuthoritativeState');c.publicGameLogs=()=>[];
  const saved=c.serializeAuthoritativeState();
  assert.equal(saved.trickPreset,'colonised_town');assert.equal(saved.activeTrickRound.noRecognition,true);
});
