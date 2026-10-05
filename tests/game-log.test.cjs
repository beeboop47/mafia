const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

function load(c,name){
  const marker=new RegExp(`    (?:async )?function ${name}\\(`).exec(html);
  assert.ok(marker,`game function ${name} exists`);
  const following=/\n    (?:async )?function /g;following.lastIndex=marker.index+1;
  const next=following.exec(html);
  vm.runInContext(html.slice(marker.index,next?.index??html.length),c);
}
function game(){
  const elements=new Map();
  function element(){
    let content='';const listeners={};
    const el={textContent:'',children:[],dataset:{},classList:{add:()=>{},remove:()=>{}},
      appendChild(child){this.children.push(child);},
      addEventListener(type,fn){listeners[type]=fn;},click(){listeners.click?.();}};
    Object.defineProperty(el,'innerHTML',{get:()=>content,set:value=>{content=value;el.children=[];}});
    return el;
  }
  const c=vm.createContext({state:{phase:'night',round:1,logs:[],players:[],roles:[],night:{pendingAttacks:[],protectedIds:[]}},
    online:{mode:'offline'},structuredClone,document:{createElement:element},
    escapeHtml:text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
    setPhase:()=>{},renderNightKnownRoles:()=>{},renderNewReaction:()=>false,newReactionTurn:()=>null,
    settleUnhandledExtraAttacks:()=>{},isLimitedInvestigation:()=>false,survivePassiveAttack:()=>false,
    changesPrevented:()=>false,roleHasSpecialId:(role,id)=>role?.id===id,
    isPassiveAbility:()=>false,recordExtraChoice:()=>{},
    labelOrientation:value=>value,roleActiveNightAction:role=>role?.nightAction||'none',
    roleNightReaction:role=>role?.nightReaction||'none',NIGHT_ACTIONS:{none:{label:'None'}},NIGHT_REACTIONS:{none:{label:'None'}},
    NIGHT_REACTION_ACTIONS:new Set(['monkey','escape','traitor']),EXTRA_REACTIONS:{},
    narratorCancelAuto:()=>{},narratorResolveTurnEffects:()=>{},finishExtraNight:()=>{},publishReactionAnnouncements:()=>{},
    checkWin:()=>({done:false}),startDay:()=>{},setTimeout:()=>{},hide:()=>{},show:()=>{},
    completeNightTurn:()=>{},completeReactiveTurnOrContinue:()=>{},bumpOnlineVersion:()=>{},
    publishOnlineRoom:async()=>{},setOnlineJoinable:async()=>{},admitPendingOnlinePlayers:()=>{},
    ackOnlineCommand:()=>{},onlineCompleteReactiveOrAdvance:async()=>{}});
  c.$=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  c.roleOf=p=>c.state.roles.find(role=>role.id===p?.roleId);
  c.nightActionFor=p=>c.roleOf(p)?.nightAction||'none';
  c.nightReactionFor=p=>c.roleOf(p)?.nightReaction||'none';
  for (const file of ['judge.js','signal-receiver.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);
  c.playerOf=id=>c.state.players.find(p=>p.id===Number(id));
  c.playersAlive=()=>c.state.players.filter(p=>p.alive&&!p.removed);
  c.roleByIdOrRestore=id=>c.state.roles.find(role=>role.id===id);
  c.recordNightAction=()=>{};
  c.showNightResult=text=>{c.$('nightResult').innerHTML=text;};
  c.setPrivateResult=(id,text)=>{c.state.night.onlineResults||={};c.state.night.onlineResults[id]=text;};
  for(const name of ['addLog','publicGameLogs','publicNightDeaths','publishNightLog','renderGameLog',
    'setPlayerAlive','setNightBusy','findPendingAttacksFor','removePendingAttack','actionButton',
    'renderReactionTurn','showPrivateReaction','applyPermanentRoleChange','finishNight',
    'finishOnlineNightOnline','finishOnlineGame','handleOnlineNightReaction',
    'serializeAuthoritativeState','hydratePersistedState'])load(c,name);
  c.state.roles=[{id:'doctor',title:'Doctor',nightAction:'doctor',orientation:'good'},
    {id:'citizen',title:'Citizen',orientation:'good'},
    {id:'mafia',title:'Mafia',orientation:'evil'},
    {id:'monkey',title:'Monkey',nightReaction:'monkey',orientation:'good'},
    {id:'traitor',title:'Traitor',nightReaction:'traitor',orientation:'neutral'}];
  c.state.players=[{id:0,name:'Alex',roleId:'doctor',alive:true,used:{}},
    {id:1,name:'Blair',roleId:'citizen',alive:true,used:{}},
    {id:2,name:'Casey',roleId:'mafia',alive:true,used:{}}];
  c.state.night.round1Players=c.state.players.slice();
  c.state.night.round=2;
  return c;
}
const messages=c=>Array.from(c.publicGameLogs(),entry=>entry.text);

test('private events are excluded by default, including unclassified saved log entries',()=>{
  const c=game();
  for(const text of ['Alex revived Blair.','Alex saved their one-time revive.',
    'Blair joined the Mafia.','Blair was protected.','Alex changed Blair from Citizen to Mafia.'])c.addLog(text);
  assert.deepEqual(messages(c),[]);
  c.state.logs.push({text:'Old private role change',time:'12:00'},
    {text:'Explicitly private revival',time:'12:01',visibility:'private'});
  c.addLog('Voting was skipped.','public');c.renderGameLog();
  assert.deepEqual(messages(c),['Voting was skipped.']);
  assert.match(c.$('gameLog').innerHTML,/Voting was skipped/);
  assert.doesNotMatch(c.$('gameLog').innerHTML,/role change|revival/);
});
test('role changes still reach the affected player privately without reaching the log',()=>{
  const c=game(),target=c.state.players[1];
  assert.equal(c.applyPermanentRoleChange(target,'mafia',c.state.players[0]),true);
  assert.equal(target.roleId,'mafia');
  assert.match(c.state.night.roleChangeNotices[target.id],/You are now Mafia/);
  assert.deepEqual(messages(c),[]);
});
test('Doctor revivals and saved revivals stay private; only final deaths are logged',()=>{
  for(const revive of [true,false]){
    const c=game(),doctor=c.state.players[0],victim=c.state.players[1];
    c.setPlayerAlive(victim,false);c.addLog('Blair was killed during the night.');
    assert.deepEqual(messages(c),[],'intermediate deaths remain private');
    c.renderReactionTurn(doctor);
    c.$('nightActionArea').children.find(button=>button.textContent===(revive?'Revive Blair':'Save my revive')).click();
    assert.deepEqual(messages(c),[]);
    assert.match(c.$('nightResult').innerHTML,revive ? /was revived/ : /chose not to revive/);
    c.finishNight();
    assert.deepEqual(messages(c),revive?[]:['Blair was killed during the night.']);
  }
});
test('Monkey deaths use public wording without revealing the reaction or attacker',()=>{
  const c=game(),target=c.state.players[1];target.roleId='monkey';
  const attack={targetId:target.id,attackerId:2};c.state.night.pendingAttacks=[attack];
  c.showPrivateReaction(target,attack);
  c.$('nightActionArea').children[0].click();
  assert.equal(target.alive,false);assert.deepEqual(messages(c),[]);
  c.finishNight();c.renderGameLog();
  assert.deepEqual(messages(c),['Blair was killed during the night.']);
  assert.doesNotMatch(c.$('gameLog').innerHTML,/Monkey|confrontation|Casey/);
});
test('a surviving Traitor’s conversion is private even though their role changes',()=>{
  const c=game(),target=c.state.players[1];target.roleId='traitor';
  const attack={targetId:target.id,attackerId:2};c.state.night.pendingAttacks=[attack];
  c.showPrivateReaction(target,attack);c.$('nightActionArea').children[0].click();
  assert.equal(target.roleId,'mafia');assert.equal(target.alive,true);
  c.finishNight();assert.deepEqual(messages(c),[]);
});
test('dawn reports only living players’ final silence and does not duplicate outcomes',()=>{
  const c=game();c.state.players[0].silenced=true;c.state.players[1].silenced=true;
  c.setPlayerAlive(c.state.players[1],false);
  c.publishNightLog();c.publishNightLog();
  assert.deepEqual(messages(c),['Alex is silenced today and cannot vote.','Blair was killed during the night.']);
});
test('cancelled silences and previously dead or removed players produce no new outcomes',()=>{
  const c=game();
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../abilities.js'),'utf8'),c);
  c.isPassiveAbility=()=>false;
  c.state.players[0].silenced=true;c.state.players[1].silenced=true;
  c.state.night.extraActions={2:{action:'removeSilence',targetId:0}};
  c.state.night.blockedIds=[];c.state.night.startAbilities={1:'resistSilence'};
  c.resolveExtraDefenses();
  c.state.players.push({id:3,name:'Drew',alive:false,deadSinceRound:0});
  c.state.players[2].alive=false;c.state.players[2].removed=true;
  c.publishNightLog();assert.deepEqual(messages(c),[]);
});
test('narrator death announcements agree with the final public log after a revival',()=>{
  const c=game(),spoken=[];c.state.narratorMode=true;c.narratorSpeak=text=>spoken.push(text);
  c.state.players[1].alive=false;
  c.finishExtraNight=()=>{c.state.players[1].alive=true;c.state.players[2].alive=false;};
  c.finishNight();
  assert.deepEqual(messages(c),['Casey was killed during the night.']);
  assert.deepEqual(spoken,['Everyone, open your eyes. During the night, Casey died.']);
});
test('online revivals remain private, and online nights publish the same final outcomes',async()=>{
  const c=game(),doctor=c.state.players[0];c.state.players[1].alive=false;
  await c.handleOnlineNightReaction(doctor,1);
  assert.match(c.state.night.onlineResults[0],/You revived Blair/);
  assert.deepEqual(messages(c),[]);
  c.state.players[2].alive=false;c.state.players[1].silenced=true;
  await c.finishOnlineNightOnline();
  assert.equal(c.state.phase,'day');
  assert.deepEqual(messages(c),['Blair is silenced today and cannot vote.','Casey was killed during the night.']);
});
test('persisted logs contain only explicitly public entries, and old private history is hidden on restore',()=>{
  const c=game();
  c.state.logs=[{text:'Private saved history',time:'12:00'},
    {text:'Private revive',time:'12:01',visibility:'private'},
    {text:'Public elimination',time:'12:02',visibility:'public'}];
  const snapshot=c.serializeAuthoritativeState();
  assert.deepEqual(Array.from(snapshot.logs,entry=>entry.text),['Public elimination']);
  snapshot.logs=c.state.logs;
  assert.equal(c.hydratePersistedState(snapshot),true);
  assert.deepEqual(Array.from(c.state.logs,entry=>entry.text),['Public elimination']);
});
