const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const fixture=fs.readFileSync(path.join(__dirname,'expansion.test.cjs'),'utf8').split('const active=')[0];
const game=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
function setup(action,reaction){
  const c=game(action);c.playerOf(2).roleOverrides={nightReaction:reaction};
  c.state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];c.recordNightAction(c.playerOf(1),'kill',2);c.prepareExtraAttacks();c.state.night.round=2;
  configureReport(c,action);return c;
}
function configureReport(c,action){
  const n=c.state.night;
  if(action==='seer'){n.seerTargets={0:1};n.round1SeerTargets={0:1};}
  if(action==='inspectOrientation'){n.inspectTargets={0:1};n.round1InspectTargets={0:1};}
  if(action==='track'){n.trackTargets={0:1};c.recordNightAction(c.playerOf(0),'track',1);}
  if(action==='compareVisitors')c.recordExtraChoice(c.playerOf(0),action,{targetId:1,second:'4'});
}
function nextNight(c,action,order){
  c.state.round++;const players=order.map(c.playerOf).filter(p=>p.alive);
  c.state.night={round:1,index:0,queue:players.slice(),round1Players:players.slice(),pendingAttacks:[],blockedIds:[],protectedIds:[],actionRecords:{},reactionQueue:[],reactionCompleted:[]};
  c.initializeExtraNight();c.resolveExtraDefenses();c.resolveExtraEffects();
  c.recordNightAction(c.playerOf(1),'kill',4);c.recordNightAction(c.playerOf(3),'protect',1,{targetIds:[1,4]});configureReport(c,action);
  c.state.night.round=2;c.state.night.reactionQueue=players.slice();return players.map(p=>p.id);
}
function report(c){
  const payload=c.onlinePrivatePayloadFor(c.playerOf(0));
  return [payload.result,payload.turn?.prompt,payload.extraNotices].filter(Boolean).join('\n');
}
const cases=[
 ['counterframe','seer','choose:doctor',/Player 1 is Mafia/,/Player 1 is Doctor/],
 ['falseColours','inspectOrientation','choose:good',/Player 1 is Evil/,/Player 1 is Good/],
 ['plantEscapeRoute','track','choose:3',/visited Player 2/,/visited Player 3/],
 ['eraseFootprints','track','activate',/visited Player 2/,/visited Player 4/],
 ['borrowTheirFace','seer','activate',/Player 1 is Mafia/,/Player 1 is Mafia/],
 ['scrambleWitnesses','compareVisitors','activate',/shared at least one visitor/,/had no shared visitor/]
];
for(const [reaction,action,value,currentExpected,nextExpected] of cases)test(`${reaction}: immediate current reports and pre-applied next-night effects match in either player order`,()=>{
 const final=[];
 for(const order of [[0,2,1,3,4,5],[2,0,1,3,4,5]]){
  const c=setup(action,reaction),n=c.state.night;n.reactionQueue=order.map(c.playerOf);
  for(const id of order){n.index=order.indexOf(id);if(id===0){const result=report(c);assert.match(result,currentExpected);assert.doesNotMatch(result,/at dawn|settle|wait/);}if(id===2)c.resolveNewReaction(c.playerOf(2),value);}
  assert.deepEqual(Array.from(n.reactionQueue,p=>p.id),order);c.finishExtraNight();assert.ok(c.state.players.every(p=>!p.dawnMessages.length));
  const nextOrder=nextNight(c,action,order);c.state.night.index=nextOrder.indexOf(0);const result=report(c);assert.match(result,nextExpected);assert.doesNotMatch(result,/at dawn|settle|wait/);final.push(result);
  assert.deepEqual(Array.from(c.state.night.reactionQueue,p=>p.id),nextOrder);
 }
 assert.equal(final[0],final[1]);
});
test('Secure Information bypasses the scheduled next-night disguise',()=>{
 const c=setup('seer','counterframe');c.resolveNewReaction(c.playerOf(2),'choose:doctor');const order=nextNight(c,'seer',[0,1,2,3,4,5]);c.state.night.index=order.indexOf(0);c.state.night.infoSecure.push(0);assert.match(report(c),/Player 1 is Mafia/);
});
test('scheduled disguises survive saving and expire after their one intended night',()=>{
 const c=setup('seer','counterframe');c.resolveNewReaction(c.playerOf(2),'choose:doctor');c.playerOf(2).pendingReactionDeceptions=JSON.parse(JSON.stringify(c.playerOf(2).pendingReactionDeceptions));
 let order=nextNight(c,'seer',[0,1,2,3,4,5]);c.state.night.index=order.indexOf(0);assert.match(report(c),/is Doctor/);
 order=nextNight(c,'seer',[0,1,2,3,4,5]);c.state.night.index=order.indexOf(0);assert.match(report(c),/is Mafia/);
});
test('conflicting scheduled disguises use stable seat IDs, not activation order',()=>{
 for(const order of [[2,4],[4,2]]){
  const c=setup('seer','counterframe');c.playerOf(4).roleOverrides={nightReaction:'counterframe'};const attack={attackerId:1,targetId:4,sourceAction:'kill'};c.state.night.pendingAttacks.push(attack);c.recordSignalAttack(attack);
  for(const id of order)c.resolveNewReaction(c.playerOf(id),id===2?'choose:doctor':'choose:citizen');
  nextNight(c,'seer',[0,1,2,3,4,5]);assert.equal(c.investigationRoleOf(c.playerOf(1),0).title,'Doctor');
 }
});
test('legacy deferred reports and old current-night reaction masks are removed without changing the queue',()=>{
 const c=setup('seer','counterframe'),n=c.state.night;n.reactionQueue=c.state.players.slice();n.reactionTimingVersion=2;n.deferredNightReports={0:{action:'seer'}};n.queuedCounterattacks=[{attackerId:2,targetId:1}];n.reactionReportMasks={1:{title:'Doctor'}};n.replyRequests=[{targetId:0}];
 c.restoreReactionTimingState();assert.equal(n.deferredNightReports,undefined);assert.equal(n.queuedCounterattacks,undefined);assert.equal(n.replyRequests.length,0);assert.equal(c.investigationRoleOf(c.playerOf(1),0).title,'Mafia');assert.deepEqual(Array.from(n.reactionQueue,p=>p.id),[0,1,2,3,4,5]);
});
test('next-night deception cannot falsify Signal Receiver hints or change actual identities',()=>{
 const c=setup('seer','counterframe');c.resolveNewReaction(c.playerOf(2),'choose:doctor');nextNight(c,'seer',[0,1,2,3,4,5]);assert.equal(c.roleOf(c.playerOf(1)).title,'Mafia');
 assert.ok(c.signalHintPool(c.playerOf(0)).roles.some(h=>h.message==='Player 1 is Mafia when this signal was received.'));
});
test('next-night disguise is already active before the first action and survives ordinary effect initialization',()=>{
 const c=setup('seer','counterframe');c.resolveNewReaction(c.playerOf(2),'choose:doctor');c.state.round=2;
 c.state.night={round:1,queue:[c.playerOf(1),c.playerOf(0)],pendingAttacks:[],blockedIds:[],protectedIds:[],actionRecords:{}};
 c.initializeExtraNight();assert.equal(c.investigationRoleOf(c.playerOf(1),0).title,'Doctor');assert.deepEqual(Array.from(c.state.night.queue,p=>p.id),[1,0]);
 c.resolveExtraDefenses();c.resolveExtraEffects();assert.equal(c.investigationRoleOf(c.playerOf(1),0).title,'Doctor');
});
test('Read Last Night uses its existing narrator turn without adding a later report turn',()=>{
 const source=fs.readFileSync(path.join(__dirname,'narrator.test.cjs'),'utf8').replace("const {test}=require('node:test');",'const test=()=>{};');
 const mechanicsGame=new Function('require','__dirname',source+'\nreturn mechanicsGame;')(require,__dirname);
 const g=mechanicsGame([{id:'memoryReader',title:'Memory Reader',nightAction:'predictDeath'},'mafia','citizen']);
 g.start();g.choose(0,JSON.stringify({targetId:2}));g.choose(1,2);
 assert.equal(g.spoken.filter(text=>text==='Memory Reader, open your eyes.').length,1);
 assert.ok(g.c.state.players.every(p=>p.dawnMessages.length===0));
});
