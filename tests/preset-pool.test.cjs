const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'presets.test.cjs'),'utf8').split("test('new presets")[0];
const setup=new Function('require','__dirname',source+'\nreturn setup;')(require,__dirname);
function game(count=4){
  const c=setup(count);
  c.state.presetSource='pool';
  return c;
}
test('the random draw uses only checked presets that fit the roster',()=>{
  const c=game(3);
  c.state.presetPool=['builtin:verified_clues','builtin:lone_operation','custom:deleted','builtin:contested_vote'];
  c.randomChoice=list=>{assert.deepEqual(Array.from(list,entry=>entry[0]),c.state.presetPool.slice(0,2));return list[0];};
  c.assignRoles();
  assert.equal(c.state.activePreset.key,'builtin:verified_clues');
  assert.equal(c.state.activeTrickRound,null);
  assert.equal(c.state.activePreset.nightFirst,true);
});
test('empty and ineligible pools leave setup untouched',()=>{
  const c=game(2);
  for(const pool of [[],['builtin:verified_clues']]){
    c.state.presetPool=pool;
    const before=JSON.stringify(c.state);
    assert.equal(c.assignRoles(),false);
    assert.equal(JSON.stringify(c.state),before);
  }
});
test('the manually chosen preset takes precedence over the random pool',()=>{
  const c=game();
  c.state.presetSource='preset';
  c.state.selectedPreset='builtin:classic';
  c.state.presetPool=['builtin:colonised_town'];
  c.assignRoles();
  assert.equal(c.state.activePreset.key,'builtin:classic');
  assert.equal(c.state.activeTrickRound,null);
});
test('preset games restore the custom library and manual role choices',()=>{
  const c=game();
  c.state.roles.push({id:'mine',title:'Mine',orientation:'good'});
  c.state.mode='manual';
  c.state.players[0].roleId='mine';
  c.state.presetPool=['builtin:false_trail'];
  const original=JSON.stringify(c.state.roles);
  c.assignRoles();
  assert.ok(c.state.players.every(p=>p.roleId!=='mine'));
  c.restorePresetLibrary();
  assert.equal(c.state.mode,'manual');
  assert.equal(c.state.players[0].roleId,'mine');
  assert.equal(JSON.stringify(c.state.roles),original);
});
test('all no-kill presets deal their featured cast at three and four players',()=>{
  for(const count of [3,4])for(const narrator of [false,true]){
    const c=game(count);
    c.state.narratorMode=narrator;
    c.state.autoSideWinChecks=false;
    for(const [id,def] of Object.entries(c.presets).filter(([,def])=>def.cast && count >= (def.minPlayers || 3))){
      c.state.presetPool=['builtin:'+id];
      c.assignRoles();
      const dealt=c.state.players.map(p=>p.roleId);
      assert.deepEqual(Array.from(dealt).sort(),Array.from([...def.cast,...Array(count-def.cast.length).fill('citizen')]).sort());
      assert.ok(c.state.players.every(p=>!['kill','teamKill','gambler','changeRole'].includes(c.nightActionFor(p))));
      assert.equal(c.checkWin().done,false);
      c.state.players.find(p=>c.roleOf(p).orientation==='evil').alive=false;
      assert.equal(c.checkWin().winner,'Good');
    }
  }
});
test('old blind preferences migrate to an explicit pool and active choices survive save and restore',()=>{
  const c=game();
  c.restorePresetSettings({blindSetup:true,blindComplexity:'varied',blindAllowTricks:true});
  assert.equal(c.state.presetSource,'pool');
  assert.ok(c.state.presetPool.includes('builtin:great_minds'));
  c.state.presetPool=['builtin:verified_clues'];c.assignRoles();
  const snapshot=c.serializeAuthoritativeState();
  const resumed=game();resumed.hydratePersistedState(snapshot);
  assert.deepEqual(Array.from(resumed.state.presetPool),['builtin:verified_clues']);
  assert.equal(resumed.state.activePreset.nightFirst,true);
  assert.ok(resumed.state.roles.some(role=>role.id==='preset_verifier'));
});
