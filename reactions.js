// Night reactions are loaded before abilities and roles.
const EXTRA_REACTIONS = Object.freeze({
  returnToSender:{label:'Return to Sender',category:'Redirective',once:true},
  blindDeflection:{label:'Blind Deflection',category:'Redirective',once:true},
  decoyTrail:{label:'Decoy Trail',category:'Redirective',once:true},
  followFootsteps:{label:'Follow the Footsteps',category:'Redirective'},
  visitorDiversion:{label:'Visitor Diversion',category:'Redirective',once:true},
  brace:{label:'Brace',category:'Defensive',once:true},
  safetyNumbers:{label:'Safety in Numbers',category:'Defensive'},
  feignDeath:{label:'Feign Death',category:'Defensive',once:true},
  bargainLife:{label:'Bargain for Life',category:'Defensive'},
  lastShot:{label:'Break Their Reaction',category:'Retaliatory',once:true},
  exposeAssailant:{label:'Expose Assailant',category:'Retaliatory'},
  markAssailant:{label:'Mark Assailant',category:'Retaliatory',once:true},
  disarmAssailant:{label:'Disarm Assailant',category:'Retaliatory'},
  shatterDefences:{label:'Shatter Defences',category:'Retaliatory'},
  mirrorAllegiance:{label:'Mirror Allegiance',category:'Transformative',once:true},
  stealWeapon:{label:'Steal Their Weapon',category:'Transformative'},
  defensiveAwakening:{label:'Defensive Awakening',category:'Transformative',once:true},
  vengefulAwakening:{label:'Vengeful Awakening',category:'Transformative'},
  shedIdentity:{label:'Shed Identity',category:'Transformative',once:true},
  identifyAssailant:{label:'Identify Assailant',category:'Investigative'},
  readWeapon:{label:'Read the Weapon',category:'Investigative'},
  traceTheirSteps:{label:'Read Their Reaction',category:'Investigative'},
  countThreats:{label:'Read Their Ability',category:'Investigative'},
  witnessSearch:{label:'Read Their Origins',category:'Investigative'},
  readTheirPast:{label:'Read Their Past',category:'Investigative'},
  counterframe:{label:'Lingering Frame',category:'Deceitful'},
  falseColours:{label:'Stained Colours',category:'Deceitful'},
  plantEscapeRoute:{label:'Planted Trail',category:'Deceitful'},
  eraseFootprints:{label:'Clean Getaway',category:'Deceitful'},
  borrowTheirFace:{label:'False Double',category:'Deceitful'},
  scrambleWitnesses:{label:'Witness Confusion',category:'Deceitful'}
});

const NIGHT_REACTIONS = Object.freeze({
  scapegoat: {label:'Redirect a night attack', category:'Redirective'},
  escape: {label:'Escape challenge', category:'Defensive'},
  monkey: {label:'Confront the attacker', category:'Retaliatory'},
  rps: {label:'Rock, Paper, Scissors', category:'Defensive'},
  traitor: {label:'Join the Mafia when attacked', category:'Transformative'},
  ...EXTRA_REACTIONS
});

const NIGHT_REACTION_ACTIONS = new Set(Object.keys(NIGHT_REACTIONS));

// The built-in reactions are handled in index.html.
function prepareNewReactions() {
  const n=state.night;
  n.reactionRosterSnapshot ||= state.players.filter(p=>!p.removed).map(p=>({id:p.id,alive:p.alive,targetable:canAbilityTarget(p)}));
}
function newReactionTurn(player) {
  const n=state.night;
  const request=n.replyRequests?.find(r=>r.targetId===player.id && !r.answered);
  if(request && player.alive)return {type:'reaction',action:'sealedReplyResponse',prompt:`${playerOf(request.actorId)?.name} asks: ${request.text}`,replyForm:true,options:[]};
  const attack=findPendingAttacksFor(player.id)[0], action=nightReactionFor(player), spec=EXTRA_REACTIONS[action];
  if(attack && player.alive && n.bargain?.targetId===player.id)return {type:'reaction',action:'bargainLife',prompt:'Waiting for the attacker to accept or refuse your bargain.',options:[]};
  if(!attack || !player.alive || !spec || n.proposedReactionUsed?.[player.id] || (spec.once && player.used?.[action]) || attack.noReaction)return null;
  let options=[{id:'activate',name:`Use ${spec.label}`}];
  if(action==='counterframe')options=state.roles.map(role=>({id:`choose:${role.id}`,name:`Frame attacker as ${role.title}`}));
  if(action==='falseColours')options=['good','neutral','evil'].map(allegiance=>({id:`choose:${allegiance}`,name:`Report attacker as ${labelOrientation(allegiance)}`}));
  if(action==='plantEscapeRoute')options=(n.reactionRosterSnapshot||state.players).filter(p=>p.alive&&p.targetable!==false).map(p=>playerOf(p.id)).filter(p=>p&&!p.removed&&canAbilityTarget(p)).map(target=>({id:`choose:${target.id}`,name:`Report a visit to ${target.name}`}));
  return {type:'reaction',action,prompt:`${spec.label}: you were attacked. ${reactionDescription(action)}`,options:[...options,{id:'decline',name:'Do not use reaction'}]};
}
function reactionDescription(action) {
  return {
    returnToSender:'Once per game: redirect to the attacker.',blindDeflection:'Once per game: redirect to a random other player, excluding the attacker.',
    decoyTrail:'Once per game: redirect to your secretly nominated decoy.',followFootsteps:'Redirect to the attacker’s other recorded destination, if one exists.',
    visitorDiversion:'Once per game: redirect to a random non-attacking visitor.',brace:'Once per game: stop this attack and lose your next night’s active ability.',
    safetyNumbers:'Stop this attack if someone other than its attacker visited you.',feignDeath:'Once per game: stop this attack; lose your next ability and be silenced tomorrow.',
    bargainLife:'Ask your attacker to spare you in exchange for being silenced tomorrow.',lastShot:'Once per game: disable your attacker’s night reaction on the following night. The original attack continues.',
    exposeAssailant:'Learn the attacker’s role. If you die tonight, announce that role without naming them.',markAssailant:'Once per game: publicly name the attacker at dawn if you die.',
    disarmAssailant:'Your attacker loses their next night’s active ability. This attack continues.',shatterDefences:'Your attacker cannot benefit from ordinary protection or single-use shields next night. This attack continues.',
    mirrorAllegiance:'Once per game: stop this attack and adopt your attacker’s allegiance.',stealWeapon:'Permanently gain the ability that generated the attack. This attack continues.',
    defensiveAwakening:'Once per game: stop this attack, gain Protect and lose this reaction.',vengefulAwakening:'If you survive this attack, gain Kill and lose this reaction.',
    shedIdentity:'Once per game: stop this attack, become a Citizen, and lose your ability and reaction. Retain your allegiance.',
    identifyAssailant:'Immediately learn the attacker’s name during this reaction. The attack continues.',
    readWeapon:'Immediately learn the exact ability that generated this attack during this reaction. The attack continues.',
    traceTheirSteps:'Immediately learn your attacker’s reaction recorded when the attack was created. The attack continues.',
    countThreats:'Immediately learn your attacker’s night ability at the start of tonight. The attack continues.',
    witnessSearch:'Immediately learn your attacker’s exact role at the start of tonight. The attack continues.',
    readTheirPast:'Immediately learn whether the attacker’s allegiance changed between the start of tonight and this attack. Reveal both allegiances only if they differ. The attack continues.',
    counterframe:'Choose a role. On the following night, ordinary role investigations of your attacker report that role. Applies before anyone acts; does not stop this attack.',
    falseColours:'Choose an allegiance. On the following night, ordinary allegiance investigations of your attacker report it. Applies before anyone acts; does not stop this attack.',
    plantEscapeRoute:'Choose a player from the reaction roster. On the following night, Track reports your attacker visiting that player. Creates no real visit; does not stop this attack.',
    eraseFootprints:'On the following night, hide your attacker’s activity and visits from ordinary investigations. Actual effects remain. Does not stop this attack.',
    borrowTheirFace:'On the following night, your attacker appears as your role and allegiance recorded when they attacked you. Does not change either actual identity or stop this attack.',
    scrambleWitnesses:'On the following night, invert shared-visitor investigations involving your attacker. Two affected subjects cancel out. Does not stop this attack.'
  }[action]||'';
}
function renderNewReaction(player) {
  const turn=newReactionTurn(player);if(!turn)return false;
  $('nightPrompt').textContent=turn.prompt;
  const area=$('nightActionArea');area.innerHTML='';
  const complete=value=>{
    try{
      const result=resolveNewReaction(player,value);
      if(state.night.bargain){renderLocalBargain(player);return;}
      showNightResult(escapeHtml(result));area.innerHTML='';
      area.appendChild(actionButton('Continue','newReactionContinue',()=>{setNightBusy(false);renderReactionTurn(player);}));
    }catch(error){showNightResult(escapeHtml(error.message));}
  };
  if(turn.replyForm){renderSealedReplyForm(area,complete);return true;}
  for(const option of turn.options)area.appendChild(actionButton(option.name,option.id,()=>complete(option.id)));
  if(state.night.bargain)renderLocalBargain(player);
  return true;
}
function renderSealedReplyForm(area,submit) {
  const form=document.createElement('form'),label=document.createElement('label');label.textContent='Your private reply (optional; need not be truthful)';
  const input=document.createElement('textarea');input.maxLength=500;label.appendChild(input);form.appendChild(label);
  const send=document.createElement('button');send.type='submit';send.textContent='Send reply';form.appendChild(send);
  form.addEventListener('submit',e=>{e.preventDefault();submit(JSON.stringify({reply:input.value.trim()}));});
  form.appendChild(actionButton('Decline to reply','decline',()=>submit('decline')));area.appendChild(form);
}
function renderLocalBargain(target) {
  const area=$('nightActionArea');area.innerHTML='';
  $('nightPrompt').textContent=`Pass to ${playerOf(state.night.bargain.attackerId)?.name}. Decide whether to spare ${target.name}.`;
  for(const [value,label] of [['spare','Spare them and silence them tomorrow'],['refuse','Refuse the bargain']])area.appendChild(actionButton(label,value,()=>{
    const result=resolveBargain(playerOf(state.night.bargain.attackerId),value);
    showNightResult(escapeHtml(result));area.innerHTML='';
    area.appendChild(actionButton(`Pass back to ${target.name}`,'bargainReturn',()=>renderReactionTurn(target)));
  }));
}
function resolveBargain(actor,value) {
  const n=state.night,b=n.bargain;
  if(!b || b.attackerId!==actor?.id || !['spare','refuse'].includes(value))throw new Error('This bargain is unavailable.');
  const target=playerOf(b.targetId),attack=n.pendingAttacks.find(a=>a.signalAttackId===b.attackId);
  if(attack){removePendingAttack(attack);if(value==='spare'){target.silenced=true;markReactionSuccess(target);}else setPlayerAlive(target,false);}
  delete n.bargain;
  settleUnhandledExtraAttacks(target);
  return value==='spare'?'The attacker accepted. The attack was cancelled; the target is silenced tomorrow.':'The attacker refused. The attack resolved.';
}
function markReactionSuccess(player) {
  if(state.night.exhaustTargets?.includes(player.id))player.disabledReactionRound=state.round+1;
}
function resolveNewReaction(player,value) {
  const n=state.night,turn=newReactionTurn(player);
  if(!turn)throw new Error('No reaction is available.');
  if(n.bargain?.targetId===player.id)throw new Error('Wait for the attacker’s bargain decision.');
  if(turn.replyForm){
    const request=n.replyRequests.find(r=>r.targetId===player.id&&!r.answered);
    let reply='';if(value!=='decline'){let parsed;try{parsed=JSON.parse(value);}catch{throw new Error('Enter a valid reply.');}
      if(typeof parsed.reply!=='string'||parsed.reply.length>500)throw new Error('Reply must be at most 500 characters.');reply=parsed.reply.trim();}
    request.answered=true;
    const message=`${player.name} ${reply?`replied: ${reply}`:'declined to reply.'}`;
    extraNotice(request.actorId,message);return 'Your response was recorded.';
  }
  if(!turn.options.some(option=>option.id===value))throw new Error('Choose a valid reaction.');
  const attack=findPendingAttacksFor(player.id)[0],action=turn.action,attacker=playerOf(attack.attackerId),spec=EXTRA_REACTIONS[action];
  prepareNewReactions();recordSignalAttack(attack);
  const attackSnapshot=n.signalAttacks.find(a=>a.id===attack.signalAttackId);
  const choice=value.startsWith('choose:')?value.slice(7):null;
  n.proposedReactionUsed ||= {};n.proposedReactionUsed[player.id]=true;
  if(value==='decline'){removePendingAttack(attack);setPlayerAlive(player,false);return 'You declined the reaction. The attack resolved.';}
  if(spec.once)(player.used ||= {})[action]=true;
  if(action==='bargainLife'){
    if(!attacker || attacker.removed){removePendingAttack(attack);setPlayerAlive(player,false);return 'The attacker is unavailable to accept a bargain. The attack resolved.';}
    recordSignalAttack(attack);n.bargain={targetId:player.id,attackerId:attack.attackerId,attackId:attack.signalAttackId};return 'Your attacker must decide.';
  }
  const reactionResult=resolveInformationReaction(player,attack,action,choice);
  removePendingAttack(attack);
  let saved=false,success=!!reactionResult;
  if(spec.category==='Redirective'){
    let destination;
    const candidates=(n.reactionRosterSnapshot||[]).filter(p=>p.alive&&p.targetable&&p.id!==player.id).map(p=>playerOf(p.id)).filter(p=>p&&!p.removed);
    if(!attack.escortRedirected && attack.redirectedFrom==null){
      if(action==='returnToSender')destination=attacker;
      if(action==='blindDeflection')destination=randomChoice(candidates.filter(p=>p.id!==attacker?.id));
      if(action==='decoyTrail')destination=playerOf(n.decoyTargets?.[player.id]);
      if(action==='followFootsteps'){
        const record=proposedRecords().find(r=>r.actorId===attacker?.id);
        destination=playerOf(record&&proposedDestinations(record).find(id=>id!==player.id&&id!==attacker?.id));
      }
      if(action==='visitorDiversion')destination=randomChoice(proposedRecords().filter(r=>r.actorId!==attacker?.id&&r.actorId!==player.id&&proposedDestinations(r).includes(player.id)).map(r=>playerOf(r.actorId)).filter(p=>candidates.some(candidate=>candidate.id===p?.id)));
    }
    if(destination && candidates.some(p=>p.id===destination.id) && canAbilityTarget(destination)){
      attack.redirectedFrom=player.id;attack.targetId=destination.id;attack.proposedWardChecked=false;
      n.pendingAttacks.push(attack);recordSignalAttack(attack);saved=success=true;
      if(typeof ensureReactionQueued==='function')ensureReactionQueued(destination);
    }
  }
  if(['brace','feignDeath'].includes(action)){saved=success=true;player.disabledAbilityRound=state.round+1;if(action==='feignDeath')player.silenced=true;}
  if(action==='safetyNumbers')saved=success=proposedRecords().some(r=>r.actorId!==attacker?.id&&proposedDestinations(r).includes(player.id));
  if(action==='lastShot' && attacker && canAbilityTarget(attacker)){
    attacker.disabledReactionRound=state.round+1;success=true;
  }
  if(action==='exposeAssailant' && attacker){
    const title=attackSnapshot?.actorRole?.title||roleOf(attacker)?.title;extraNotice(player.id,`Your attacker’s exact role is ${title}.`);
    player.pendingExposure=`A player attacked tonight by a ${title} died. The attacker is not named.`;success=true;
  }
  if(action==='markAssailant' && attacker){player.pendingExposure=`${attacker.name} attacked ${player.name} tonight.`;success=true;}
  if(action==='disarmAssailant' && attacker){attacker.disabledAbilityRound=state.round+1;success=true;}
  if(action==='shatterDefences' && attacker){attacker.shatteredDefencesRound=state.round+1;extraNotice(attacker.id,'Shatter Defences: ordinary protection and single-use shields will not protect you next night.');success=true;}
  if(action==='mirrorAllegiance' && attacker)saved=success=proposedOverride(player,'orientation',attackSnapshot?.actorOrientation||roleOf(attacker)?.orientation);
  if(action==='stealWeapon')success=proposedOverride(player,'nightAction',attack.sourceAction||'kill');
  if(action==='defensiveAwakening' && !changesPrevented(player) && !n.reactionGuard?.includes(player.id)){
    proposedOverride(player,'nightAction','protect');proposedOverride(player,'nightReaction','none');saved=success=true;
  }
  if(action==='shedIdentity' && !changesPrevented(player) && !n.reactionGuard?.includes(player.id)){
    const orientation=roleOf(player)?.orientation, citizen=typeof roleByIdOrRestore==='function'?roleByIdOrRestore('citizen'):state.roles.find(r=>r.id==='citizen');
    if(citizen && applyPermanentRoleChange(player,citizen.id,player)){proposedOverride(player,'orientation',orientation);proposedOverride(player,'nightAction','none');proposedOverride(player,'nightReaction','none');saved=success=true;}
  }
  if(!saved)setPlayerAlive(player,false);
  if(['exposeAssailant','markAssailant'].includes(action) && player.alive)delete player.pendingExposure;
  if(action==='vengefulAwakening' && player.alive && !changesPrevented(player) && !n.reactionGuard?.includes(player.id)){
    proposedOverride(player,'nightAction','kill');proposedOverride(player,'nightReaction','none');success=true;
  }
  if(success)markReactionSuccess(player);
  return `${reactionResult?`${reactionResult}\n`:''}${spec.label} ${success?'activated':'could not take effect'}. ${player.alive?'You are alive.':'You were killed.'}`;
}
function resolveInformationReaction(player,attack,action,choice) {
  const spec=EXTRA_REACTIONS[action];
  if(!['Investigative','Deceitful'].includes(spec?.category))return '';
  ensureProposedState();
  const n=state.night,attacker=playerOf(attack.attackerId);
  recordSignalAttack(attack);
  const snapshot=n.signalAttacks.find(a=>a.id===attack.signalAttackId),start=n.signalStart?.[attack.attackerId];
  let result='';
  if(action==='identifyAssailant')result='Your attacker is '+(attacker?.name||'an unavailable player')+'.';
  if(action==='readWeapon')result='The triggering attack was generated by '+(NIGHT_ACTIONS[attack.sourceAction]?.label||attack.sourceAction||'an unrecorded ability')+'.';
  if(action==='traceTheirSteps')result='Your attacker’s recorded reaction was '+(NIGHT_REACTIONS[snapshot?.actorReaction??start?.reaction]?.label||'None')+'.';
  if(action==='countThreats')result='Your attacker began tonight with '+(NIGHT_ACTIONS[start?.ability]?.label||'no recorded night ability')+'.';
  if(action==='witnessSearch')result='Your attacker began tonight as '+(start?.roleTitle||'an unrecorded role')+'.';
  if(action==='readTheirPast'){
    const before=start?.orientation,during=snapshot?.actorOrientation;
    result=before&&during?(before===during?'Your attacker’s allegiance was unchanged between the start of tonight and the attack.':'Your attacker began tonight '+labelOrientation(before)+' and was '+labelOrientation(during)+' when the attack was recorded.'):'No complete allegiance history was recorded for your attacker.';
  }
  if(spec.category==='Deceitful'){
    if(!attacker || !canAbilityTarget(attacker))return 'Your attacker cannot receive this effect.';
    const ownRole=snapshot?.targetRoles?.[player.id]||roleOf(player);
    (player.pendingReactionDeceptions ||= []).push({round:state.round+1,playerId:player.id,action,attackerId:attacker.id,choice,role:ownRole?{id:ownRole.id,title:ownRole.title,orientation:ownRole.orientation}:null});
    const detail=action==='counterframe'?'Chosen role: '+state.roles.find(r=>r.id===choice).title+'. ':action==='falseColours'?'Chosen allegiance: '+labelOrientation(choice)+'. ':action==='plantEscapeRoute'?'Chosen destination: '+playerOf(choice).name+'. ':'';
    result=detail+spec.label+' is scheduled for the following night, before anyone acts. It does not change tonight’s reports.';
  }
  if(result)extraNotice(player.id,result);
  return result;
}
function rebuildReactionDeceptions() {
  const n=state.night;n.reactionReportMasks={};n.scrambledWitnesses=[];
  const effects=[...(n.activeReactionDeceptions||[])].sort((a,b)=>b.playerId-a.playerId);
  for(const effect of effects){
    const {action,attackerId,choice,role}=effect,target=playerOf(attackerId);
    if(!target||target.removed||!canAbilityTarget(target))continue;
    if(action==='counterframe'){
      const framed=state.roles.find(r=>r.id===choice);if(framed)n.reactionReportMasks[attackerId]={...(n.reactionReportMasks[attackerId]||{}),id:framed.id,title:framed.title};
    }
    if(action==='falseColours')n.reactionReportMasks[attackerId]={...(n.reactionReportMasks[attackerId]||{}),orientation:choice};
    if(action==='borrowTheirFace'&&role)n.reactionReportMasks[attackerId]={...(n.reactionReportMasks[attackerId]||{}),id:role.id,title:role.title,orientation:role.orientation};
    if(action==='plantEscapeRoute'&&canAbilityTarget(playerOf(choice)))(n.fakeVisits ||= {})[attackerId]=Number(choice);
    if(action==='eraseFootprints')n.hiddenActivity=[...new Set([...(n.hiddenActivity||[]),attackerId])];
    if(action==='scrambleWitnesses')n.scrambledWitnesses.push(attackerId);
  }
}
function restoreReactionTimingState() {
  const n=state.night;if(n.reactionTimingVersion===3)return;
  for(const effect of Object.values(n.reactionDeceptionEffects||{})){
    if(effect.action==='plantEscapeRoute'&&n.fakeVisits)delete n.fakeVisits[effect.attackerId];
    if(effect.action==='eraseFootprints')n.hiddenActivity=(n.hiddenActivity||[]).filter(id=>id!==effect.playerId);
  }
  n.reactionReportMasks={};n.scrambledWitnesses=[];n.activeReactionDeceptions=[];
  n.replyRequests=[];for(const player of state.players)player.dawnMessages=[];
  for(const key of ['settledReportsRequired','finalizingReports','deferredNightReports','reactionDawnQueries','queuedCounterattacks','reactionDeceptionEffects'])delete n[key];
  n.reactionTimingVersion=3;
}
function settleUnhandledExtraAttacks(player) {
  const n=state.night;
  for(const attack of [...findPendingAttacksFor(player.id)]){
    if(!attack.piercing && n.protectedIds?.includes(player.id)){removePendingAttack(attack);continue;}
    if(proposedAttackStopped(attack)){removePendingAttack(attack);continue;}
    if(attack.noReaction || (EXTRA_REACTIONS[nightReactionFor(player)] && !newReactionTurn(player))){removePendingAttack(attack);setPlayerAlive(player,false);}
  }
}
function publishReactionAnnouncements() {
  if(state.night.proposedAnnouncementsPublished)return;
  state.night.proposedAnnouncementsPublished=true;
  state.night.publicReactions=[...(state.night.publicReactions||[]),...(state.night.proposedAnnouncements||[])];
  for(const message of state.night.proposedAnnouncements||[])addLog(message,'public');
}
for(const [action,spec] of Object.entries(EXTRA_REACTIONS))spec.prompt=reactionDescription(action);
