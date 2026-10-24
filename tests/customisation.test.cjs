const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const fixture=fs.readFileSync(path.join(__dirname,'expansion.test.cjs'),'utf8').split('const active=')[0];
const createGame=new Function('require','__dirname',fixture+'\nreturn game;')(require,__dirname);
function game(action='none',reaction='none'){
  const c=createGame(action,reaction);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','customisation.js'),'utf8'),c);
  return c;
}
test('Bestow selects a useful gift, respects its role pool, and cannot pass itself',()=>{
  const c=game('bestowAbility'),p=c.playerOf(0);
  c.roleOf(p).bestowPool=['protect','bestowAbility'];
  assert.deepEqual(Array.from(c.extraChoices(p,'bestowAbility').secondary,o=>o.id),['protect']);
  assert.throws(()=>c.parseExtraChoice(p,'bestowAbility',JSON.stringify({targetId:2,second:'bestowAbility'})),/valid second/);
  const value=c.parseExtraChoice(p,'bestowAbility',JSON.stringify({targetId:2,second:'protect'}));
  c.recordExtraChoice(p,'bestowAbility',value);c.resolveExtraDefenses();c.resolveExtraEffects();
  assert.equal(c.nightActionFor(c.playerOf(2)),'protect');assert.equal(c.nightActionFor(p),'bestowAbility');
  assert.throws(()=>c.parseExtraChoice(p,'bestowAbility',JSON.stringify({targetId:3,second:'protect'})),/spent/);
});
test('copy and borrow menus do not leak hidden powers, and empty copies preserve the owner’s power',()=>{
  const c=game('copyAbility');c.playerOf(1).roleOverrides={nightAction:'copyAbility'};
  assert.equal(c.extraChoices(c.playerOf(0),'copyAbility').targets.some(t=>t.id==='1'),true);
  assert.equal(c.extraChoices(c.playerOf(0),'copyAbility').targets.some(t=>t.id==='2'),true);
  c.playerOf(3).roleOverrides={nightReaction:'escape'};
  assert.equal(c.extraChoices(c.playerOf(0),'borrowReaction').targets.some(t=>t.id==='2'),true);
  c.recordExtraChoice(c.playerOf(0),'copyAbility',{targetId:2});c.resolveExtraDefenses();c.resolveExtraEffects();assert.equal(c.playerOf(0).copiedAbility,undefined);assert.match(c.extraNoticesFor(c.playerOf(0)),/no usable ability/);
  const d=game('borrowReaction');d.recordExtraChoice(d.playerOf(0),'borrowReaction',{targetId:2});d.resolveExtraDefenses();d.resolveExtraEffects();assert.equal(d.playerOf(0).borrowedReaction,undefined);assert.match(d.extraNoticesFor(d.playerOf(0)),/no usable reaction/);
});
for(const reaction of ['stealWeapon','vengefulAwakening'])test(`${reaction} protects its owner without a separate survival ability`,()=>{
  const c=game('none',reaction),p=c.playerOf(0);c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();
  c.resolveNewReaction(p,'activate');assert.equal(p.alive,true);assert.equal(c.nightActionFor(p),'kill');assert.equal(c.nightReactionFor(p),'none');assert.equal(p.used[reaction],true);
});
for(const reaction of ['identifyAssailant','readWeapon','traceTheirSteps','countThreats','witnessSearch','readTheirPast'])test(`${reaction} saves only its triggering attack and cannot repeat`,()=>{
  const c=game('none',reaction),p=c.playerOf(0);
  c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'},{attackerId:2,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();
  c.resolveNewReaction(p,'activate');assert.equal(p.alive,true);assert.equal(c.state.night.pendingAttacks.length,1);assert.equal(c.newReactionTurn(p),null);
  c.settleUnhandledExtraAttacks(p);assert.equal(p.alive,false);
});
for(const reaction of ['followFootsteps','visitorDiversion','safetyNumbers'])test(`${reaction} uses fixed preceding-night visits regardless of current player order`,()=>{
  const outcomes=[];
  for(const priorVisitHappenedThisTurn of [false,true]){
    const c=game('none',reaction);
    c.state.night.previousNightVisits=[{actorId:1,action:'kill',targetIds:[4]},{actorId:2,action:'protect',targetIds:[0]}];
    if(priorVisitHappenedThisTurn){c.recordNightAction(c.playerOf(1),'kill',3);c.recordNightAction(c.playerOf(2),'protect',0);}
    c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();c.resolveNewReaction(c.playerOf(0),'activate');
    outcomes.push({alive:c.playerOf(0).alive,targetId:c.state.night.pendingAttacks[0]?.targetId});
  }
  assert.deepEqual(outcomes[0],outcomes[1]);assert.equal(outcomes[0].alive,true);
});
test('previous-night visit snapshots survive initialization and exclude fake visits and blocked actions',()=>{
  const c=game();c.recordNightAction(c.playerOf(1),'kill',2);c.recordNightAction(c.playerOf(3),'protect',4);c.state.night.blockedIds=[3];c.state.night.fakeVisits={1:4};
  c.finishExtraNight();assert.equal(c.state.previousNightVisits.length,1);assert.deepEqual(Array.from(c.state.previousNightVisits[0].targetIds),[2]);
  c.state.round++;c.initializeExtraNight();assert.deepEqual(Array.from(c.state.night.previousNightVisits[0].targetIds),[2]);
  c.state.previousNightVisits[0].targetIds.push(5);assert.deepEqual(Array.from(c.state.night.previousNightVisits[0].targetIds),[2]);
});
test('seat removal repairs multi-target host assignments and skips references to the removed seat',()=>{
  const c=game();c.playerOf(0).hostSetup={abilitySchedule:{1:{action:'compare',value:'1:4'},2:{action:'fakeVisit',value:'3',second:'4'}}};
  c.removeHostReferences(1);
  const schedule=c.playerOf(0).hostSetup.abilitySchedule;assert.equal(schedule[1].skip,true);assert.equal(schedule[2].value,'2');assert.equal(schedule[2].second,'3');
});
for(const reaction of ['eraseFootprints','borrowTheirFace'])test(`${reaction} benefits its owner rather than covering the attacker`,()=>{
  const c=game('none',reaction),p=c.playerOf(0);
  c.state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];c.prepareExtraAttacks();c.resolveNewReaction(p,'activate');
  assert.equal(p.alive,true);assert.equal(p.pendingReactionDeceptions[0].subjectId,0);
  c.state.round++;c.initializeExtraNight();c.resolveExtraDefenses();c.resolveExtraEffects();c.recordNightAction(p,'kill',4);c.recordNightAction(c.playerOf(1),'kill',3);
  if(reaction==='eraseFootprints'){
    assert.match(c.trackReport(p,c.playerOf(3)),/no recorded/);assert.match(c.trackReport(c.playerOf(1),c.playerOf(3)),/visited you/);
  }else{
    assert.equal(c.investigationRoleOf(p,c.playerOf(3)).title,'Mafia');assert.equal(c.roleOf(p).title,'Test role');assert.equal(c.investigationRoleOf(c.playerOf(1),c.playerOf(3)).title,'Mafia');
  }
});
test('private challenges do not attribute the author or forecast future assigned abilities',()=>{
  const c=game('kill'),p=c.playerOf(0);c.state.phase='handoff';p.hostSetup={challenge:'Speak with a subtle accent.',abilitySchedule:{3:{action:'kill',value:'2'}}};
  assert.match(c.privateCustomisationText(p),/Your personal challenge/);assert.doesNotMatch(c.privateCustomisationText(p),/host|assigned|night actions/i);
  c.state.phase='night';assert.equal(c.hostAssignmentDescription(p),'');c.state.round=3;
  assert.match(c.hostAssignmentDescription(p),/Kill/);assert.match(c.hostAssignmentDescription(p),/Player 2/);assert.match(c.hostAssignmentDescription(p),/cannot choose/);
});
test('assigned-night notices name targets, secondary choices and exact messages',()=>{
  for(const [action,value,second,text,expected]of [['framer','2','mafia','',/Assigned choice: Mafia/],['compare','1:2','','',/Player 1 and Player 2/],['sendNote','2','','A precise instruction',/Assigned message: A precise instruction/]]){
    const c=game(action);c.sortedRoles=()=>c.state.roles;c.playerOf(0).hostSetup={abilitySchedule:{1:{action,value,second,text}}};
    assert.match(c.hostAssignmentDescription(c.playerOf(0)),expected);
  }
});
test('living Good Undercover reverses final-two Evil victory, even if their identity is known',()=>{
  const c=game(),p=c.playerOf(0);p.roleId='undercover';c.state.players.slice(2).forEach(p=>p.removed=true);
  assert.equal(c.checkWin().winner,'Good');p.coverExposed=true;assert.equal(c.checkWin().winner,'Good');
  delete p.coverExposed;p.roleOverrides={orientation:'evil'};assert.equal(c.checkWin().winner,'Evil');
});
test('Undercover reverses a normal Evil parity win but respects disabled normal side checks',()=>{
  const c=game();c.playerOf(0).roleId='undercover';c.playerOf(2).roleId='mafia';c.state.players.slice(4).forEach(p=>p.removed=true);
  c.state.autoSideWinChecks=true;assert.equal(c.checkWin().winner,'Good');c.state.autoSideWinChecks=false;assert.equal(c.checkWin().done,false);
});
test('retired hunting roles and abilities are removed from old configurations and pending actions',()=>{
  const c=game();c.state.roles.push({id:'counterintelligence',title:'Counterintelligence',orientation:'evil',nightAction:'exposeCover'});
  c.playerOf(0).roleId='counterintelligence';c.playerOf(0).hostSetup={abilitySchedule:{1:{action:'exposeCover',value:'2'}},gamblerSchedule:{2:'exposeCover'}};
  c.playerOf(2).roleOverrides={nightAction:'exposeCover'};c.state.night.extraActions[0]={action:'exposeCover',targetId:2};c.state.night.round1Actions[0]={action:'exposeCover',targetId:2};
  c.removeLegacyHunt();assert.equal(c.playerOf(0).roleId,'mafia');assert.equal(c.playerOf(2).roleOverrides.nightAction,'none');assert.equal(c.state.night.extraActions[0],undefined);assert.equal(c.state.night.round1Actions[0].action,'none');
  assert.equal(c.state.roles.some(r=>r.id==='counterintelligence'),false);assert.equal(c.playerOf(0).hostSetup.abilitySchedule[1],undefined);
  assert.equal(vm.runInContext("Object.hasOwn(EXTRA_ABILITIES,'exposeCover')",c),false);
});
