const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function load(c, name) {
  const match = new RegExp(`    (?:async )?function ${name}\\(`).exec(html);
  assert.ok(match, name);
  const next = /\n    (?:async )?function /g;
  next.lastIndex = match.index + 1;
  vm.runInContext(html.slice(match.index, next.exec(html)?.index ?? html.length), c);
}

function game(ids = ['signal_receiver', 'mafia', 'citizen', 'judge', 'doctor', 'leader']) {
  const c = vm.createContext({
    state: {roles:[], players:[], round:1, phase:'night', mode:'manual', logs:[],
      day:{votes:{}, secondBallot:false, tiedCandidates:[]}, night:{},
      processedCommandIds:{}, onlineCommandAcks:{}, onlineVersion:1, autoSideWinChecks:false},
    online: {mode:'host', isHost:true, playersCache:{}},
    structuredClone, console, randomChoice:list=>list[0] || null, shuffle:list=>[...list],
    isChosen:value=>value !== undefined && value !== null,
    escapeHtml:value=>String(value), alert:()=>{}, addLog:(text, visibility)=>c.state.logs.push({text, visibility}),
    publishOnlineRoom:async()=>{}, setPrivateResult:()=>{}, maybeFinishOnlineRound1:async()=>{},
    startOnlineNight:async()=>{c.state.phase='night'; c.startedNights=(c.startedNights||0)+1;},
    finishOnlineGame:async result=>{c.winner=result;c.state.phase='gameover';},
    canSeeDeadSpectatorRoles:()=>false, onlineKnownRolesFor:()=>[], onlineDuelPayload:()=>null,
    findPendingAttacksFor:()=>[], showNightResult:()=>{}, completeNightTurn:()=>{},
    setNightBusy:value=>{c.state.night.busy=value;},
    document:{createElement:()=>({style:{},dataset:{},children:[],appendChild(p){this.children.push(p);},addEventListener(){}})}
  });
  for (const file of ['reactions.js', 'abilities.js', 'judge.js', 'signal-receiver.js', 'roles.js', 'host-setup.js'])
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c);
  for (const name of ['roleOf','roleActiveNightAction','roleNightReaction','nightActionFor','nightReactionFor',
    'playersAlive','playerOf','labelOrientation','normalizedRoleOptions','actionUsesLeft','markNightAbilityUsed',
    'validAbilityTargets','setPlayerAlive','recordNightAction','applyPermanentRoleChange','ensurePolicemanIntel',
    'validDayTarget','checkWin','normalizedWinCondition','assignRoles','effectiveRoleOf','investigationSubject',
    'investigationRoleOf','trackReport','isLimitedInvestigation','limitedInvestigationChoices',
    'recordLimitedInvestigation','resolveLimitedInvestigations','hasReactionRoundInfo','ackOnlineCommand',
    'handleOnlineCommand','resolveOnlineDay','handleOnlineNightRound1','onlinePrivatePayloadFor',
    'onlinePublicSnapshot','onlineCurrentNightActor','setChoiceAndContinue','isKillingRole','isTeamKillRole',
    'teamKillGroupKey','resolveOnlineNightBeforeReactions','removePendingAttack','resolveOnlineRound1Intents']) load(c,name);
  c.state.roles = vm.runInContext('DEFAULT_ROLES.map(r=>({...r}))', c);
  c.state.players = ids.map((roleId,id)=>({id,roleId,name:`Player ${id}`,uid:`uid-${id}`,alive:true,used:{}}));
  c.online.playersCache = Object.fromEntries(c.state.players.map(p=>[p.uid,{uid:p.uid,seatId:p.id}]));
  c.state.night = {round:1,round1Players:c.state.players.slice(),pendingAttacks:[],gamblerActions:{},
    protectedIds:[],blockedIds:[],actionRecords:{},round1Actions:{},round1Submitted:{},
    trackTargets:{},inspectTargets:{},seerTargets:{},haterTargets:{},usedTeamKillRoleIds:[],
    round1InspectTargets:{},round1SeerTargets:{}};
  c.initializeExtraNight();
  return c;
}
const messages = (c, family) => Array.from(c.signalHintPool(c.playerOf(0))[family], h=>h.message);

test('Signal Receiver is Good and its matching passive ability is available for custom roles',()=>{
  const c=game();
  assert.equal(c.roleOf(c.playerOf(0)).orientation,'good');
  assert.equal(c.nightActionFor(c.playerOf(0)),'signalReceiver');
  assert.equal(c.isPassiveAbility('signalReceiver'),true);
  assert.equal(c.extraChoices(c.playerOf(0),'signalReceiver').passive,true);
});

test('signals reveal true allegiance and role despite framing and hidden allegiance',()=>{
  const c=game();c.playerOf(1).framedRoleId='citizen';c.state.night.hiddenAllegiance=[1];
  assert.equal(c.investigationRoleOf(c.playerOf(1)).orientation,'neutral');
  assert.ok(messages(c,'allegiances').includes('Player 1 is Evil when this signal was received.'));
  assert.ok(messages(c,'roles').includes('Player 1 is Mafia when this signal was received.'));
  assert.ok(!messages(c,'roles').includes('Player 1 is Citizen when this signal was received.'));
});

test('signals retain real visits and activity despite fake visits and hidden or fabricated activity',()=>{
  const c=game();c.recordNightAction(c.playerOf(1),'kill',2);
  c.state.night.fakeVisits={1:4};c.state.night.hiddenActivity=[1];c.state.night.fakeActivity=[2];
  assert.match(c.trackReport(c.playerOf(1),c.playerOf(0)),/no recorded/);
  assert.ok(messages(c,'visits').includes('Player 1 visited Player 2 tonight.'));
  assert.ok(!messages(c,'visits').includes('Player 1 visited Player 4 tonight.'));
  assert.ok(messages(c,'activity').includes('Player 2 made no recorded active ability use tonight; passive abilities do not count.'));
});

test('signals ignore reversed comparisons and use actual post-change allegiances',()=>{
  const c=game();c.state.night.reversedComparison=[1];
  assert.ok(messages(c,'comparisons').includes('Player 1 and Player 2 have different allegiances when this signal was received.'));
  c.state.night.extraActions[5]={action:'changeAllegiance',targetId:1,second:'good'};
  c.resolveExtraEffects();
  assert.ok(messages(c,'allegiances').includes('Player 1 is Good when this signal was received.'));
  assert.ok(messages(c,'allegiances').includes('Player 1 was Evil at the start of tonight.'));
  assert.ok(messages(c,'comparisons').includes('Player 1 and Player 2 have the same allegiance when this signal was received.'));
});

test('a late roleblock cancels visits but leaves truthful submission history',()=>{
  const c=game();c.recordNightAction(c.playerOf(1),'kill',2);
  c.state.night.localRoleblocks=[{actorId:5,targetId:1}];c.resolveExtraDefenses();
  assert.equal(c.state.night.actionRecords[1],undefined);
  assert.ok(messages(c,'blocking').some(text=>text.includes('Player 1 submitted Kill, but was roleblocked')));
  assert.ok(!messages(c,'visits').includes('Player 1 visited Player 2 tonight.'));
});

test('attack, protection, death and revival hints use final outcomes and keep real events',()=>{
  const c=game();
  c.state.night.protectedIds=[2];
  c.state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];
  c.prepareExtraAttacks();
  c.setPlayerAlive(c.playerOf(4),false);c.setPlayerAlive(c.playerOf(4),true);
  assert.ok(messages(c,'survival').includes('Protection stopped an attack against Player 2 tonight.'));
  assert.ok(messages(c,'deaths').includes('Player 4 died during tonight and was revived.'));
  assert.ok(messages(c,'deaths').includes('0 players who began tonight alive remain dead when this signal was received.'));
});

test('all 20 hint families produce usable hints in a round with varied events',()=>{
  const c=game();c.recordNightAction(c.playerOf(1),'kill',2);
  c.recordExtraChoice(c.playerOf(5),'sendNote',{targetId:2,text:'Secret contents'});
  c.state.night.protectedIds=[2];c.state.night.pendingAttacks=[{attackerId:1,targetId:2,sourceAction:'kill'}];
  c.resolveExtraEffects();c.prepareExtraAttacks();c.state.night.blockedIds=[4];
  c.playerOf(1).framedRoleId='citizen';
  const pool=c.signalHintPool(c.playerOf(0));
  assert.equal(Object.keys(pool).length,20);
  for(const [family,hints] of Object.entries(pool))assert.ok(hints.length,family);
  assert.ok(Object.values(pool).flat().length>300);
  assert.ok(!Object.values(pool).flat().some(h=>h.message.includes('Secret contents')));
});

test('one private reaction signal resists blocking, avoids repeats and survives saving without dawn delivery',()=>{
  const c=game();c.state.night.blockedIds=[0];
  const first=c.signalHintFor(c.playerOf(0));
  assert.equal(c.playerOf(0).dawnMessages.length,0);assert.match(first,/Signal Receiver — night 1:/);
  assert.equal(c.signalHintFor(c.playerOf(0)),first);
  c.state.night=JSON.parse(JSON.stringify(c.state.night));
  assert.equal(c.signalHintFor(c.playerOf(0)),first);
  c.finishExtraNight();assert.equal(c.playerOf(0).dawnMessages.length,0);
  c.state.round=2;c.initializeExtraNight();
  assert.notEqual(c.signalHintFor(c.playerOf(0)),first);
  assert.equal(c.playerOf(0).signalHintHistory.length,2);
});

test('a dead Receiver receives no signal and a newly created living Receiver can receive one',()=>{
  const c=game();c.setPlayerAlive(c.playerOf(0),false);
  assert.equal(c.applyPermanentRoleChange(c.playerOf(2),'signal_receiver',c.playerOf(5)),true);
  c.deliverSignalHints();
  assert.equal(c.state.night.signalHints[0],undefined);
  assert.ok(c.state.night.signalHints[2]);
});

test('Judge is excluded from primary and secondary ability targets, even for self-targeting roles',()=>{
  const c=game();
  for(const actor of c.state.players)assert.ok(!c.validAbilityTargets(actor,{canTargetSelf:true}).some(p=>p.id===3));
  for(const action of ['fakeVisit','swapRoles']){
    const options=c.extraChoices(c.playerOf(5),action);
    assert.ok(!options.targets.some(p=>p.id==='3'));
    assert.ok(!options.secondary.some(p=>p.id==='3'));
    assert.throws(()=>c.parseExtraChoice(c.playerOf(5),action,JSON.stringify({targetId:2,second:'3'})));
  }
});

test('configured and random Seer, Policeman and Hater selections cannot choose a Judge',()=>{
  const c=game();c.playerOf(0).hostSetup={seerSchedule:{1:3},policemanTarget:3,haterTarget:3};
  const candidates=[c.playerOf(3),c.playerOf(1)];
  assert.equal(c.scheduledSeerTarget(c.playerOf(0),candidates),1);
  assert.equal(c.hostTarget(c.playerOf(0),'haterTarget',candidates).id,1);
  c.playerOf(0).roleId='policeman';assert.notEqual(c.ensurePolicemanIntel(c.playerOf(0)).targetId,3);
});

test('stale targeted effects, queued attacks and direct role changes cannot affect a Judge',()=>{
  const c=game();
  c.state.night.extraActions[5]={action:'changeAllegiance',targetId:3,second:'evil'};
  c.resolveExtraEffects();assert.equal(c.roleOf(c.playerOf(3)).orientation,'good');
  assert.equal(c.applyPermanentRoleChange(c.playerOf(3),'mafia',c.playerOf(5)),false);
  c.state.night.pendingAttacks=[{attackerId:1,targetId:3,sourceAction:'kill'}];
  c.prepareExtraAttacks();assert.equal(c.state.night.pendingAttacks.length,0);
  c.setPlayerAlive(c.playerOf(3),false);assert.equal(c.playerOf(3).alive,true);
});

test('Judge alone can select a daytime target and cannot select themselves',()=>{
  const c=game();c.state.phase='day';
  assert.equal(c.validDayTarget(c.playerOf(1),2),false);
  assert.equal(c.validDayTarget(c.playerOf(3),3),false);
  assert.equal(c.validDayTarget(c.playerOf(3),2),true);
  assert.equal(c.dayDecisionReady(),false);
  c.state.day.votes[3]='skip';assert.equal(c.dayDecisionReady(),true);
});

test('a verdict against Good eliminates both players and restores ordinary voting',()=>{
  const c=game();c.state.phase='day';c.state.day.votes[3]=2;
  const verdict=c.applyJudgeVerdict();assert.equal(verdict.mistaken,true);
  assert.equal(c.playerOf(2).alive,false);assert.equal(c.playerOf(3).alive,false);
  assert.equal(c.playerOf(2).eliminatedByVote,true);assert.equal(c.playerOf(3).eliminatedByVote,true);
  assert.equal(c.dayJudge(),null);assert.equal(c.validDayTarget(c.playerOf(1),4),true);
  assert.equal(c.applyJudgeVerdict(),null);
});

test('Evil and Neutral verdicts keep the Judge alive, and skip is idempotent',()=>{
  for(const role of ['mafia','jester']){
    const c=game();c.playerOf(1).roleId=role;c.state.phase='day';c.state.day.votes[3]=1;
    assert.equal(c.applyJudgeVerdict().mistaken,false);
    assert.equal(c.playerOf(1).alive,false);assert.equal(c.playerOf(3).alive,true);
  }
  const c=game();c.state.phase='day';c.state.day.votes[3]='skip';
  assert.equal(c.applyJudgeVerdict().skipped,true);assert.equal(c.applyJudgeVerdict(),null);
  assert.ok(c.state.players.every(p=>p.alive));
});

test('online host rejects other players’ verdicts, resolves the Judge immediately and punishes mistakes',async()=>{
  const c=game();c.state.phase='day';
  await c.handleOnlineCommand({uid:'uid-1',payload:{version:1,turnType:'dayVote',value:'skip'}},'other-skip');
  assert.equal(c.state.onlineCommandAcks['uid-1'].accepted,false);
  assert.equal(c.state.day.votes[1],undefined);assert.equal(c.startedNights,undefined);
  await c.handleOnlineCommand({uid:'uid-3',payload:{version:1,turnType:'dayVote',value:2}},'judge-verdict');
  assert.equal(c.playerOf(2).alive,false);assert.equal(c.playerOf(3).alive,false);
  assert.equal(c.startedNights,1);
});

test('online day payload announces Judge presence and only the Judge gets ballot options',()=>{
  const c=game();c.state.phase='day';
  assert.equal(c.onlinePublicSnapshot().judgePresent,true);
  assert.equal(c.onlinePublicSnapshot().day.judgeId,3);
  assert.equal(c.onlinePrivatePayloadFor(c.playerOf(1)).turn.type,'ack');
  const ballot=c.onlinePrivatePayloadFor(c.playerOf(3)).turn;
  assert.equal(ballot.type,'dayVote');assert.ok(ballot.options.some(p=>p.id==='skip'));
  assert.ok(!ballot.options.some(p=>p.id===3));
});

test('online host rejects forged Judge targets across direct and extra abilities',async()=>{
  for(const action of ['kill','protect','roleblock','silence','track','inspectOrientation','framer','changeAllegiance']){
    const c=game();c.playerOf(1).roleOverrides={nightAction:action};
    const choice=action==='changeAllegiance'?JSON.stringify({targetId:3,second:'evil'}):'3';
    await c.handleOnlineNightRound1(c.playerOf(1),choice,action,'uid-1','forged');
    assert.equal(c.state.onlineCommandAcks['uid-1'].accepted,false,action);
    assert.equal(c.state.night.round1Submitted[1],undefined,action);
  }
});

test('only one Judge can be assigned or created, including edited special IDs',()=>{
  const c=game();c.playerOf(2).roleId='judge';assert.equal(c.assignRoles(),false);
  c.playerOf(2).roleId='citizen';assert.equal(c.applyPermanentRoleChange(c.playerOf(2),'judge',c.playerOf(5)),false);
  c.state.roles.push({id:'custom_judge',specialId:'judge',title:'Custom Judge',orientation:'good',randomCount:9});
  c.state.roles.find(r=>r.id==='judge').randomCount=9;
  c.state.mode='random';c.state.players.forEach(p=>p.roleId=null);
  c.state.roles=c.state.roles.filter(r=>['judge','custom_judge','citizen'].includes(r.id));
  c.assignRoles();assert.equal(c.state.players.filter(c.isJudge).length,1);
});

test('the hint ability works through a copied ability, Gambler and permanent ability changes',()=>{
  const copied=game();copied.playerOf(2).copiedAbility={action:'signalReceiver',round:1};
  copied.deliverSignalHints();assert.ok(copied.state.night.signalHints[2]);
  const gambler=game();gambler.playerOf(2).roleId='gambler';gambler.state.night.gamblerActions[2]='signalReceiver';
  gambler.initializeExtraNight();gambler.deliverSignalHints();assert.ok(gambler.state.night.signalHints[2]);
  const changed=game();changed.state.night.extraActions[5]={action:'changeAbility',targetId:2,second:'signalReceiver'};
  changed.resolveExtraEffects();changed.deliverSignalHints();assert.ok(changed.state.night.signalHints[2]);
});

test('signals do not leak individual role or allegiance clues about an immune Judge',()=>{
  const c=game();
  for(const family of ['roles','allegiances','capabilities','activity','visits','targets','attacks','blocking','deception','changes','deaths','comparisons','groups','communications'])
    assert.ok(!messages(c,family).some(text=>text.includes('Player 3')),family);
});

test('Receivers are scheduled after other reactions without changing the other players’ order',()=>{
  const c=game();
  assert.deepEqual(Array.from(c.signalReactionOrder([c.playerOf(0),c.playerOf(4),c.playerOf(1)]),p=>p.id),[4,1,0]);
});

test('online hints stay private and are generated only on the Receiver’s reaction turn',()=>{
  const c=game();c.state.night.round=2;c.state.night.index=0;
  c.state.night.reactionQueue=[c.playerOf(1),c.playerOf(0)];
  assert.equal(c.onlinePrivatePayloadFor(c.playerOf(0)).result,null);
  assert.equal(c.state.night.signalHints[0],undefined);
  c.state.night.index=1;
  const own=c.onlinePrivatePayloadFor(c.playerOf(0));
  assert.match(own.result,/Signal Receiver — night 1:/);
  assert.equal(own.turn.action,'signalReceiver');
  assert.equal(c.onlinePrivatePayloadFor(c.playerOf(1)).result,null);
  assert.equal(c.onlinePublicSnapshot().signalHints,undefined);
  assert.equal(c.onlinePrivatePayloadFor(c.playerOf(0)).result,own.result);
  assert.equal(c.playerOf(0).signalHintHistory.length,1);
  assert.equal(c.playerOf(0).dawnMessages.length,0);
});
