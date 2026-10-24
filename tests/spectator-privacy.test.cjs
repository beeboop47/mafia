const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extract(name){
  const start=html.search(new RegExp(`    (?:async )?function ${name}\\(`));
  const rest=html.slice(start+1);
  return html.slice(start,start+1+rest.search(/\n    (?:async )?function /));
}
test('roles stay private through death, Doctor revival window, and dawn; unlock next night',()=>{
  const p={id:1,alive:true};
  const state={players:[p],phase:'night',round:1,night:{}};
  const c=vm.createContext({state,isJudge:()=>false,survivePassiveAttack:()=>false,nightActionFor:()=> 'none',roleOf:()=>({orientation:'good'})});
  vm.runInContext(extract('setPlayerAlive')+extract('canSeeDeadSpectatorRoles'),c);
  c.setPlayerAlive(p,false);
  assert.equal(c.canSeeDeadSpectatorRoles(p),false);
  state.phase='day';state.round++;
  assert.equal(c.canSeeDeadSpectatorRoles(p),false);
  // Run each actual night-start prefix, stopping before turn setup.
  for(const name of ['startNight','startOnlineNight']){
    p.spectatorRolesUnlocked=false;
    const prefix=extract(name).split("state.phase")[0].replace(/(?:async )?function \w+\(\) \{/, '');
    c.narratorCancelAuto=()=>{};c.clearDaySilence=()=>{};
    vm.runInContext(prefix,c);
    assert.equal(c.canSeeDeadSpectatorRoles(p),true,name);
  }
  c.setPlayerAlive(p,true);
  assert.equal(c.canSeeDeadSpectatorRoles(p),false);
  state.phase='night';state.night={};
  c.setPlayerAlive(p,false);
  assert.equal(c.canSeeDeadSpectatorRoles(p),false,'another death starts a fresh privacy window');
});

test('local and online known-role lists do not bypass the dead spectator delay',()=>{
  const viewer={id:1,alive:false,roleId:'citizen'};
  const hidden={id:2,name:'Hidden Mafia',roleId:'mafia'};
  const recognised={id:3,name:'Known Detective',roleId:'detective'};
  const roles={citizen:{id:'citizen',orientation:'good',visibility:'nobody'},mafia:{id:'mafia',title:'Mafia',orientation:'evil',visibility:'nobody'},detective:{id:'detective',title:'Detective',orientation:'good',visibility:'nobody'}};
  const el={innerHTML:''};
  const c=vm.createContext({state:{players:[viewer,hidden,recognised]},roleOf:p=>roles[p.roleId],hostSettings:()=>({recognises:[3]}),roleHasSpecialId:()=>false,$:()=>el,escapeHtml:s=>s,rolePill:()=>''});
  vm.runInContext(['canSeeDeadSpectatorRoles','visibleTo','renderKnownRoles','onlineKnownRolesFor'].map(extract).join('\n'),c);
  for(const unlocked of [false,true,false]){
    viewer.spectatorRolesUnlocked=unlocked;
    c.renderKnownRoles(viewer,'nightKnownRoles');
    assert.equal(el.innerHTML.includes('Hidden Mafia'),unlocked);
    assert.equal(el.innerHTML.includes('Known Detective'),true);
    assert.equal(c.onlineKnownRolesFor(viewer).some(p=>p.id===2),unlocked);
  }
  viewer.alive=true;viewer.spectatorRolesUnlocked=true;
  assert.equal(c.visibleTo(viewer,hidden),false,'revival cannot retain spectator access');
});
