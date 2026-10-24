const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const fixture=fs.readFileSync(path.join(__dirname,'new-roles.test.cjs'),'utf8').split('const messages =')[0];
const createGame=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function game(action='none',reaction='none'){
  const c=createGame(['citizen','mafia','citizen','doctor','citizen','leader']);
  c.state.roles.push({id:'testRole',title:'Test role',orientation:'good',nightAction:action,nightReaction:reaction});
  c.playerOf(0).roleId='testRole';
  c.state.night={round:1,pendingAttacks:[],protectedIds:[],blockedIds:[],actionRecords:{},round1Actions:{},reactionQueue:[],reactionCompleted:[]};
  c.initializeExtraNight();
  for(const name of ['findPendingAttacksFor','removePendingAttack','ensureReactionQueued','resolveNightBeforeReactions','killTarget','limitedInvestigationResult']){
    const match=new RegExp(`    (?:async )?function ${name}\\(`).exec(html),next=/\n    (?:async )?function /g;
    next.lastIndex=match.index+1;vm.runInContext(html.slice(match.index,next.exec(html)?.index??html.length),c);
  }
  return c;
}
const active=(c,action,targetId=2,second='',text='Test message',actorId=0)=>c.recordExtraChoice(c.playerOf(actorId),action,{targetId,second,text});
const settle=c=>{c.resolveExtraDefenses();c.resolveExtraEffects();c.prepareExtraAttacks();};
const abilityIds=['inspectReaction','traceAllegiance','checkProtection','findInterference','compareVisitors','examineRemains','forgeReaction','swapReports','falseProtection','concealVisitor','forgeInterference','plantEvidence','exchangeAbilities','exchangeReactions','borrowReaction','temporaryConversion','restoreIdentity','bestowAbility','piercingAttack','ambush','sabotage','jamInvestigation','delayedStrike','exhaustReaction','singleWard','sanctuary','secureInformation','guardReaction','reserveShield','secondChance','visitorCounter','changeAwareness','blockAwareness','deathEcho','firstContact','deceptionAlarm','deadLetter','sealedReply','publicNotice','recognitionLink','contingencyNote','passToken'];
test('42 new abilities have six entries in each category, and all six reaction categories have six',()=>{
  const c=game();const counts={};
  for(const id of abilityIds){const spec=vm.runInContext(`EXTRA_ABILITIES.${id}`,c);assert.ok(spec.label&&spec.prompt,id);counts[spec.category]=(counts[spec.category]||0)+1;}
  assert.equal(abilityIds.length,42);assert.equal(Object.keys(counts).length,7);Object.values(counts).forEach(n=>assert.equal(n,6));
  const reactions=vm.runInContext('Object.values(NIGHT_REACTIONS)',c),groups={};
  reactions.forEach(r=>groups[r.category]=(groups[r.category]||0)+1);
  assert.equal(reactions.length,36);assert.deepEqual(Object.keys(groups).sort(),['Deceitful','Defensive','Investigative','Redirective','Retaliatory','Transformative']);Object.values(groups).forEach(n=>assert.equal(n,6));
});
for(const action of abilityIds)test(`${action} can be submitted and resolved through the shared night engine`,()=>{
  const c=game(action),spec=vm.runInContext(`EXTRA_ABILITIES.${action}`,c);
  if(spec.dead)c.setPlayerAlive(c.playerOf(2),false);
  if(action==='borrowReaction')c.playerOf(2).roleOverrides={nightReaction:'escape'};
  const choices=c.extraChoices(c.playerOf(0),action);
  const second=spec.second==='player'?'4':spec.second==='allegiance'?'evil':spec.second==='reaction'?'escape':spec.second==='ability'?'protect':'';
  const choice=c.parseExtraChoice(c.playerOf(0),action,JSON.stringify({targetId:spec.noTarget?null:2,second,text:'Test message'}));
  c.recordExtraChoice(c.playerOf(0),action,choice);
  settle(c);c.proposedInfoResult(c.playerOf(0));c.finishExtraNight();
  assert.ok(choices);
  if(spec.once)assert.throws(()=>c.parseExtraChoice(c.playerOf(0),action,JSON.stringify({targetId:2,second,text:'Again'})),/already been spent/);
});
test('forged investigation results can be overridden by Secure Information',()=>{
  const c=game('inspectReaction');active(c,'inspectReaction');active(c,'forgeReaction',2,'escape','',1);active(c,'falseProtection',2,'','',4);
  settle(c);assert.match(c.proposedInfoResult(c.playerOf(0)),/Escape/);
  c.state.night.infoSecure.push(0);assert.match(c.proposedInfoResult(c.playerOf(0)),/no night reaction/);
  c.state.night.extraActions[0].action='checkProtection';assert.match(c.proposedInfoResult(c.playerOf(0)),/did not receive/);
  c.state.night.infoSecure=[];assert.match(c.proposedInfoResult(c.playerOf(0)),/received/);
});
test('Swap Reports and Plant Evidence never change actual roles',()=>{
  const c=game('swapReports');active(c,'swapReports',1,'2');settle(c);
  assert.equal(c.investigationRoleOf(c.playerOf(1),0).orientation,'good');assert.equal(c.roleOf(c.playerOf(1)).orientation,'evil');
  c.state.night.infoSecure.push(0);assert.equal(c.investigationRoleOf(c.playerOf(1),0).orientation,'evil');
  c.state.night.reportSwaps={};c.state.night.plantedEvidence=[1];c.playerOf(1).roleOverrides={orientation:'neutral'};c.state.night.infoSecure=[];
  assert.equal(c.investigationRoleOf(c.playerOf(1),0).orientation,'evil');
});
test('Conceal Visitor hides the chosen destination, and secure Track restores it',()=>{
  const c=game('concealVisitor');c.recordNightAction(c.playerOf(1),'kill',2);active(c,'concealVisitor',1,'2');settle(c);
  assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/no recorded/);
  c.state.night.infoSecure.push(4);assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/Player 2/);
});
test('single wards stop only one attack; piercing bypasses ordinary protection',()=>{
  const c=game('singleWard');active(c,'singleWard',2);c.state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'},{attackerId:4,targetId:2,sourceAction:'kill'}];settle(c);
  assert.equal(c.state.night.pendingAttacks.length,1);
  const d=game('piercingAttack');active(d,'piercingAttack',2);d.state.night.protectedIds=[2];settle(d);d.resolveNightBeforeReactions();assert.equal(d.playerOf(2).alive,false);
});
test('ambush requires a real recorded visit and cannot be activated by fake activity',()=>{
  for(const visiting of [false,true]){
    const c=game('ambush');active(c,'ambush',2);if(visiting)c.recordNightAction(c.playerOf(2),'protect',4);settle(c);assert.equal(c.state.night.pendingAttacks.length,visiting?1:0);
  }
});
test('Sanctuary suppresses the protected player’s attack and cannot target self',()=>{
  const c=game('sanctuary');active(c,'sanctuary',1);c.recordNightAction(c.playerOf(1),'kill',2);c.state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];settle(c);
  assert.equal(c.state.night.pendingAttacks.length,0);assert.ok(c.state.night.protectedIds.includes(1));
  assert.throws(()=>c.parseExtraChoice(c.playerOf(0),'sanctuary',JSON.stringify({targetId:0})),/unavailable/);
});
test('Sabotage cancels an already-collected protection; Jam withholds results while retaining visits',()=>{
  const c=game('sabotage');c.playerOf(3).roleOverrides={nightAction:'protect'};c.state.night.startAbilities[3]='protect';
  active(c,'sabotage',3);c.recordNightAction(c.playerOf(3),'protect',2);c.state.night.protectedIds=[2];settle(c);
  assert.ok(!c.state.night.protectedIds.includes(2));
  const d=game('inspectReaction');active(d,'inspectReaction',2);active(d,'jamInvestigation',0,'','',1);settle(d);
  assert.match(d.proposedInfoResult(d.playerOf(0)),/jammed/);assert.ok(d.state.night.actionRecords[0]);
});
test('temporary conversion, borrowed reactions, shields and delayed attacks take effect next night',()=>{
  const c=game('temporaryConversion');active(c,'temporaryConversion',2,'evil');active(c,'reserveShield',2,'','',4);active(c,'delayedStrike',2,'','',1);c.playerOf(3).roleOverrides={nightReaction:'escape'};active(c,'borrowReaction',3,'','',5);settle(c);
  assert.equal(c.roleOf(c.playerOf(2)).orientation,'good');c.finishExtraNight();c.state.round=2;c.state.night={round:1,pendingAttacks:[],blockedIds:[],protectedIds:[]};c.initializeExtraNight();
  assert.equal(c.roleOf(c.playerOf(2)).orientation,'evil');assert.equal(c.nightReactionFor(c.playerOf(5)),'escape');
  assert.equal(c.state.night.dueDelayedAttacks.length,1);c.prepareExtraAttacks();assert.equal(c.state.night.pendingAttacks.length,0);
  c.finishExtraNight();assert.equal(c.roleOf(c.playerOf(2)).orientation,'good');
});
test('Second Chance revives automatically, Shared Note uses normal notices, and Faction Memory reports historical facts',()=>{
  const c=game('secondChance');active(c,'secondChance',2);active(c,'contingencyNote',4,'3','Farewell',1);settle(c);c.setPlayerAlive(c.playerOf(2),false);c.setPlayerAlive(c.playerOf(1),false);c.finishExtraNight();
  assert.equal(c.playerOf(2).alive,true);assert.match(c.extraNoticesFor(c.playerOf(4)),/Anonymous shared note: Farewell/);assert.match(c.extraNoticesFor(c.playerOf(3)),/Anonymous shared note: Farewell/);assert.ok(c.state.players.every(p=>!p.dawnMessages.length));
  const d=game('deathEcho');d.setPlayerAlive(d.playerOf(2),false);d.initializeExtraNight();assert.match(d.proposedInfoResult(d.playerOf(0)),/Faction Memory: 1/);
});
test('Private Question delivers on the existing turn without a reply turn, while public notices remain public',()=>{
  const c=game('sealedReply');active(c,'sealedReply',2,'','Who are you?');settle(c);
  assert.equal(c.newReactionTurn(c.playerOf(2)),null);assert.match(c.extraNoticesFor(c.playerOf(2)),/Who are you/);assert.equal(c.state.night.replyRequests.length,0);
  c.state.night.extraActions[0]={action:'publicNotice',text:'Read this at dawn'};c.finishExtraNight();c.publishReactionAnnouncements();assert.ok(c.state.logs.some(e=>e.visibility==='public'&&e.text.includes('Read this')));
});
test('decoy and token plans do not consume the normal ability',()=>{
  const c=game('inspectReaction','decoyTrail');assert.equal(c.proposedPlanningTurn(c.playerOf(0)).plan,'decoy');c.saveProposedPlan(c.playerOf(0),'2');
  assert.equal(c.state.night.decoyTargets[0],2);assert.equal(c.proposedPlanningTurn(c.playerOf(0)),null);assert.equal(c.state.night.extraActions[0],undefined);
  c.state.visibleTokens=[{id:'one',holderId:0}];c.saveProposedPlan(c.playerOf(0),'4');c.finishExtraNight();assert.equal(c.state.visibleTokens[0].holderId,4);
});
const reactions=['returnToSender','blindDeflection','decoyTrail','followFootsteps','visitorDiversion','brace','safetyNumbers','feignDeath','bargainLife','lastShot','exposeAssailant','markAssailant','disarmAssailant','shatterDefences','mirrorAllegiance','stealWeapon','defensiveAwakening','vengefulAwakening','shedIdentity'];
test('exchange, bestow and restoration preserve unrelated identity fields and spent uses',()=>{
  const c=game('exchangeAbilities');c.playerOf(1).roleOverrides={nightAction:'kill'};active(c,'exchangeAbilities',1,'3');settle(c);
  assert.equal(c.nightActionFor(c.playerOf(1)),'doctor');assert.equal(c.nightActionFor(c.playerOf(3)),'kill');assert.equal(c.roleOf(c.playerOf(1)).orientation,'evil');
  const d=game('bestowAbility');active(d,'bestowAbility',2,'protect');settle(d);assert.equal(d.nightActionFor(d.playerOf(0)),'bestowAbility');assert.equal(d.nightActionFor(d.playerOf(2)),'protect');assert.equal(d.playerOf(0).used.bestowAbility,true);
  const e=game('restoreIdentity');e.playerOf(2).roleId='mafia';e.playerOf(2).used={surviveOnce:true};active(e,'restoreIdentity',2);settle(e);assert.equal(e.playerOf(2).roleId,'citizen');assert.equal(e.playerOf(2).used.surviveOnce,true);
});
test('Guard Reaction prevents reaction changes and overrides next-night exhaustion',()=>{
  const c=game('guardReaction');c.playerOf(2).roleOverrides={nightReaction:'escape'};active(c,'guardReaction',2);active(c,'changeReaction',2,'monkey','',1);settle(c);
  assert.equal(c.nightReactionFor(c.playerOf(2)),'escape');c.playerOf(2).disabledReactionRound=1;assert.equal(c.nightReactionFor(c.playerOf(2)),'escape');
});
test('a bargain cannot be resubmitted and protects only the triggering attack',()=>{
  const c=game('none','bargainLife');c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'},{attackerId:2,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();
  c.resolveNewReaction(c.playerOf(0),'activate');c.settleUnhandledExtraAttacks(c.playerOf(0));assert.equal(c.playerOf(0).alive,true);
  assert.throws(()=>c.resolveNewReaction(c.playerOf(0),'activate'),/Wait/);c.resolveBargain(c.playerOf(1),'spare');assert.equal(c.playerOf(0).alive,false);assert.equal(c.state.night.pendingAttacks.length,0);
});
test('narrator defers ambush until the victim has had a chance to visit',()=>{
  const c=game('ambush');vm.runInContext(fs.readFileSync(path.join(root,'narrator.js'),'utf8'),c);c.state.narratorMode=true;c.state.night.currentActorId=0;
  active(c,'ambush',2);settle(c);assert.equal(c.state.night.pendingAttacks.length,0);
  c.recordNightAction(c.playerOf(2),'inspectReaction',4);c.state.night.narratorReporting=true;delete c.state.night.extraAttacksPrepared;c.prepareExtraAttacks();assert.equal(c.state.night.pendingAttacks.length,1);
});
for(const reaction of reactions)test(`${reaction} resolves without reaction chains or duplicate activations`,()=>{
  const c=game(reaction==='vengefulAwakening'?'surviveOnce':'none',reaction);
  c.recordNightAction(c.playerOf(1),'kill',0,{targetIds:[0,2]});c.recordNightAction(c.playerOf(2),'protect',0);c.state.night.decoyTargets[0]=2;
  c.state.night.previousNightVisits=structuredClone(c.proposedRecords());
  c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();assert.ok(c.newReactionTurn(c.playerOf(0)),reaction);
  c.resolveNewReaction(c.playerOf(0),'activate');if(reaction==='bargainLife')c.resolveBargain(c.playerOf(1),'spare');
  assert.equal(c.newReactionTurn(c.playerOf(0)),null);
  if(['brace','safetyNumbers','feignDeath','bargainLife','mirrorAllegiance','defensiveAwakening','vengefulAwakening','shedIdentity'].includes(reaction))assert.equal(c.playerOf(0).alive,true);
  if(['returnToSender','blindDeflection','decoyTrail','followFootsteps','visitorDiversion'].includes(reaction)){assert.equal(c.playerOf(0).alive,true);assert.equal(c.state.night.pendingAttacks.length,1);assert.equal(c.state.night.pendingAttacks[0].redirectedFrom,0);}
  if(reaction==='lastShot'){assert.equal(c.playerOf(1).alive,true);assert.equal(c.playerOf(1).disabledReactionRound,2);c.finishExtraNight();assert.equal(c.playerOf(1).alive,true);}
  if(reaction==='vengefulAwakening')assert.equal(c.nightActionFor(c.playerOf(0)),'kill');
});
