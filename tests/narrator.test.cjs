const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function setup(){
  const c=vm.createContext({state:{mode:'random',players:[],roles:[]},online:{mode:'offline'},alert:()=>{},
    shuffle:list=>[...list],randomChoice:list=>list[0],EXTRA_ABILITIES:{fakeActivity:{}},
    isPassiveAbility:a=>a==='seer',actionUsesLeft:()=>Infinity,document:{getElementById:()=>({})},window:{},
    newReactionTurn:()=>null,extraNoticesFor:()=>'',hasReactionRoundInfo:a=>['seer','doctor','janitor','inspectOrientation'].includes(a),
    findPendingAttacksFor:id=>id===2?[{targetId:2}]:[],roleHasSpecialId:(r,id)=>r?.id===id});
  c.nightReactionFor=()=> 'none';
  c.roleOf=p=>c.state.roles.find(r=>r.id===p?.roleId);
  c.nightActionFor=p=>c.roleOf(p)?.nightAction||'none';
  for (const file of ['judge.js','signal-receiver.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../narrator.js'),'utf8'),c);
  c.state.roles=[{id:'mafia',orientation:'evil',nightAction:'teamKill'},
    {id:'godfather',orientation:'evil',nightAction:'teamKill'},
    {id:'citizen',title:'Citizen',orientation:'good'},
    {id:'seer',title:'Seer',orientation:'good',nightAction:'seer'},
    {id:'doctor',title:'Doctor',orientation:'good',nightAction:'doctor'},
    {id:'bodyguard',title:'Bodyguard',orientation:'good',nightAction:'protect'},
    {id:'jester',title:'Jester',orientation:'neutral'}];
  return c;
}
test('narrator draws special Evil roles while keeping specials unique and Evil below majority',()=>{
  const c=setup();c.state.requireEvil=true;c.state.requireNeutral=true;
  c.state.players=Array.from({length:7},(_,id)=>({id}));
  assert.equal(c.assignNarratorRoles(),true);
  const ids=c.state.players.map(p=>p.roleId);
  assert.equal(ids.includes('godfather'),true);
  const nonEvil=ids.filter(id=>!['mafia','citizen'].includes(id));assert.equal(new Set(nonEvil).size,nonEvil.length);
  assert.ok(ids.filter(id=>c.state.roles.find(role=>role.id===id)?.orientation==='evil').length<=3);
});
test('narrator rejects duplicate specials but allows a manual special Evil role',()=>{
  const c=setup();c.state.mode='manual';c.state.players=[{id:0,roleId:'seer'},{id:1,roleId:'seer'}];
  assert.equal(c.assignNarratorRoles(),false);
  c.state.players=[{id:0,roleId:'godfather'},{id:1},{id:2}];assert.equal(c.assignNarratorRoles(),true);
});
test('narrator rejects insufficient unique pool without assigning partial roles',()=>{
  const c=setup();c.state.players=Array.from({length:20},(_,id)=>({id}));
  c.state.roles=c.state.roles.filter(r=>r.id!=='citizen');
  assert.equal(c.assignNarratorRoles(),false);assert.equal(c.state.players[0].roleId,undefined);
});
test('narrator permits repeated manual Citizens and fills remaining seats with Citizens',()=>{
  const c=setup();c.state.mode='manual';
  c.state.players=Array.from({length:12},(_,id)=>({id,roleId:id<2?'citizen':undefined}));
  assert.equal(c.assignNarratorRoles(),true);
  assert.ok(c.state.players.filter(p=>p.roleId==='citizen').length>2);
  assert.equal(c.state.players.filter(p=>p.roleId==='seer').length,1);
});
test('narrator protects before Mafia and revives before information turns',()=>{
  const c=setup();c.state.players=['mafia','mafia','citizen','bodyguard','doctor','seer'].map((roleId,id)=>({id,roleId,alive:true}));
  assert.equal(JSON.stringify(c.narratorActionQueue(c.state.players).map(p=>p.roleId)),JSON.stringify(['bodyguard','mafia','doctor','seer']));
});
test('triggered reactions occur before Doctor and idle citizens are skipped',()=>{
  const c=setup();const players=['doctor','citizen','citizen','seer'].map((roleId,id)=>({id,roleId,alive:true}));
  assert.equal(JSON.stringify(c.narratorReactionQueue(players).map(p=>p.id)),JSON.stringify([2,0,3]));
});
test('speech uses role names only and mute keeps the caption without audio',()=>{
  const c=setup();const spoken=[];c.window.speechSynthesis={cancel:()=>{},speak:u=>spoken.push(u.text)};
  c.window.SpeechSynthesisUtterance=true;c.SpeechSynthesisUtterance=function(text){this.text=text;};
  const actor={name:'Secret player name',roleId:'seer'};
  c.narratorSpeak(`${c.narratorRoleName(actor)}, open your eyes.`);
  assert.deepEqual(spoken,['Seer, open your eyes.']);
  c.state.narratorMuted=true;c.narratorSpeak('Seer, close your eyes.');assert.equal(spoken.length,1);
});
test('auto progression requires an explicitly marked single continuation button',()=>{
  const c=setup();
  const ack={dataset:{narratorAuto:'true'},disabled:false};
  const choice={dataset:{narratorAuto:'false'},disabled:false};
  const area=(buttons,form=false)=>({querySelector:()=>form?{}:null,querySelectorAll:()=>buttons});
  assert.equal(c.narratorAutoButton(area([ack])),ack);
  assert.equal(c.narratorAutoButton(area([choice])),null);
  assert.equal(c.narratorAutoButton(area([ack,choice])),null);
  assert.equal(c.narratorAutoButton(area([ack],true)),null);
  ack.disabled=true;assert.equal(c.narratorAutoButton(area([ack])),null);
});
test('continuations advance after five seconds, but choices, pauses, and stale turns do not',()=>{
  const c=setup();let timer,delay,clicked=0;
  c.setTimeout=(fn,ms)=>{timer=fn;delay=ms;return 1;}; c.clearTimeout=()=>{timer=null;};
  const status={textContent:''},button={dataset:{narratorAuto:'true'},disabled:false,isConnected:true,click:()=>clicked++};
  const area={querySelector:()=>null,querySelectorAll:()=>[button]};
  c.document.getElementById=id=>id==='nightActionArea'?area:status;
  c.state.narratorMode=true;c.state.phase='night';c.state.night={index:0,round:1};
  const fire=()=>{const callback=timer;timer=null;callback();};
  c.narratorRefreshAuto();assert.equal(delay,5000);fire();assert.equal(clicked,1);
  c.narratorRefreshAuto();c.state.night.index++;fire();assert.equal(clicked,1);
  c.state.narratorPaused=true;c.narratorRefreshAuto();assert.equal(timer,null);
  c.state.narratorPaused=false;button.dataset.narratorAuto='false';c.narratorRefreshAuto();assert.equal(timer,null);
});
function loadGameFunction(c,name){
  const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const start=source.indexOf(`    function ${name}(`), end=source.indexOf('\n    function ',start+1);
  vm.runInContext(source.slice(start,end),c);
}
test('narrator skips completion acknowledgements immediately but normal mode does not',()=>{
  const c=setup();let clicks=0,timers=0;
  c.setTimeout=()=>{timers++;return 1;};c.clearTimeout=()=>{};
  const button={dataset:{narratorAuto:'true',narratorImmediate:'true',narratorAcknowledgement:'true'},isConnected:true,click:()=>clicks++};
  const area={querySelector:()=>null,querySelectorAll:selector=>selector==='button'?[button]:[]};
  c.document.getElementById=id=>id==='nightActionArea'?area:{};
  c.state.phase='night';c.state.night={round:1,index:0};
  c.state.narratorMode=false;c.narratorRefreshAuto();assert.equal(clicks,0);
  c.state.narratorMode=true;c.narratorRefreshAuto();assert.equal(clicks,1);assert.equal(timers,0);
});
test('private narrator results stay visible until acknowledged, including after pause toggles',()=>{
  const c=setup();let clicks=0,timers=0;
  c.setTimeout=()=>{timers++;return 1;};c.clearTimeout=()=>{};
  c.document.createElement=()=>({dataset:{},addEventListener(){}});
  loadGameFunction(c,'actionButton');
  c.state.narratorMode=true;c.state.phase='night';c.state.night={round:1,index:0};
  const status={textContent:''},prompt={textContent:''};
  for(const value of ['infoAcknowledge','genericInfoAcknowledge','haterInfoAcknowledge','janitorAcknowledge']) {
    const button=c.actionButton('Acknowledge & continue',value,()=>{});
    button.click=()=>clicks++;button.isConnected=true;
    const area={querySelector:()=>null,querySelectorAll:()=>[button]};
    c.document.getElementById=id=>id==='nightActionArea'?area:id==='nightPrompt'?prompt:status;
    for(const paused of [false,true,false]) {
      c.state.narratorPaused=paused;c.narratorRefreshAuto();
      assert.equal(button.hidden,false);
      assert.equal(clicks,0);assert.equal(timers,0);
    }
    assert.match(status.textContent,/Waiting for your acknowledgement/);
  }
  for(const value of ['attackAcknowledge','teamKillUsedAcknowledge','nightKillAcknowledge']) {
    const button=c.actionButton('Acknowledge & continue',value,()=>{});
    assert.equal(button.hidden,true);
    assert.equal(button.dataset.narratorImmediate,'true');
  }
});

test('Mafia kills resolve before later turns and a dead Detective is skipped',()=>{
  const c=setup();c.state.narratorMode=true;c.state.phase='night';
  c.state.roles.push({id:'detective',orientation:'good',nightAction:'inspectOrientation'});
  c.state.players=[{id:0,roleId:'mafia',alive:true},{id:1,roleId:'detective',alive:true}];
  c.playerOf=id=>c.state.players.find(p=>p.id===Number(id));
  c.state.night={round:1,index:1,queue:c.state.players,pendingAttacks:[{targetId:1}],protectedIds:[],extraActions:{}};
  c.NIGHT_REACTION_ACTIONS=new Set();c.EXTRA_REACTIONS={};
  c.removePendingAttack=a=>c.state.night.pendingAttacks.splice(c.state.night.pendingAttacks.indexOf(a),1);
  c.killTarget=p=>{p.alive=false;};c.addLog=()=>{};
  for(const name of ['resolveExtraDefenses','resolvePendingRoleChanges','prepareExtraAttacks','resolveLimitedInvestigations'])c[name]=()=>{};
  loadGameFunction(c,'resolveNightBeforeReactions');c.narratorResolveTurnEffects();
  assert.equal(c.state.players[1].alive,false);
  let skipped=0;c.advanceNightActor=()=>skipped++;
  loadGameFunction(c,'updateNight');c.updateNight();assert.equal(skipped,1);
});
test('the last narrator role ends the night without entering a reaction round',()=>{
  const c=setup();c.state.narratorMode=true;c.state.phase='night';
  c.state.night={round:1,index:0,queue:[{id:0}]};
  c.narratorResolveTurnEffects=()=>{};
  let finished=0;c.finishNight=()=>finished++;c.beginReactionRound=()=>{throw Error('Unexpected reaction round');};
  loadGameFunction(c,'advanceNightActor');c.advanceNightActor();assert.equal(finished,1);
});

// Run the actual night/reaction handlers against a small DOM and controllable clock.
function reactionGame(roleId='monkey'){
  const c=setup(),elements=new Map(),timers=new Map(),spoken=[],normalTurns=[];
  let timerId=0;
  function element(){
    let html='';
    const classes=new Set(),listeners={};
    const el={children:[],dataset:{},textContent:'',disabled:false,isConnected:true,
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},
      appendChild(child){this.children.push(child);child.isConnected=true;},
      querySelector:()=>null,
      querySelectorAll(selector){return this.children.filter(child=>selector==='button'||child.dataset.narratorAcknowledgement==='true');},
      addEventListener(type,callback){listeners[type]=callback;},
      click(){if(!this.disabled)listeners.click?.();}};
    Object.defineProperty(el,'innerHTML',{get:()=>html,set:value=>{
      html=value;el.children.forEach(child=>child.isConnected=false);el.children=[];
    }});
    return el;
  }
  c.document={getElementById:id=>{
    if(!elements.has(id))elements.set(id,element());return elements.get(id);
  },createElement:element};
  c.$=c.document.getElementById;c.escapeHtml=String;
  c.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;};
  c.clearTimeout=id=>timers.delete(id);
  c.state.narratorMode=true;c.state.phase='night';
  c.state.roles.push(
    {id:'detective',title:'Detective',orientation:'good',nightAction:'inspectOrientation'},
    {id:'monkey',title:'Monkey',orientation:'good',nightReaction:'monkey'},
    {id:'escape',title:'Runner',orientation:'good',nightReaction:'escape'},
    {id:'scapegoat',title:'Scapegoat',orientation:'good',nightReaction:'scapegoat'},
    {id:'traitor',title:'Traitor',orientation:'neutral',nightReaction:'traitor'},
    {id:'reactiveDetective',title:'Detective',orientation:'good',nightAction:'inspectOrientation',nightReaction:'escape'});
  c.state.players=['mafia','detective',roleId].map((id,index)=>({id:index,roleId:id,name:`Player ${index}`,alive:true,used:{}}));
  c.playerOf=id=>c.state.players.find(p=>p.id===Number(id));
  c.playersAlive=()=>c.state.players.filter(p=>p.alive);
  c.nightReactionFor=p=>c.roleOf(p)?.nightReaction||'none';
  c.NIGHT_REACTION_ACTIONS=new Set(['monkey','escape','scapegoat','traitor']);c.EXTRA_REACTIONS={};
  c.state.night={round:1,index:0,queue:c.narratorActionQueue(c.state.players),currentActorId:0,
    pendingAttacks:[{attackerId:0,targetId:2,sourceAction:'teamKill'}],protectedIds:[],extraActions:{},
    reactionQueue:[],reactionCompleted:[],narratorHasWoken:true,narratorWakeRoleName:'Mafia',narratorWakeActorId:0,turnRevealed:true};
  c.setPlayerAlive=(p,alive)=>p.alive=alive;
  c.checkWin=()=>({done:false});c.addLog=()=>{};c.setPhase=()=>{};
  c.narratorSpeak=text=>spoken.push(text);
  c.renderNightKnownRoles=actor=>{c.$('nightKnownRoles').innerHTML=`Private role: ${actor.roleId}`;};
  c.renderNewReaction=()=>false;c.settleUnhandledExtraAttacks=()=>{};
  c.renderStandardAction=actor=>normalTurns.push(actor.id);
  c.finishNight=()=>{c.state.phase='day';};
  for(const name of ['resolveExtraDefenses','resolvePendingRoleChanges','prepareExtraAttacks','resolveLimitedInvestigations'])c[name]=()=>{};
  for(const name of ['actionButton','setNightBusy','killTarget','resolveNightBeforeReactions',
    'findPendingAttacksFor','removePendingAttack','ensureReactionQueued','adjacentLiving',
    'showPrivateReaction','renderScapegoatReaction','renderReactionTurn','completeReactiveTurnOrContinue',
    'completeNightTurn','updateNightHandoffGate','advanceNightActor','updateNight'])loadGameFunction(c,name);
  const fire=()=>{
    assert.equal(timers.size,1,'one transition timer');
    const [id,task]=timers.entries().next().value;assert.equal(task.ms,5000);
    timers.delete(id);task.fn();
  };
  return {c,timers,spoken,normalTurns,fire};
}
test('Monkey interrupts Mafia, waits for the confrontation, then resumes with Detective',()=>{
  const {c,timers,spoken,normalTurns,fire}=reactionGame();
  c.$('nightKnownRoles').innerHTML='Private Mafia information';
  c.completeNightTurn();
  assert.deepEqual(spoken,['Mafia, close your eyes.']);
  assert.equal(c.$('nightActionArea').children.length,0);
  assert.equal(c.$('nightKnownRoles').innerHTML,'');
  assert.equal(c.$('resolveNightBtn').disabled,true);
  fire();
  assert.equal(c.state.night.index,0,'original queue position held during interruption');
  assert.equal(c.state.night.currentActorId,2);
  assert.deepEqual(spoken,['Mafia, close your eyes.','Monkey, open your eyes.']);
  const button=c.$('nightActionArea').children[0];
  assert.equal(button.textContent,'Reaction complete');
  assert.equal(button.dataset.narratorAuto,'false');
  c.narratorRefreshAuto();assert.equal(timers.size,0,'reaction never times out');
  assert.equal(c.state.players[2].alive,true);assert.deepEqual(normalTurns,[]);
  button.click();
  assert.equal(c.state.players[2].alive,false);
  assert.equal(c.state.night.pendingAttacks.length,0);
  assert.equal(c.$('nightActionArea').children.length,0);
  fire();
  assert.deepEqual(spoken,['Mafia, close your eyes.','Monkey, open your eyes.','Monkey, close your eyes.','Detective, open your eyes.']);
  assert.deepEqual(normalTurns,[1]);
  assert.equal(c.state.night.narratorReactionActorId,null);
});
test('a surviving reaction keeps the target’s normal ability in its later turn',()=>{
  const {c,spoken,normalTurns,fire}=reactionGame('reactiveDetective');
  c.completeNightTurn();fire();
  c.$('nightActionArea').children.find(b=>b.textContent==='I escaped').click();
  assert.equal(c.state.players[2].alive,true);
  assert.deepEqual(normalTurns,[],'no extra ability during the interruption');
  assert.equal(c.state.night.narratorInfoShown[2],undefined,'no investigation result during the interruption');
  fire();assert.deepEqual(normalTurns,[1]);
  c.hasReactionRoundInfo=()=>false;
  c.completeNightTurn();fire();
  assert.deepEqual(normalTurns,[1,2]);
  assert.equal(spoken.filter(text=>text==='Detective, open your eyes.').length,3);
});
test('a redirected attack interrupts again, even when the next target already acted',()=>{
  const {c,spoken,normalTurns,fire}=reactionGame('scapegoat');
  c.state.players[1].roleId='monkey';
  c.state.night.queue=[c.state.players[0]];
  c.completeNightTurn();fire();
  c.$('nightActionArea').children.find(b=>b.textContent==='Redirect to Player 1').click();
  assert.equal(c.state.players[2].alive,true);
  fire();
  assert.deepEqual(spoken,['Mafia, close your eyes.','Scapegoat, open your eyes.','Scapegoat, close your eyes.','Monkey, open your eyes.']);
  assert.equal(c.state.phase,'night','last role cannot end the night while a reaction is pending');
  c.$('nightActionArea').children[0].click();fire();
  assert.equal(c.state.phase,'day');assert.equal(c.state.players[1].alive,false);
  assert.deepEqual(normalTurns,[]);
});
test('ordinary and protected deaths do not wake an idle reactive role',()=>{
  for(const protectedTarget of [false,true]){
    const {c,spoken,normalTurns,fire}=reactionGame();
    if(protectedTarget)c.state.night.protectedIds=[2];
    else c.state.players[2].roleId='citizen';
    c.completeNightTurn();fire();
    assert.deepEqual(spoken,['Mafia, close your eyes.','Detective, open your eyes.']);
    assert.equal(c.state.players[2].alive,protectedTarget);
    assert.deepEqual(normalTurns,[1]);
  }
});
test('pause and stale transition timers cannot reveal the next role',()=>{
  const {c,timers,spoken,fire}=reactionGame();
  c.completeNightTurn();
  const stale=timers.values().next().value.fn;
  c.state.narratorPaused=true;c.narratorRefreshAuto();
  assert.equal(timers.size,0);assert.equal(c.$('nightActionArea').children.length,0);
  stale();assert.deepEqual(spoken,['Mafia, close your eyes.']);
  c.state.narratorPaused=false;c.narratorRefreshAuto();fire();
  assert.deepEqual(spoken,['Mafia, close your eyes.','Monkey, open your eyes.']);
  stale();assert.deepEqual(spoken,['Mafia, close your eyes.','Monkey, open your eyes.']);
});
test('a converted Traitor closes using their original wake announcement',()=>{
  const {c,spoken,fire}=reactionGame('traitor');
  c.recordNightAction=()=>{};c.roleByIdOrRestore=id=>c.state.roles.find(r=>r.id===id);
  c.completeNightTurn();fire();c.$('nightActionArea').children[0].click();
  assert.equal(c.state.players[2].roleId,'mafia');
  assert.deepEqual(spoken,['Mafia, close your eyes.','Traitor, open your eyes.','Traitor, close your eyes.']);
  fire();assert.equal(c.state.night.currentActorId,1);
});
test('normal mode retains its manual pass and reaction round buttons',()=>{
  const {c,timers,spoken}=reactionGame();c.state.narratorMode=false;
  c.completeNightTurn();
  assert.match(c.$('nightActionArea').children[0].textContent,/Pass to Player 1/);
  assert.equal(timers.size,0);assert.deepEqual(spoken,[]);
  c.state.night.index=c.state.night.queue.length-1;c.state.night.handoffReady=true;
  c.updateNightHandoffGate();
  assert.equal(c.$('nightActionArea').children[0].textContent,'Begin reaction round');
});

// Exercise ordering through the real abilities, choices, resolutions and UI
// transitions, rather than only asserting a sorted list of role names.
function mechanicsGame(roles){
  const g=reactionGame('citizen'),c=g.c;
  for(const file of ['reactions.js','abilities.js','roles.js','host-setup.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);
  c.state.roles=vm.runInContext('DEFAULT_ROLES.map(role=>({...role}))',c);
  c.state.round=1;
  for(const name of ['roleOf','roleActiveNightAction','roleNightReaction','nightActionFor','nightReactionFor',
    'gamblerAbilityPool','hasReactionRoundInfo','normalizedRoleOptions','actionUsesLeft','markNightAbilityUsed',
    'validAbilityTargets','setPlayerAlive','labelOrientation','isKillingRole','isTeamKillRole','teamKillGroupKey',
    'showNightResult','setChoiceAndContinue','recordNightAction','queueNightRoleChange','resolvePendingRoleChanges',
    'applyPermanentRoleChange','isLimitedInvestigation','limitedInvestigationChoices','recordLimitedInvestigation',
    'resolveLimitedInvestigations','limitedInvestigationResult','effectiveRoleOf','investigationSubject',
    'investigationRoleOf','trackReport'])loadGameFunction(c,name);
  c.state.players=roles.map((role,id)=>{
    if(typeof role==='object')c.state.roles.push({title:role.id,orientation:'good',...role});
    return {id,roleId:typeof role==='string'?role:role.id,name:`Player ${id}`,alive:true,used:{}};
  });
  c.state.night={round:1,index:0,queue:[],round1Players:c.state.players.slice(),pendingAttacks:[],
    protectedIds:[],blockedIds:[],trackTargets:{},watchTargets:{},inspectTargets:{},seerTargets:{},
    gamblerActions:{},usedTeamKillRoleIds:[],reactionQueue:[],reactionCompleted:[],haterTargets:{},
    narratorHasWoken:true,turnRevealed:false};
  c.sortedRoles=roles=>roles||c.state.roles;
  const start=()=>{
    for(const player of c.state.players){
      if(c.roleActiveNightAction(c.roleOf(player))==='gambler')c.state.night.gamblerActions[player.id]=c.scheduledGamblerAbility(player);
      if(c.nightActionFor(player)==='seer')c.state.night.seerTargets[player.id]=c.scheduledSeerTarget(player,c.playersAlive().filter(p=>p.id!==player.id));
    }
    c.initializeExtraNight();
    c.state.night.queue=c.narratorActionQueue(c.state.players);c.updateNight();
  };
  const acknowledge=()=>{
    for(let i=0;i<4&&!c.state.night.narratorTransition;i++){
      const button=c.$('nightActionArea').children.find(b=>b.dataset.narratorAcknowledgement==='true');
      if(!button)break;button.click();
    }
  };
  const choose=(id,value)=>{
    assert.equal(c.state.night.currentActorId,id);c.setChoiceAndContinue(c.playerOf(id),value);
    acknowledge();g.fire();
  };
  return {...g,start,choose,acknowledge};
}
const extraChoice=(targetId,second='')=>JSON.stringify({targetId,second});

test('Mafia coordination waits for the group before named Evil ability turns',()=>{
  const g=mechanicsGame(['mafia','anaesthetist','citizen','citizen']);
  g.c.state.night.queue=g.c.narratorActionQueue(g.c.state.players);
  g.c.state.night.narratorWakeRoleName=null;
  g.c.narratorBeginTransition('mafiaMeeting');g.fire();
  assert.match(g.spoken[0],/^Mafia, open your eyes/);
  assert.equal(g.timers.size,0,'discussion has no automatic timeout');
  assert.equal(g.c.$('nightKnownRoles').innerHTML,'');
  const button=g.c.$('nightActionArea').children[0];
  assert.equal(button.textContent,'Finish Mafia discussion');
  assert.equal(button.dataset.narratorAuto,'false');
  button.click();
  assert.equal(g.spoken[1],'Mafia, close your eyes.');
  g.fire();
  assert.equal(g.spoken[2],'Anaesthetist, open your eyes.');
  assert.equal(g.c.state.night.currentActorId,1);
  g.choose(1,0);
  assert.ok(g.c.state.night.blockedIds.includes(0),'Anaesthetist retains roleblocking');
});

test('starting an actual narrator night schedules discussion before any ability is revealed',()=>{
  const g=mechanicsGame(['mafia','anaesthetist','citizen','citizen']);
  for(const name of ['startNight','getConfiguredNightOrder','buildNightActionQueue'])loadGameFunction(g.c,name);
  g.c.clearDaySilence=()=>{};
  g.c.show=()=>{};g.c.hide=()=>{};
  g.c.narratorStartAuto=()=>g.c.narratorRefreshAuto();
  g.c.startNight();
  assert.deepEqual(g.spoken,['Everyone, close your eyes.']);
  assert.equal(g.c.state.night.narratorTransition.kind,'mafiaMeeting');
  assert.equal(g.c.$('nightKnownRoles').innerHTML,'');
  g.fire();
  assert.match(g.spoken[1],/^Mafia, open your eyes/);
  assert.equal(g.timers.size,0);
});

test('special Evil abilities and faction kill are distinct, with passive Henchman skipped',()=>{
  const g=mechanicsGame(['mafia','godfather','anaesthetist','hacker','hater','henchman','propagandist','citizen']);
  const queue=g.c.narratorActionQueue(g.c.state.players);
  assert.deepEqual(Array.from(queue,player=>player.roleId),['anaesthetist','hacker','hater','propagandist','godfather']);
  assert.equal(g.c.nightActionFor(g.c.playerOf(2)),'roleblock');
  assert.equal(g.c.nightActionFor(g.c.playerOf(3)),'framer');
  assert.equal(g.c.roleOf(g.c.playerOf(4)).winCondition,'sideWhenTargetVotedOut');
  assert.equal(g.c.teamKillGroupKey(g.c.roleOf(g.c.playerOf(0))),'evil');
  assert.equal(g.c.teamKillGroupKey(g.c.roleOf(g.c.playerOf(1))),'evil');
  g.c.state.night.blockedIds=[1];
  assert.equal(g.c.narratorActionQueue(g.c.state.players).find(player=>g.c.nightActionFor(player)==='teamKill').id,0);
});

test('queued discussion skips when other Evil players are dead or removed',()=>{
  for(const excluded of ['dead','removed']) {
    const g=mechanicsGame(['mafia','anaesthetist','citizen','citizen']);
    if(excluded==='dead')g.c.playerOf(1).alive=false;
    else g.c.playerOf(1).removed=true;
    g.c.state.night.queue=g.c.narratorActionQueue(g.c.state.players.filter(player=>player.alive&&!player.removed));
    g.c.state.night.narratorWakeRoleName=null;
    g.c.narratorBeginTransition('mafiaMeeting');g.fire();
    assert.equal(g.spoken.some(text=>/Discuss your plans/.test(text)),false);
    assert.equal(g.c.$('nightActionArea').children.some(button=>button.textContent==='Finish Mafia discussion'),false);
  }
});

test('one living Evil player skips discussion and goes directly to narrator ability turns',()=>{
  const g=mechanicsGame(['mafia','citizen','citizen']);
  for(const name of ['startNight','getConfiguredNightOrder','buildNightActionQueue'])loadGameFunction(g.c,name);
  g.c.clearDaySilence=()=>{};g.c.show=()=>{};g.c.hide=()=>{};
  g.c.narratorStartAuto=()=>g.c.narratorRefreshAuto();
  g.c.startNight();
  assert.equal(g.c.state.night.narratorTransition.kind,'wake');
  g.fire();
  assert.equal(g.spoken[1],'Mafia, open your eyes.');
  assert.equal(g.c.$('nightActionArea').children.some(button=>button.textContent==='Finish Mafia discussion'),false);
});

test('passive Policeman has no narrator night turn or eye announcements',()=>{
  const g=mechanicsGame(['policeman','citizen']);
  assert.equal(g.c.narratorActionQueue(g.c.state.players).length,0);
  assert.equal(g.c.narratorReactionQueue(g.c.state.players).length,0);
  g.start();
  assert.equal(g.spoken.some(text=>/Policeman, (open|close) your eyes/.test(text)),false);
});

test('completion without a wake announcement cannot invent a close-eyes announcement',()=>{
  const g=reactionGame();
  g.c.state.night.narratorWakeRoleName=null;
  g.c.completeNightTurn();
  assert.deepEqual(g.spoken,[]);
});

test('Doctor and Janitor stay asleep when there are no bodies, including the first turn',()=>{
  for(const roles of [['doctor','citizen'],['janitor','citizen'],['doctor','janitor','citizen']]) {
    const g=mechanicsGame(roles);
    g.c.finishNight=()=>{g.c.narratorSpeak('Everyone, open your eyes.');g.c.state.phase='day';};
    g.c.narratorSpeak('Everyone, close your eyes.');
    g.start();
    assert.deepEqual(g.spoken,['Everyone, close your eyes.','Everyone, open your eyes.']);
    assert.equal(g.timers.size,0);
    assert.equal(g.c.$('nightActionArea').children.length,0);
  }
});

test('protected night attacks do not create a Doctor or Janitor wake',()=>{
  const g=mechanicsGame(['mafia','bodyguard','doctor','janitor','citizen']);g.start();
  g.choose(1,4);g.choose(0,4);
  assert.equal(g.c.playerOf(4).alive,true);
  assert.equal(g.spoken.some(text=>/^(Doctor|Janitor), (open|close) your eyes/.test(text)),false);
  assert.equal(g.c.state.phase,'day');
});

test('a spent Doctor skips while Janitor still waits to inspect a fresh body',()=>{
  const g=mechanicsGame(['mafia','doctor','janitor','citizen']);
  g.c.playerOf(1).used.doctor=true;
  g.start();g.choose(0,3);
  assert.equal(g.c.state.night.currentActorId,2);
  assert.equal(g.spoken.includes('Janitor, open your eyes.'),true);
  assert.equal(g.spoken.includes('Janitor, close your eyes.'),false);
  assert.equal(g.timers.size,0);
  g.c.$('nightActionArea').children.find(button=>button.textContent==='Inspect Player 3').click();
  assert.equal(g.c.$('nightActionArea').children[0].hidden,false);
  assert.equal(g.timers.size,0,'inspection result waits for acknowledgement');
  g.acknowledge();g.fire();
  assert.equal(g.spoken.some(text=>/^Doctor, (open|close) your eyes/.test(text)),false);
});

test('a stale wake label cannot close a different actor',()=>{
  const g=reactionGame();
  g.c.state.night.narratorWakeRoleName='Janitor';
  g.c.state.night.narratorWakeActorId=99;
  g.c.completeNightTurn();
  assert.deepEqual(g.spoken,[]);
});

test('normal spoken announcements queue without cancelling an earlier wake',()=>{
  const c=setup();let cancels=0;
  const spoken=[];
  c.window.speechSynthesis={cancel:()=>cancels++,speak:u=>spoken.push(u.text)};
  c.window.SpeechSynthesisUtterance=true;
  c.SpeechSynthesisUtterance=function(text){this.text=text;};
  c.narratorSpeak('Janitor, open your eyes.');
  c.narratorSpeak('Janitor, close your eyes.');
  assert.deepEqual(spoken,['Janitor, open your eyes.','Janitor, close your eyes.']);
  assert.equal(cancels,0);
  c.narratorSpeak('Janitor, close your eyes.',true);
  assert.equal(cancels,1,'explicit replay can interrupt');
});

test('Bodyguard protection stops Mafia and independent kills, even if Bodyguard later dies',()=>{
  for(const mafiaTarget of [1,2]){
    const g=mechanicsGame(['mafia','citizen','bodyguard','samurai']);g.start();
    g.choose(2,1);g.choose(0,mafiaTarget);g.choose(3,1);
    assert.equal(g.c.playerOf(1).alive,true);
    assert.equal(g.c.playerOf(2).alive,mafiaTarget!==2);
    assert.equal(g.c.state.night.pendingAttacks.length,0);
  }
});

test('roleblock precedes protection and stops the protected action before a kill',()=>{
  const g=mechanicsGame(['bodyguard','mafia','citizen',{id:'blocker',nightAction:'roleblock'}]);g.start();
  g.choose(3,0);
  assert.equal(g.spoken.some(text=>/^Bodyguard, (open|close) your eyes/.test(text)),false);
  g.choose(1,2);
  assert.equal(g.c.playerOf(2).alive,false);
  assert.equal(g.c.state.night.actionRecords[0],undefined);
});

test('roleblocked Detective is skipped silently without revealing information',()=>{
  const g=mechanicsGame(['anaesthetist','detective','mafia','citizen']);g.start();
  g.choose(0,1);
  assert.equal(g.spoken.some(text=>/^Detective, (open|close) your eyes/.test(text)),false);
  assert.equal(g.c.state.night.currentActorId,2);
  assert.equal(g.c.state.night.actionRecords[1],undefined);
  assert.equal(g.c.state.night.narratorInfoShown?.[1],undefined);
});

test('a block arriving during the wake delay is checked before speaking',()=>{
  const g=mechanicsGame(['detective','citizen']);
  g.c.state.night.queue=g.c.narratorActionQueue(g.c.state.players);
  g.c.state.night.narratorHasWoken=false;
  g.c.updateNight();
  g.c.state.night.blockedIds=[0];
  g.fire();
  assert.equal(g.spoken.some(text=>/^Detective, (open|close) your eyes/.test(text)),false);
});

test('Block Harm is active before roleblocking and killing',()=>{
  const g=mechanicsGame([{id:'blocker',nightAction:'roleblock'},'mafia','citizen',{id:'shield',nightAction:'blockHarm'}]);g.start();
  g.choose(3,extraChoice(1));g.choose(0,1);
  assert.equal(g.c.state.night.blockedIds.includes(1),false);
  g.choose(1,2);assert.equal(g.c.playerOf(2).alive,false);
});

test('blocking one Mafia leaves the other eligible, while blocking the whole team stops its kill',()=>{
  for(const blockBoth of [false,true]){
    const roles=['mafia','mafia','citizen',{id:'blocker',nightAction:'roleblock'}];
    if(blockBoth)roles.push({id:'secondBlocker',nightAction:'roleblock'});
    const g=mechanicsGame(roles);g.start();g.choose(3,0);
    if(blockBoth){
      g.choose(4,1);assert.equal(g.c.playerOf(2).alive,true);
      assert.equal(g.spoken.some(text=>text==='Mafia, open your eyes.'),false);
    }else{
      assert.equal(g.c.state.night.currentActorId,1);g.choose(1,2);
      assert.equal(g.c.playerOf(2).alive,false);
    }
  }
});

test('Leader grants an idle Citizen a protection turn before Mafia',()=>{
  const g=mechanicsGame(['leader','citizen','mafia']);g.start();
  g.c.setChoiceAndContinue(g.c.playerOf(0),1);
  g.c.$('nightActionArea').children.find(b=>b.textContent.startsWith('Bodyguard')).click();
  g.fire();assert.equal(g.c.state.night.currentActorId,1);
  g.choose(1,0);g.choose(2,0);assert.equal(g.c.playerOf(0).alive,true);
});

test('Prevent Changes precedes Leader',()=>{
  const g=mechanicsGame(['leader','citizen',{id:'ward',nightAction:'preventChanges'},'mafia']);g.start();
  g.choose(2,extraChoice(1));g.c.setChoiceAndContinue(g.c.playerOf(0),1);
  g.c.$('nightActionArea').children.find(b=>b.textContent.startsWith('Bodyguard')).click();g.fire();
  assert.equal(g.c.playerOf(1).roleId,'citizen');
  assert.equal(g.c.state.night.currentActorId,3);
});

test('changing an already completed ability does not grant a second action that night',()=>{
  const g=mechanicsGame([{id:'copier',nightAction:'copyAbility'},
    {id:'modifier',nightAction:'changeAbility'},'samurai','citizen']);g.start();
  g.choose(0,extraChoice(2));g.choose(1,extraChoice(0,'kill'));
  assert.equal(g.c.nightActionFor(g.c.playerOf(0)),'kill');
  assert.equal(g.c.state.night.currentActorId,2);
  assert.equal(g.c.state.night.queue.slice(g.c.state.night.index).some(p=>p.id===0),false);
  assert.equal(g.normalTurns.filter(id=>id===0).length,1);
});

test('Framer acts before Detective and its deception persists after its death',()=>{
  const g=mechanicsGame(['detective','mafia','citizen','framer']);g.start();
  g.c.setChoiceAndContinue(g.c.playerOf(3),2);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Mafia').click();g.fire();
  g.choose(1,3);assert.equal(g.c.playerOf(3).alive,false);
  g.c.setChoiceAndContinue(g.c.playerOf(0),2);
  assert.match(g.c.$('nightResult').innerHTML,/Evil/);
});

test('Janitor inspects a body before Doctor revives it, and a revived Detective gets its turn',()=>{
  const g=mechanicsGame(['janitor','doctor','mafia','detective']);g.start();g.choose(2,3);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Inspect Player 3').click();
  assert.match(g.c.$('nightResult').innerHTML,/Detective/);g.acknowledge();g.fire();
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Revive Player 3').click();
  g.acknowledge();g.fire();assert.equal(g.c.playerOf(3).alive,true);
  assert.equal(g.c.state.night.currentActorId,3);g.c.setChoiceAndContinue(g.c.playerOf(3),2);
  assert.match(g.c.$('nightResult').innerHTML,/Evil/);
});

test('Track and Check Activity wait for later investigators to make their choices',()=>{
  const g=mechanicsGame([{id:'auditor',nightAction:'audit'},'lookout','detective','citizen']);g.start();
  g.choose(0,2);assert.equal(g.c.state.night.limitedResults[0],undefined);
  g.choose(1,2);assert.equal(g.c.state.night.narratorInfoShown[1],undefined);
  g.choose(2,3);assert.equal(g.c.state.night.narratorReporting,true);
  assert.match(g.c.$('nightResult').innerHTML,/used a night ability/);
  g.acknowledge();g.fire();
  assert.match(g.c.$('nightResult').innerHTML,/visited Player 3 and used Inspect orientation/);
  g.acknowledge();g.fire();assert.equal(g.c.state.phase,'day');
});

test('Detect Attack reports one final result and includes protected attempts',()=>{
  const g=mechanicsGame([{id:'sensor',nightAction:'detectAttack'},'bodyguard','mafia','samurai','citizen']);g.start();
  g.choose(1,0);g.choose(2,0);g.choose(3,4);
  assert.deepEqual(Array.from(g.c.state.night.extraNotices[0]),['Someone attempted to attack you tonight.']);
  g.acknowledge();g.fire();
  assert.equal(g.c.state.night.extraNotices[0].length,1);
});

test('Take Attack redirects a pending reactive attack only once across narrator transitions',()=>{
  const g=mechanicsGame([{id:'escortA',nightAction:'takeAttack',nightReaction:'escape'},
    {id:'escortB',nightAction:'takeAttack',nightReaction:'escape'},'citizen','mafia']);g.start();
  g.choose(0,extraChoice(1));g.choose(1,extraChoice(2));g.choose(3,2);
  assert.equal(g.c.state.night.currentActorId,1);
  g.c.narratorResolveTurnEffects();assert.equal(g.c.state.night.pendingAttacks[0].targetId,1);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='I escaped').click();g.fire();
  assert.equal(g.c.playerOf(1).alive,true);assert.equal(g.c.playerOf(2).alive,true);
});

test('a Scapegoat redirected kill respects Bodyguard protection',()=>{
  const g=mechanicsGame(['bodyguard','citizen','scapegoat','mafia']);g.start();
  g.choose(0,1);g.choose(3,2);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Redirect to Player 1').click();g.fire();
  assert.equal(g.c.playerOf(1).alive,true);assert.equal(g.c.playerOf(2).alive,true);
});

test('Gambler is ordered by its actual ability, including a new Gambler created by Leader',()=>{
  const g=mechanicsGame(['mafia','gambler','citizen']);
  g.c.playerOf(1).hostSetup={gamblerSchedule:{1:'protect'}};g.start();
  assert.equal(g.c.state.night.currentActorId,1);g.choose(1,2);g.choose(0,2);
  assert.equal(g.c.playerOf(2).alive,true);
  const changed=mechanicsGame(['leader','citizen','mafia']);
  changed.c.playerOf(1).hostSetup={gamblerSchedule:{1:'protect'}};changed.start();
  changed.c.setChoiceAndContinue(changed.c.playerOf(0),1);
  changed.c.$('nightActionArea').children.find(b=>b.textContent.startsWith('Gambler')).click();changed.fire();
  assert.equal(changed.c.state.night.currentActorId,1);
  assert.equal(changed.c.nightActionFor(changed.c.playerOf(1)),'protect');
});

test('private notes reach an otherwise idle Citizen in the final information turns',()=>{
  const g=mechanicsGame([{id:'messenger',nightAction:'sendNote'},'citizen']);g.start();
  g.choose(0,JSON.stringify({targetId:1,text:'A private clue'}));
  assert.equal(g.c.state.night.currentActorId,1);
  assert.equal(g.c.state.night.narratorReporting,true);
  assert.match(g.c.extraNoticesFor(g.c.playerOf(1)),/A private clue/);
  g.acknowledge();g.fire();assert.equal(g.c.state.phase,'day');
});

test('a passive changed into a deception ability can still apply its new choice',()=>{
  const g=mechanicsGame([{id:'changer',nightAction:'changeAbility'},
    {id:'survivor',nightAction:'surviveOnce'},'detective','mafia','citizen']);g.start();
  g.choose(0,extraChoice(1,'hideAllegiance'));g.choose(1,extraChoice(3));g.choose(3,4);
  g.c.setChoiceAndContinue(g.c.playerOf(2),3);
  assert.match(g.c.$('nightResult').innerHTML,/Neutral/);
});

test('Block Reaction precedes attacks and suppresses the targeted reaction',()=>{
  const g=mechanicsGame([{id:'suppressor',nightAction:'blockReaction'},'mafia','monkey']);g.start();
  g.choose(0,extraChoice(2));g.choose(1,2);
  assert.equal(g.c.playerOf(2).alive,false);
  assert.equal(g.spoken.includes('Monkey, open your eyes.'),false);
});

test('Random Allegiance reports once, after deception and deaths have settled',()=>{
  const g=mechanicsGame([{id:'oracle',nightAction:'randomAllegiance'},'mafia','citizen','framer']);g.start();
  g.c.setChoiceAndContinue(g.c.playerOf(3),1);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Citizen').click();g.fire();
  assert.equal(g.c.state.night.randomAllegianceTargets,undefined);
  g.choose(1,3);
  assert.deepEqual(Array.from(g.c.state.night.extraNotices[0]),['Player 1 is Good.']);
  g.acknowledge();g.fire();assert.equal(g.c.state.night.extraNotices[0].length,1);
});

test('Signal Receiver wakes for a private reaction hint after a narrated revival',()=>{
  const g=mechanicsGame(['signal_receiver','doctor','mafia','citizen']);
  g.c.finishNight=()=>{g.c.finishExtraNight();g.c.state.phase='day';};
  g.start();g.choose(2,3);
  assert.equal(g.c.playerOf(0).dawnMessages.length,0);
  g.c.$('nightActionArea').children.find(b=>b.textContent==='Revive Player 3').click();
  g.acknowledge();g.fire();
  assert.equal(g.c.state.phase,'night');
  assert.match(g.c.$('nightResult').innerHTML,/Signal Receiver — night 1:/);
  assert.equal(g.c.playerOf(0).dawnMessages.length,0);
  assert.equal(g.spoken.includes('Signal Receiver, open your eyes.'),true);
  g.acknowledge();g.fire();
  assert.equal(g.c.state.phase,'day');
  assert.equal(g.c.playerOf(0).dawnMessages.length,0);
  assert.ok(g.c.signalHintPool(g.c.playerOf(0)).deaths.some(h=>h.message==='Player 3 died during tonight and was revived.'));
});

test('narrator keeps the Receiver before a later investigator in normal report order',()=>{
  const g=mechanicsGame(['signal_receiver',{id:'auditor',nightAction:'audit'},'citizen']);g.start();g.choose(1,2);
  assert.deepEqual(Array.from(g.c.state.night.queue,p=>p.id),[0,1]);
  assert.equal(g.c.state.night.currentActorId,0);
  assert.match(g.c.$('nightResult').innerHTML,/As of this reaction turn/);
  g.acknowledge();g.fire();assert.equal(g.c.state.night.currentActorId,1);
});

test('narrator excludes Judge from attack choices and automatically assigned Seer targets',()=>{
  const g=mechanicsGame(['judge','seer','mafia','citizen']);
  g.c.playerOf(1).hostSetup={seerSchedule:{1:0}};g.start();
  assert.notEqual(g.c.state.night.seerTargets[1],0);
  assert.equal(g.c.state.night.currentActorId,2);
  assert.ok(!g.c.$('nightActionArea').children.some(b=>b.textContent==='Player 0'));
  g.choose(2,3);
  assert.equal(g.c.playerOf(0).alive,true);
});
