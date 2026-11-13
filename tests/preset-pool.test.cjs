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
  const c=game(2);
  c.customPresets={town:{name:'Town',roles:{detective:1}}};
  c.state.presetPool=['builtin:classic','builtin:lone_operation','custom:deleted','custom:town'];
  const draw=c.chooseRoundPreset();
  assert.equal(draw[0],'custom:town');
  c.assignRoles();
  assert.equal(c.state.activePreset.key,'custom:town');
  assert.equal(c.state.activeTrickRound,null);
});
test('empty and ineligible pools leave setup untouched',()=>{
  const c=game(2);
  for(const pool of [[],['builtin:classic']]){
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
  c.state.presetPool=['builtin:classic'];
  const original=JSON.stringify(c.state.roles);
  c.assignRoles();
  assert.ok(c.state.players.every(p=>p.roleId!=='mine'));
  c.restorePresetLibrary();
  assert.equal(c.state.mode,'manual');
  assert.equal(c.state.players[0].roleId,'mine');
  assert.equal(JSON.stringify(c.state.roles),original);
});
test('saved preferences drop removed presets and retain the older choices',()=>{
  const c=game();
  c.restorePresetSettings({presetSource:'pool',selectedPreset:'builtin:verified_clues',
    presetPool:['builtin:verified_clues','builtin:classic','custom:mine']});
  assert.equal(c.state.presetSource,'pool');
  assert.equal(c.state.selectedPreset,'builtin:classic');
  assert.deepEqual(Array.from(c.state.presetPool),['builtin:classic','custom:mine']);
});
test('old blind preferences migrate to an explicit pool and active choices survive save and restore',()=>{
  const c=game();
  c.restorePresetSettings({blindSetup:true,blindComplexity:'varied',blindAllowTricks:true});
  assert.equal(c.state.presetSource,'pool');
  assert.ok(c.state.presetPool.includes('builtin:great_minds'));
  c.state.presetPool=['builtin:classic'];c.assignRoles();
  const snapshot=c.serializeAuthoritativeState();
  const resumed=game();resumed.hydratePersistedState(snapshot);
  assert.deepEqual(Array.from(resumed.state.presetPool),['builtin:classic']);
  assert.equal(resumed.state.activePreset.key,'builtin:classic');
});
