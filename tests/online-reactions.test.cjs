const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function extract(name) {
  const start=html.search(new RegExp(`    (?:async )?function ${name}\\(`));
  const tail=html.slice(start+1), end=tail.search(/\n    (?:async )?function /);
  return html.slice(start,start+1+end);
}
function setup(action='rps') {
  let now=100000, publications=0;
  const timers=new Map(), acks=[], results={};let timerId=0;
  const players=[{id:0,name:'Target',alive:true,used:{}},{id:1,name:'Attacker',alive:true,used:{}},{id:2,name:'Other',alive:true,used:{}}];
  const attack={attackerId:1,targetId:0};
  const c=vm.createContext({console,Date:{now:()=>now},
    online:{isHost:true,serverTimeOffset:0},
    state:{phase:'night',round:1,onlineVersion:1,night:{round:2,index:0,pendingAttacks:[attack],onlineAckNeeded:false},players},
    playerOf:id=>players.find(p=>p.id===id),onlineCurrentNightActor:()=>players[0],
    findPendingAttacksFor:id=>c.state.night.pendingAttacks.filter(a=>a.targetId===id),
    nightReactionFor:()=>action,removePendingAttack:a=>c.state.night.pendingAttacks=c.state.night.pendingAttacks.filter(item=>item!==a),
    setPlayerAlive:(p,alive)=>p.alive=alive,addLog:()=>{},setPrivateResult:(id,text)=>results[id]=text,
    onlineCompleteReactiveOrAdvance:async()=>{c.state.night.onlineAckNeeded=true;await c.publishOnlineRoom();},
    ackOnlineCommand:(uid,id,accepted,message)=>acks.push({uid,id,accepted,message}),
    bumpOnlineVersion:()=>c.state.onlineVersion++,
    setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),
    clearInterval:()=>{},document:{},window:{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../online-reactions.js'),'utf8'),c);
  c.publishOnlineRoom=async()=>{publications++;c.ensureOnlineDuel();};
  c.ensureOnlineDuel();
  const send=async(id,kind,extra={})=>{
    const duel=c.state.night.onlineDuel;
    await c.handleOnlineDuelCommand(players[id],{id:duel.id,round:duel.round,kind,...extra},`uid${id}`,`cmd${acks.length}`);
  };
  return {c,players,attack,acks,results,timers,send,setNow:value=>now=value,get publications(){return publications;}};
}
test('RPS locks secret choices, rejects outsiders and replays ties before resolving first to two',async()=>{
  const g=setup();
  assert.equal(g.c.onlineDuelPayload(g.players[2]),null);
  await g.send(2,'choice',{choice:'rock'});
  assert.equal(g.acks.at(-1).accepted,false);
  await g.send(0,'choice',{choice:'rock'});
  const opponent=g.c.onlineDuelPayload(g.players[1]);
  assert.equal(opponent.submitted,false);
  assert.equal(JSON.stringify(opponent).includes('rock'),false);
  await g.send(0,'choice',{choice:'paper'});
  assert.equal(g.acks.at(-1).accepted,false,'cannot change a locked choice');
  await g.send(1,'choice',{choice:'rock'});
  assert.equal(g.c.state.night.onlineDuel.round,2);
  assert.deepEqual({...g.c.state.night.onlineDuel.scores},{});
  for(let round=0;round<2;round++){
    await g.send(0,'choice',{choice:'paper'});await g.send(1,'choice',{choice:'rock'});
  }
  assert.equal(g.c.state.night.onlineDuel,null);
  assert.equal(g.players[0].alive,true);
  assert.equal(g.c.state.night.pendingAttacks.length,0);
  assert.match(g.results[0],/survived/);
  assert.equal(g.results[0],g.results[1]);
});
test('RPS loss is resolved by host and kills the target',async()=>{
  const g=setup();
  for(let round=0;round<2;round++){
    await g.send(1,'choice',{choice:'paper'});await g.send(0,'choice',{choice:'rock'});
  }
  assert.equal(g.players[0].alive,false);
  assert.match(g.results[0],/killed/);
});
test('escape waits for both players, counts only its timed window and resolves higher count',async()=>{
  const g=setup('escape');await g.send(0,'ready');
  assert.equal(g.c.state.night.onlineDuel.startAt,0);
  await g.send(1,'ready');
  const duel=g.c.state.night.onlineDuel;
  assert.equal(duel.endAt-duel.startAt,15000);
  await g.send(0,'taps',{count:3});assert.equal(g.acks.at(-1).accepted,false);
  g.setNow(duel.startAt+5000);
  await g.send(0,'taps',{count:50});await g.send(1,'taps',{count:40});
  await g.send(0,'taps',{count:49});assert.equal(g.acks.at(-1).accepted,false);
  await g.send(0,'taps',{count:9999});assert.equal(g.acks.at(-1).accepted,false);
  g.setNow(duel.endAt+1500);
  await g.c.finishOnlineEscape(duel.id,duel.round);
  assert.equal(g.players[0].alive,true);assert.equal(g.players[0].escaped,true);
  assert.equal(g.c.state.night.onlineDuel,null);
});
test('escape ties ready up again and stale round/id commands cannot affect the new contest',async()=>{
  const g=setup('escape');await g.send(0,'ready');await g.send(1,'ready');
  const duel=g.c.state.night.onlineDuel, firstRound=duel.round;
  g.setNow(duel.endAt+1500);await g.c.finishOnlineEscape(duel.id,duel.round);
  assert.equal(duel.round,2);assert.equal(duel.startAt,0);
  await g.c.handleOnlineDuelCommand(g.players[0],{id:duel.id,round:firstRound,kind:'taps',count:100},'uid0','stale');
  assert.equal(g.acks.at(-1).accepted,false);
  assert.deepEqual({...duel.counts},{});
  await g.send(0,'ready');await g.send(1,'ready');
  g.setNow(duel.startAt+1000);await g.send(1,'taps',{count:20});
  g.setNow(duel.endAt+1500);await g.c.finishOnlineEscape(duel.id,duel.round);
  assert.equal(g.players[0].alive,false);
});
test('late escape timer is harmless after the phase or challenge changes',async()=>{
  const g=setup('escape');await g.send(0,'ready');await g.send(1,'ready');
  const duel=g.c.state.night.onlineDuel;
  g.c.state.phase='day';g.setNow(duel.endAt+2000);
  await g.c.finishOnlineEscape(duel.id,duel.round);
  assert.equal(g.players[0].alive,true);
});

test('restored Firebase contests tolerate omitted empty maps',async()=>{
  const g=setup('rps'),duel=g.c.state.night.onlineDuel;
  delete duel.ready;delete duel.counts;delete duel.choices;delete duel.scores;
  g.c.ensureOnlineDuel();
  await g.send(0,'choice',{choice:'scissors'});
  await g.send(1,'choice',{choice:'paper'});
  assert.equal(duel.scores[0],1);
});

test('self-reported legacy escape/RPS wins do not resolve an online attack',async()=>{
  for(const action of ['escape','rps']){
    const g=setup(action);
    g.c.roleOf=()=>({});g.c.nightActionFor=()=> 'none';g.c.newReactionTurn=()=>null;
    g.c.NIGHT_REACTION_ACTIONS=new Set(['escape','rps']);
    vm.runInContext(extract('handleOnlineNightReaction'),g.c);
    await g.c.handleOnlineNightReaction(g.players[0],action==='escape'?'escaped':'won','uid0','forged');
    assert.equal(g.acks.at(-1).accepted,false);
    assert.equal(g.c.state.night.pendingAttacks.length,1);
  }
});
test('confrontation identifies the attacker in the public result while joining and redirecting retain their handlers',async()=>{
  const g=setup('monkey');
  g.c.roleOf=()=>({});g.c.nightActionFor=()=> 'none';g.c.newReactionTurn=()=>null;
  g.c.NIGHT_REACTION_ACTIONS=new Set(['monkey','traitor','scapegoat']);
  const logs=[];g.c.addLog=(text,visibility)=>logs.push({text,visibility});
  vm.runInContext(extract('handleOnlineNightReaction'),g.c);
  await g.c.handleOnlineNightReaction(g.players[0],'done','uid0','confront');
  assert.equal(g.players[0].alive,false);
  assert.deepEqual(Array.from(g.c.state.night.onlineConfrontations),['Attacker killed Target, who confronted them.']);
  assert.equal(logs[0].visibility,'public');
});
