const EXTRA_REACTIONS = {
  hide: {label:'Hide',category:'Defensive',trigger:'attack'},
  revealToSurvive: {label:'Reveal to Survive',category:'Defensive',trigger:'attack'},
  counterattack: {label:'Counterattack',category:'Retaliatory',trigger:'death'},
  exposeAttacker: {label:'Expose Attacker',category:'Retaliatory',trigger:'death'},
  identifyVisitor: {label:'Identify Visitor',category:'Investigative',trigger:'visit'},
  inspectInvestigator: {label:'Inspect Investigator',category:'Investigative',trigger:'investigation'},
  misleadInvestigator: {label:'Mislead Investigator',category:'Deceitful',trigger:'investigation'},
  fakeDeath: {label:'Fake Death',category:'Deceitful',trigger:'attack'},
  passAbility: {label:'Pass Ability',category:'Transformative',trigger:'death'},
  nameSuccessor: {label:'Name a Successor',category:'Transformative',trigger:'death'}
};
const NIGHT_REACTIONS = Object.freeze({
  ...EXTRA_REACTIONS,
  none: {label:'None'},
  scapegoat: {label:'Scapegoat redirect',category:'Redirective'},
  traitor: {label:'Traitor conversion',category:'Transformative'},
  escape: {label:'Escape challenge',category:'Defensive'},
  monkey: {label:'Confrontation',category:'Retaliatory'},
  rps: {label:'Rock, Paper, Scissors',category:'Defensive'}
});
const NIGHT_REACTION_ACTIONS = new Set(Object.keys(NIGHT_REACTIONS).filter(id=>id!=='none'));
const INVESTIGATION_ACTIONS = new Set(['compare','exclude','audit','inspectOrientation','track','watch','seer','randomAllegiance']);

function needsReactionPlan(player) {
  return nightReactionFor(player)==='misleadInvestigator' && !Object.hasOwn(state.night.reactionPlans||{},player.id);
}

function reactionPlanTurn(player) {
  return {type:'nightRound1',action:'reactionPlan',prompt:'Mislead Investigator: choose whose information investigators should receive as yours if you are investigated tonight. This does not replace your night ability.',options:playersAlive().filter(p=>p.id!==player.id).map(p=>({id:String(p.id),name:p.name})).concat([{id:'skip',name:'Do not use this reaction'}])};
}

function recordReactionPlan(player, value) {
  if(!needsReactionPlan(player))throw new Error('That reaction choice is no longer available.');
  if(!reactionPlanTurn(player).options.some(o=>o.id===String(value)))throw new Error('Choose a living player.');
  state.night.reactionPlans=state.night.reactionPlans||{};
  state.night.reactionPlans[player.id]=value==='skip'?null:Number(value);
}

function investigationSubject(player) {
  const id=state.phase==='night'?state.night?.misledSubjects?.[player?.id]:null;
  return id==null?player:playerOf(id)||player;
}

function investigationRoleOf(player) { return effectiveRoleOf(investigationSubject(player)); }

function prepareNewReactions() {
  const n=state.night;if(n.newReactionsPrepared)return;n.newReactionsPrepared=true;
  n.reactionVisitors={};n.reactionInvestigators={};n.newReactionDone={};n.deathSources={};n.misledSubjects={};
  const add=(map,targetId,actorId)=>{if(targetId==null)return;map[targetId]=map[targetId]||[];if(!map[targetId].includes(actorId))map[targetId].push(actorId);};
  for(const rec of Object.values(n.actionRecords||{})){
    if(n.blockedIds?.includes(rec.actorId)||isPassiveAbility(rec.action))continue;
    for(const id of rec.targetIds||[rec.targetId]){
      add(n.reactionVisitors,id,rec.actorId);
      if(INVESTIGATION_ACTIONS.has(rec.action))add(n.reactionInvestigators,id,rec.actorId);
    }
  }
  for(const map of [n.seerTargets,n.round1SeerTargets,n.randomAllegianceTargets])for(const [id,targetId] of Object.entries(map||{})){
    if(!n.blockedIds?.includes(Number(id)))add(n.reactionInvestigators,targetId,Number(id));
  }
  for(const p of state.players){
    if(nightReactionFor(p)==='misleadInvestigator' && n.reactionInvestigators[p.id]?.length && n.reactionPlans?.[p.id]!=null){
      n.misledSubjects[p.id]=n.reactionPlans[p.id];
      extraNotice(p.id,'Your Mislead Investigator reaction activated tonight.');
    }
  }
  for(const attack of n.pendingAttacks||[])n.deathSources[attack.targetId]=attack.attackerId;
}

function newReactionTurn(player) {
  const n=state.night,action=nightReactionFor(player),spec=EXTRA_REACTIONS[action];
  if(!spec||n.newReactionDone?.[player.id])return null;
  const attack=findPendingAttacksFor(player.id)[0];
  const investigators=n.reactionInvestigators?.[player.id]||[],visitors=n.reactionVisitors?.[player.id]||[];
  const skip={id:'skipReaction',name:'Do not use this reaction'};
  let prompt='',options=[];
  if(spec.trigger==='attack'){
    if(!player.alive||!attack)return null;
    if(['revealToSurvive','fakeDeath'].includes(action)&&player.used?.[action])return null;
    if(action==='hide'){
      prompt=`You were attacked by ${playerOf(attack.attackerId)?.name||'an attacker'}. In real life, secretly pick hiding place 1, 2 or 3 and have the attacker guess. Record the outcome honestly.`;
      options=[{id:'hidden',name:'They guessed wrong'},{id:'found',name:'They guessed correctly'},skip];
    }
    if(action==='revealToSurvive'){prompt='Reveal your true role publicly at dawn to survive all attacks tonight? Once per game.';options=[{id:'useReaction',name:'Reveal my role & survive'},skip];}
    if(action==='fakeDeath'){prompt='Appear dead until the next night begins. You cannot speak or vote during the coming day. Once per game.';options=[{id:'useReaction',name:'Fake my death'},skip];}
  } else if(spec.trigger==='death'){
    if(player.fakeDeathReturnRound)return null;
    if(player.alive&&!attack)return null;
    if(!player.alive&&n.deathSources?.[player.id]==null)return null;
    if(action==='counterattack'){prompt='When killed, take your attacker with you. Protection and passive survival still apply.';options=[{id:'useReaction',name:'Counterattack'},skip];}
    if(action==='exposeAttacker'){prompt='When killed, publicly reveal your attacker\'s name at dawn.';options=[{id:'useReaction',name:'Expose attacker'},skip];}
    if(['passAbility','nameSuccessor'].includes(action)){
      prompt=action==='passAbility'?'When killed, choose a living player to inherit your night ability next night.':'When killed, choose a living player to inherit your whole role next night.';
      options=playersAlive().filter(p=>p.id!==player.id).map(p=>({id:String(p.id),name:p.name})).concat([skip]);
    }
  } else {
    if(!player.alive)return null;
    if(action==='identifyVisitor'&&visitors.length){prompt='Someone used an active ability on you. Learn one visitor\'s name, but not their action?';options=[{id:'useReaction',name:'Identify one visitor'},skip];}
    if(action==='inspectInvestigator'&&investigators.length){prompt='You were investigated. Learn one investigator\'s allegiance? Their investigation still works.';options=[{id:'useReaction',name:'Inspect investigator'},skip];}
  }
  return options.length?{type:'reaction',action:'newReaction',reaction:action,prompt,options}:null;
}

function killFromReaction(target, attackerId) {
  if(!target?.alive)return;
  state.night.deathSources=state.night.deathSources||{};state.night.deathSources[target.id]=attackerId;
  setPlayerAlive(target,false);
  if(!target.alive && EXTRA_REACTIONS[nightReactionFor(target)]?.trigger==='death' && !state.night.newReactionDone?.[target.id]){
    ensureReactionQueued(target);
  }
}

function resolveNewReaction(player,value) {
  const turn=newReactionTurn(player),n=state.night;
  if(!turn||!turn.options.some(o=>o.id===String(value)))throw new Error('That reaction choice is no longer available.');
  const action=turn.reaction,attack=findPendingAttacksFor(player.id)[0];
  const attackerId=attack?.attackerId??n.deathSources?.[player.id];
  n.newReactionDone=n.newReactionDone||{};n.newReactionDone[player.id]=true;
  if(attack){n.deathSources[player.id]=attackerId;removePendingAttack(attack);}
  const using=value!=='skipReaction';
  let message='You did not use your reaction.';
  if(action==='identifyVisitor' && using){const visitor=playerOf(n.reactionVisitors[player.id][0]);message=`${visitor.name} visited you tonight.`;}
  if(action==='inspectInvestigator'&&using){const investigator=playerOf(n.reactionInvestigators[player.id][0]);message=`One investigator is ${labelOrientation(investigationRoleOf(investigator)?.orientation)}.`;}
  if(action==='hide'){
    if(value==='hidden'){message='You hid successfully and survived this attack.';n.newReactionDone[player.id]=false;}
    else {killFromReaction(player,attackerId);message=player.alive?'Your passive ability saved you.':'The attacker found and killed you.';}
  }
  if(action==='revealToSurvive'&&using){
    player.used=player.used||{};player.used.revealToSurvive=true;
    const role=roleOf(player);n.publicReactions=n.publicReactions||[];n.publicReactions.push(`${player.name} revealed their role to survive: ${role.title} (${labelOrientation(role.orientation)}).`);
    n.pendingAttacks=n.pendingAttacks.filter(a=>a.targetId!==player.id);message='You survived. Your role will be revealed at dawn.';
  } else if(action==='fakeDeath'&&using){
    player.used=player.used||{};player.used.fakeDeath=true;player.fakeDeathReturnRound=state.round+1;
    player.alive=false;player.deadSinceRound=state.round;
    n.pendingAttacks=n.pendingAttacks.filter(a=>a.targetId!==player.id);message='You appear dead. Stay silent and do not vote tomorrow. You return when the next night begins.';
  } else if(['revealToSurvive','fakeDeath'].includes(action))killFromReaction(player,attackerId);
  if(EXTRA_REACTIONS[action].trigger==='death'){
    if(player.alive)killFromReaction(player,attackerId);
    if(using&&!player.alive){
      if(action==='counterattack'){
        const attacker=playerOf(attackerId);
        if(attacker?.alive&&!n.protectedIds?.includes(attacker.id))killFromReaction(attacker,player.id);
        message='Your counterattack was resolved.';
      }
      if(action==='exposeAttacker'){
        n.publicReactions=n.publicReactions||[];n.publicReactions.push(`${player.name}'s attacker was ${playerOf(attackerId)?.name||'unknown'}.`);message='Your attacker will be exposed at dawn.';
      }
      if(['passAbility','nameSuccessor'].includes(action)){
        const recipient=playerOf(value),role=roleOf(player);
        recipient.pendingInheritance={round:state.round+1,roleId:action==='nameSuccessor'?role.id:null,overrides:action==='nameSuccessor'?{...(player.roleOverrides||{})}:{},ability:nightActionFor(player),sourceName:player.name};
        message=`${recipient.name} will inherit ${action==='nameSuccessor'?'your role':'your ability'} at the start of the next night.`;
      }
    }
  }
  extraNotice(player.id,message);
  return message;
}

function settleUnhandledExtraAttacks(player) {
  if(!EXTRA_REACTIONS[nightReactionFor(player)]||newReactionTurn(player))return;
  for(const attack of [...findPendingAttacksFor(player.id)]){
    removePendingAttack(attack);killFromReaction(player,attack.attackerId);
  }
}

function renderNewReaction(player) {
  const turn=newReactionTurn(player);if(!turn)return false;
  $('nightPrompt').textContent=turn.prompt;
  for(const option of turn.options)$('nightActionArea').appendChild(actionButton(option.name,option.id,()=>{
    if(state.night.busy)return;setNightBusy(true);
    try{resolveNewReaction(player,option.id);setNightBusy(false);renderReactionTurn(player);}
    catch(error){setNightBusy(false);showNightResult(escapeHtml(error.message));}
  }));
  return true;
}

function restoreNextNightRoles() {
  for(const p of state.players){
    delete p.inheritanceNotice;
    if(p.fakeDeathReturnRound && p.fakeDeathReturnRound<=state.round){p.alive=true;p.deadSinceRound=null;delete p.fakeDeathReturnRound;addLog(`${p.name} returned after faking their death.`);}
    const inheritance=p.pendingInheritance;
    if(!inheritance||inheritance.round>state.round)continue;
    delete p.pendingInheritance;
    if(!p.alive)continue;
    if(roleActiveNightAction(roleOf(p))==='resistChanges') {p.inheritanceNotice='You resisted an inherited role change.';continue;}
    delete p.copiedAbility;
    if(inheritance.roleId){p.roleId=inheritance.roleId;p.roleOverrides=inheritance.overrides;p.haterTargetId=null;p.policemanIntel=null;}
    else p.roleOverrides={...(p.roleOverrides||{}),nightAction:inheritance.ability};
    p.inheritanceNotice=`${inheritance.sourceName} left you ${inheritance.roleId?'their role':'their ability'}. You are ${roleOf(p).title}; your ability is ${NIGHT_ACTIONS[nightActionFor(p)]?.label||'None'}.`;
  }
}

function publishReactionAnnouncements() {
  if(state.night.reactionAnnouncementsPublished)return;
  state.night.reactionAnnouncementsPublished=true;
  for(const message of state.night.publicReactions||[])addLog(message);
}
