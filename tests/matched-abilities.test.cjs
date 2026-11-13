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

const additions=['fabricateAction','inspectAbility','bestowReaction','disarm','sharedWard','threatSense','signedBroadcast'];
test('the additions cover every ability category exactly once',()=>{
 const c=game();assert.equal(new Set(additions.map(id=>vm.runInContext(`EXTRA_ABILITIES.${id}.category`,c))).size,7);
 for(const id of additions)assert.ok(vm.runInContext(`EXTRA_ABILITIES.${id}.prompt`,c));
});
const fabricate=(c,second='kill',destinationId=4)=>{
 const choice=c.parseExtraChoice(c.playerOf(0),'fabricateAction',JSON.stringify({targetId:1,second,destinationId}));
 c.recordExtraChoice(c.playerOf(0),'fabricateAction',choice);
};
test('Fabricate Action replaces the Lookout action and destination without changing real records',()=>{
 const c=game('fabricateAction');c.recordNightAction(c.playerOf(1),'protect',2);fabricate(c);settle(c);
 assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/visited you and used Kill/);
 assert.equal(c.state.night.actionRecords[1].action,'protect');assert.equal(c.state.night.actionRecords[1].targetId,2);
 assert.equal(c.state.night.pendingAttacks.length,0);
 c.state.night.infoSecure.push(4);assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/Player 2 and used Protect/);
});
test('Fabricate Action invents activity for idle and blocked subjects; hiding activity takes precedence',()=>{
 const c=game('fabricateAction');fabricate(c);c.state.night.blockedIds=[1];settle(c);
 assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/used Kill/);
 c.state.night.hiddenActivity=[1];assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/no recorded/);
});
test('fabricated targetless and passive abilities report no destination',()=>{
 for(const ability of ['hater','seer']){
 const c=game('fabricateAction');fabricate(c,ability,null);settle(c);
 assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/without visiting a player/);
 }
});
test('fabrication rejects unknown abilities and missing, dead or Judge destinations; blocking the fabricator cancels it',()=>{
 const c=game('fabricateAction');
 for(const choice of [{second:'madeUp',destinationId:2},{second:'kill'},{second:'kill',destinationId:null},{second:'kill',destinationId:99}])
 assert.throws(()=>c.parseExtraChoice(c.playerOf(0),'fabricateAction',JSON.stringify({targetId:1,...choice})));
 c.playerOf(4).roleId='judge';assert.throws(()=>fabricate(c));
 c.playerOf(4).roleId='citizen';c.playerOf(4).alive=false;assert.throws(()=>fabricate(c));
 c.playerOf(4).alive=true;fabricate(c);c.state.night.blockedIds=[0];settle(c);assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/no recorded/);
});
test('fabricated actions expire next night and do not contaminate truthful hints',()=>{
 const c=game('fabricateAction');fabricate(c);settle(c);
 assert.ok(c.proposedDeceived(1));assert.equal(c.proposedRecords().some(r=>r.actorId===1),false);
 c.state.round++;c.state.night={round:1,pendingAttacks:[],blockedIds:[],protectedIds:[]};c.initializeExtraNight();
 assert.equal(Object.keys(c.state.night.fabricatedActions).length,0);
});
test('Inspect Ability respects role masks and Secure Information',()=>{
 const c=game('inspectAbility');active(c,'inspectAbility',1);c.playerOf(1).framedRoleId='doctor';settle(c);
 assert.match(c.proposedInfoResult(c.playerOf(0)),/Doctor revive/);
 c.state.night.infoSecure.push(0);assert.match(c.proposedInfoResult(c.playerOf(0)),/no night ability/);
});
test('Bestow Reaction preserves identity and spent uses, obeys guards and cannot target self',()=>{
 const c=game('bestowReaction');
 assert.throws(()=>c.parseExtraChoice(c.playerOf(0),'bestowReaction',JSON.stringify({targetId:0,second:'escape'})));
 c.playerOf(2).used={escape:true};active(c,'bestowReaction',2,'escape');settle(c);
 assert.equal(c.nightReactionFor(c.playerOf(2)),'escape');assert.equal(c.playerOf(2).roleId,'citizen');assert.equal(c.playerOf(2).used.escape,true);
 assert.throws(()=>c.parseExtraChoice(c.playerOf(0),'bestowReaction',JSON.stringify({targetId:2,second:'escape'})),/already been spent/);
 for(const protection of ['guardReaction','preventChanges']){const d=game('bestowReaction');active(d,'bestowReaction',2,'escape');active(d,protection,2,'','',4);settle(d);assert.equal(d.nightReactionFor(d.playerOf(2)),'none');}
});
test('Disarm cancels Offensive attacks but leaves Defensive actions and reactions alone',()=>{
 for(const ability of ['kill','protect']){
 const c=game('disarm');c.playerOf(1).roleOverrides={nightAction:ability,nightReaction:'escape'};c.state.night.startAbilities[1]=ability;
 active(c,'disarm',1);c.recordNightAction(c.playerOf(1),ability,2);c.state.night.pendingAttacks=ability==='kill'?[{attackerId:1,targetId:2,sourceAction:'kill'}]:[];
 settle(c);assert.equal(c.state.night.blockedIds.includes(1),ability==='kill');assert.equal(c.state.night.pendingAttacks.length,0);assert.equal(c.nightReactionFor(c.playerOf(1)),'escape');
 }
});
test('Shared Ward grants one shield to each recipient, with normal piercing and block behavior',()=>{
 const c=game('sharedWard');active(c,'sharedWard',2,'4');settle(c);
 for(const id of [2,4]){assert.equal(c.proposedAttackStopped({targetId:id,piercing:true}),false);assert.equal(c.proposedAttackStopped({targetId:id}),true);assert.equal(c.proposedAttackStopped({targetId:id}),false);}
 const d=game('sharedWard');active(d,'sharedWard',2,'4');d.state.night.blockedIds=[0];settle(d);assert.equal(d.state.night.singleWards.length,0);
 assert.throws(()=>d.parseExtraChoice(d.playerOf(0),'sharedWard',JSON.stringify({targetId:2,second:'2'})),/different/);
});
test('Threat Sense uses real Offensive visits and ignores fabricated visits',()=>{
 const c=game('threatSense');c.recordNightAction(c.playerOf(1),'kill',0);settle(c);
 assert.match(c.proposedInfoResult(c.playerOf(0)),/^An Offensive/);
 c.state.night.hiddenActivity=[1];assert.match(c.proposedInfoResult(c.playerOf(0)),/^An Offensive/);
 c.state.night.blockedIds=[1];assert.match(c.proposedInfoResult(c.playerOf(0)),/^No Offensive/);
 c.state.night.fabricatedActions={2:{actorId:2,action:'kill',targetId:0}};assert.match(c.proposedInfoResult(c.playerOf(0)),/^No Offensive/);
});
test('Signed Broadcast publishes with its author at dawn even after death',()=>{
 const c=game('signedBroadcast');active(c,'signedBroadcast',null,'','Hello town');settle(c);c.setPlayerAlive(c.playerOf(0),false);c.finishExtraNight();
 assert.ok(c.state.night.proposedAnnouncements.includes('Message from Player 0: Hello town'));
});
test('online submission retains the fabricated destination',async()=>{
 const c=game('fabricateAction');c.state.night.round1Players=c.state.players.slice();await c.handleOnlineNightRound1(c.playerOf(0),JSON.stringify({targetId:1,second:'kill',destinationId:4}),'fabricateAction','uid-0','fabrication');
 assert.equal(c.state.night.extraActions[0].destinationId,4);settle(c);assert.match(c.trackReport(c.playerOf(1),c.playerOf(4)),/visited you and used Kill/);
});
