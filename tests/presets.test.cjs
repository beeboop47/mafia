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
  c.presets=vm.runInContext('BUILTIN_PRESETS',c);
  for (const name of ['presetEntries','presetMinimumPlayers','assignPresetRoles','assignTrickRoundRoles','restorePresetLibrary','restorePresetSettings','serializeAuthoritativeState','hydratePersistedState']) {
    const start=html.indexOf(`    function ${name}(`);
    vm.runInContext(html.slice(start,html.indexOf('\n    function ',start+1)),c);
  }
  c.readCustomPresets=()=>c.customPresets||{};
  c.publicGameLogs=()=>[];
  c.state.phase='setup';
  c.state.presetSource='preset';
  c.state.selectedPreset='builtin:classic';
  c.state.presetPool=[];
  const narrator=fs.readFileSync(path.join(__dirname,'../narrator.js'),'utf8');
  const narratorStart=narrator.indexOf('function assignNarratorRoles(');
  const narratorEnd=narrator.indexOf('\nfunction ',narratorStart+1);
  vm.runInContext(narrator.slice(narratorStart,narratorEnd<0?undefined:narratorEnd),c);
  c.online.mode='offline';
  return c;
}
test('new presets are flexible role pools at small and large player counts',()=>{
  for(const id of ['investigation','survival','deception','confrontation','wildcards']){
    for(const count of [3,4,6,10])for(const narrator of [false,true]){
      const c=setup(count),def=c.presets[id];
      assert.equal(def.players,undefined);
      c.state.narratorMode=narrator;c.state.requireEvil=false;c.state.requireNeutral=false;
      c.state.autoSideWinChecks=false;
      c.state.selectedPreset='builtin:'+id;
      assert.notEqual(c.assignRoles(),false,id);
      assert.equal(c.state.autoSideWinChecks,false);
      assert.equal(c.state.requireEvil,false);
      assert.equal(c.state.requireNeutral,false);
      assert.equal(c.state.players.length,count);
      assert.ok(c.state.players.every(p=>p.roleId==='citizen'||def.roles[p.roleId]),id);
      assert.ok(c.state.players.filter(p=>c.roleOf(p).orientation==='evil').length<=Math.floor((count-1)/2));
    }
  }
});
test('removed player-count presets are absent and original presets remain',()=>{
  const c=setup(3);
  for(const id of ['three_social','three_clues','three_target','four_rescue','five_classic','six_survival','eight_team'])assert.equal(c.presets[id],undefined);
  for(const id of ['classic','chaos','trickery','protection'])assert.ok(c.presets[id]);
});
test('legacy and custom role-pool presets preserve unspecified win settings and custom roles',()=>{
  const c=setup(5);c.state.roles.push({id:'my_role',title:'Mine',orientation:'good'});
  c.state.requireNeutral=true;c.state.autoSideWinChecks=false;
  c.customPresets={mine:{name:'Mine',roles:{my_role:1}}};
  c.state.selectedPreset='custom:mine';
  assert.notEqual(c.assignRoles(),false);
  assert.equal(c.state.requireNeutral,true);assert.equal(c.state.autoSideWinChecks,false);
  assert.ok(c.state.players.some(p=>p.roleId==='my_role'));
  assert.equal(c.state.roles.find(r=>r.id==='my_role').randomEnabled,true);
});
