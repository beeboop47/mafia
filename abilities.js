// Additional abilities share selection, validation and resolution in both modes.
const EXTRA_ABILITIES = {
  signalReceiver: {label:'Receive a truthful hint', category:'Passive', prompt:'Receive one random truthful hint during your night reaction turn, after the other reactions. Deceitful abilities cannot tamper with the hint.'},
  hideAllegiance: {label:'Hide Allegiance', category:'Deceitful', prompt:'Choose a player to appear Neutral to allegiance investigations tonight.'},
  fakeVisit: {label:'Fake Visit', category:'Deceitful', second:'player', prompt:'Choose a player and the visitor destination that Track should report tonight.'},
  hideActivity: {label:'Hide Activity', category:'Deceitful', prompt:'Hide a player from Track and Check Activity tonight.'},
  fakeActivity: {label:'Fake Activity', category:'Deceitful', prompt:'Choose a player to make Check Activity report that they used an ability tonight, even if they did nothing. This does not invent visits for Track. Hide Activity overrides this effect.'},
  reverseComparison: {label:'Reverse Comparison', category:'Deceitful', prompt:'Reverse comparison results involving this player tonight. Two reversed players cancel each other out.'},
  swapRoles: {label:'Swap Roles', category:'Transformative', second:'player', prompt:'Choose two players to exchange their roles just before reactions.'},
  changeAllegiance: {label:'Change Allegiance', category:'Transformative', second:'allegiance', prompt:'Choose a player and their new permanent allegiance.'},
  changeAbility: {label:'Change Ability', category:'Transformative', second:'ability', prompt:'Choose a player and their new permanent night ability.'},
  changeReaction: {label:'Change Reaction', category:'Transformative', second:'reaction', prompt:'Choose a player and their new permanent night reaction.'},
  copyAbility: {label:'Copy Ability', category:'Transformative', prompt:'Copy a player\'s ability for the following night only. Your allegiance and reaction stay the same.'},
  blockReaction: {label:'Block Reaction', category:'Offensive', prompt:'Disable a player\'s night reaction tonight.'},
  forceAnswer: {label:'Force Answer', category:'Offensive', text:true, prompt:'Choose a player and a yes/no question they must answer truthfully tomorrow in real life. Do not directly ask their role or allegiance.'},
  blockHarm: {label:'Block Harm', category:'Defensive', prompt:'Protect a player from kills, silence, roleblock and Block Reaction tonight.'},
  takeAttack: {label:'Take Attack', category:'Defensive', prompt:'Take attacks aimed at a chosen player tonight. Your own reaction applies. Each attack is redirected only once.'},
  removeSilence: {label:'Remove Silence', category:'Defensive', prompt:'Cancel silence on a chosen player for the coming day.'},
  preventChanges: {label:'Prevent Changes', category:'Defensive', prompt:'Prevent changes to a player\'s role, allegiance, ability and reaction tonight.'},
  randomAllegiance: {label:'Random Allegiance', category:'Passive', prompt:'Automatically learn a random other living player\'s allegiance during reactions.'},
  detectAttack: {label:'Detect Attack', category:'Passive', prompt:'Automatically learn whether anyone attempted to attack you tonight, without learning who.'},
  surviveOnce: {label:'Survive Once', category:'Passive', prompt:'Automatically survive the first night attack that would kill you. Once per game.'},
  resistSilence: {label:'Resist Silence', category:'Passive', prompt:'Automatically resist silence.'},
  resistChanges: {label:'Resist Changes', category:'Passive', prompt:'Automatically resist changes to your role, allegiance, ability and reaction.'},
  sendNote: {label:'Send Note', category:'Miscellaneous', text:true, prompt:'Send an anonymous private note to a living player, delivered during night reactions.'},
  revealSelf: {label:'Reveal Yourself', category:'Miscellaneous', prompt:'Choose a living player to privately learn your true role and allegiance during night reactions.'},
  predictDeath: {label:'Predict Death', category:'Miscellaneous', prompt:'Predict who will be dead at dawn. Receive the result privately at dawn; there is no mechanical reward.'},
  sendSignal: {label:'Send Signal', category:'Miscellaneous', text:true, prompt:'Choose a player and a gesture or phrase for them to use tomorrow in real life. They will privately receive your name and signal during reactions.'}
};

const NIGHT_ACTIONS = Object.freeze({
  ...NIGHT_REACTIONS,
  ...EXTRA_ABILITIES,
  compare: {label:'Compare players',category:'Investigative'},
  exclude: {label:'Exclude allegiance',category:'Investigative'},
  audit: {label:'Check activity',category:'Investigative'},
  inspectOrientation: {label:'Inspect orientation',category:'Investigative'},
  track: {label:'Track a player',category:'Investigative'},
  janitor: {label:"Reveal a killed player's exact role",category:'Investigative'},
  framer: {label:'Frame a player',category:'Deceitful'},
  changeRole: {label:"Change a player's role permanently",category:'Transformative'},
  teamKill: {label:'Team kill',category:'Offensive'},
  kill: {label:'Kill',category:'Offensive'},
  roleblock: {label:'Roleblock a player',category:'Offensive'},
  silence: {label:'Silence a player',category:'Offensive'},
  protect: {label:'Protect a player',category:'Defensive'},
  doctor: {label:'Doctor revive',category:'Defensive'},
  seer: {label:'Random Role Reveal',category:'Passive'},
  hater: {label:'Assign Target',category:'Miscellaneous'},
  gambler: {label:'Random ability each night',category:'Miscellaneous'},
});

function isPassiveAbility(action) {
  return action === 'seer' || EXTRA_ABILITIES[action]?.category === 'Passive';
}

function extraChoices(actor, action) {
  const spec = EXTRA_ABILITIES[action];
  const targets = validAbilityTargets(actor, roleOf(actor), !!spec.dead).filter(p => spec.dead ? !p.alive : p.alive);
  let secondary = [];
  if (spec.second === 'player') secondary = targets.map(p => ({id:String(p.id), name:p.name}));
  if (spec.second === 'allegiance') secondary = ['good','evil','neutral'].map(id => ({id,name:labelOrientation(id)}));
  if (spec.second === 'ability') secondary = Object.entries(NIGHT_ACTIONS).filter(([id]) => !NIGHT_REACTION_ACTIONS.has(id)).map(([id,a]) => ({id,name:a.label,category:a.category}));
  if (spec.second === 'reaction') secondary = Object.entries(NIGHT_REACTIONS).map(([id,a]) => ({id,name:a.label,category:a.category}));
  return {targets:targets.map(p => ({id:String(p.id),name:p.name})), secondary, text:!!spec.text, passive:isPassiveAbility(action)};
}

function renderExtraForm(area, action, choices, submit) {
  if (choices.passive) { area.appendChild(actionButton('Continue','ack',()=>submit('ack'))); return; }
  const form = document.createElement('form');
  form.style.cssText = 'grid-column:1/-1;display:grid;gap:10px;min-width:0';
  const select = (label, options) => {
    const wrap=document.createElement('label'); wrap.textContent=label;
    const field=document.createElement('select'); field.required=true;
    const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Choose'; field.appendChild(placeholder);
    const categories = action === 'changeAbility' && label === 'Choice' ? NIGHT_ABILITY_CATEGORIES
      : action === 'changeReaction' && label === 'Choice' ? NIGHT_REACTION_CATEGORIES : null;
    if (categories) {
      categories.forEach(category=>{
        const group=document.createElement('optgroup');group.label=category;
        options.filter(o=>o.category===category).forEach(o=>group.appendChild(new Option(o.name,o.id)));
        if(group.children.length)field.appendChild(group);
      });
    } else options.forEach(o=>{const option=document.createElement('option');option.value=o.id;option.textContent=o.name;field.appendChild(option);});
    wrap.appendChild(field);form.appendChild(wrap);return field;
  };
  const target=select('Player',choices.targets);
  const second=choices.secondary.length ? select('Choice',choices.secondary) : null;
  if (EXTRA_ABILITIES[action].second === 'player' && second) target.addEventListener('change',()=>{
    [...second.options].forEach(o=>o.disabled=!!o.value && o.value===target.value);
    if(second.value===target.value) second.value='';
  });
  let text=null;
  if(choices.text){const label=document.createElement('label');label.textContent=action==='forceAnswer'?'Question':action==='sendSignal'?'Signal':'Message';text=document.createElement('textarea');text.required=true;text.maxLength=500;text.rows=3;label.appendChild(text);form.appendChild(label);}
  const send=document.createElement('button');send.type='submit';send.textContent='Confirm';send.disabled=!choices.targets.length;form.appendChild(send);
  form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;submit(JSON.stringify({targetId:Number(target.value),second:second?.value||'',text:text?.value.trim()||''}));});
  form.appendChild(actionButton('Do not use this ability','skip',()=>submit('skip')));
  area.appendChild(form);
}

function parseExtraChoice(actor, action, value) {
  if(isPassiveAbility(action)) return {};
  if(value==='skip') return null;
  let choice;try{choice=JSON.parse(value);}catch{throw new Error('Choose a valid player and option.');}
  const available=extraChoices(actor,action),spec=EXTRA_ABILITIES[action];
  if(!choice || !available.targets.some(p=>p.id===String(choice.targetId)))throw new Error('That player is unavailable.');
  if(spec.second && !available.secondary.some(o=>o.id===choice.second))throw new Error('Choose a valid second option.');
  if(spec.second==='player' && String(choice.targetId)===choice.second)throw new Error('Choose two different players.');
  if(spec.text && (typeof choice.text!=='string'||!choice.text.trim()||choice.text.length>500))throw new Error('Enter between 1 and 500 characters.');
  return {targetId:Number(choice.targetId),second:choice.second||'',text:spec.text?choice.text.trim():''};
}

function recordExtraChoice(actor, action, choice) {
  const n=state.night;n.extraActions=n.extraActions||{};
  n.extraActions[actor.id]={action,...choice};
  if(!isPassiveAbility(action))recordNightAction(actor,action,choice.targetId,{targetIds:EXTRA_ABILITIES[action].second==='player'?[choice.targetId,Number(choice.second)]:[choice.targetId]});
}

function initializeExtraNight() {
  const n=state.night;n.startAbilities={};n.extraNotices={};n.extraActions={};
  n.gamblerActions ||= {};
  for(const p of state.players){
    if(p.copiedAbility && p.copiedAbility.round < state.round)delete p.copiedAbility;
    if(p.copiedAbility?.round===state.round && p.copiedAbility.action==='gambler')n.gamblerActions[p.id]=scheduledGamblerAbility(p);
  }
  initializeSignalNight();
  for(const p of state.players){
    p.dawnMessages=[];
    n.startAbilities[p.id]=nightActionFor(p);
    if(p.alive && n.startAbilities[p.id]==='seer'){
      const key=n.round1SeerTargets?'round1SeerTargets':'seerTargets';n[key]=n[key]||{};
      if(n[key][p.id]==null)n[key][p.id]=scheduledSeerTarget(p, playersAlive().filter(t=>t.id!==p.id && canAbilityTarget(t)));
    }
    if(p.alive && isPassiveAbility(n.startAbilities[p.id]) && n.startAbilities[p.id]!=='seer')recordExtraChoice(p,n.startAbilities[p.id],{});
  }
}

function extraNotice(id, message) {
  const n=state.night;n.extraNotices=n.extraNotices||{};n.extraNotices[id]=n.extraNotices[id]||[];
  n.extraNotices[id].push(message);
}

function extraNoticesFor(player) {
  return (state.night?.extraNotices?.[player.id]||[]).join('\n');
}

function changesPrevented(player) {
  return isJudge(player) || (state.phase==='night' && (state.night?.changeProtected?.includes(player.id) || nightActionFor(player)==='resistChanges'));
}

function resolveExtraDefenses() {
  const n=state.night;if(n.extraDefensesResolved)return;n.extraDefensesResolved=true;
  const entries=Object.entries(n.extraActions||{}).filter(([,c])=>extraTargetsAvailable(c));
  n.harmProtected=[];n.changeProtected=[];n.escorts={};n.reactionBlocked=[];
  // Full protection resolves first, including protection from roleblock.
  for(const [,c] of entries)if(c.action==='blockHarm')n.harmProtected.push(c.targetId);
  for(const block of n.localRoleblocks||[])if(canAbilityTarget(playerOf(block.targetId)) && !n.harmProtected.includes(block.targetId))n.blockedIds.push(block.targetId);
  n.blockedIds=(n.blockedIds||[]).filter(id=>canAbilityTarget(playerOf(id)) && !n.harmProtected.includes(id));
  for(const [id,c] of entries){
    if(n.blockedIds.includes(Number(id)) && !isPassiveAbility(c.action))continue;
    if(c.action==='preventChanges')n.changeProtected.push(c.targetId);
    if(c.action==='takeAttack' && n.escorts[c.targetId]==null)n.escorts[c.targetId]=Number(id);
    if(c.action==='blockReaction' && !n.harmProtected.includes(c.targetId))n.reactionBlocked.push(c.targetId);
    if(c.action==='removeSilence' && playerOf(c.targetId))playerOf(c.targetId).silenced=false;
  }
  for(const p of state.players)if(n.harmProtected.includes(p.id)||n.startAbilities?.[p.id]==='resistSilence')p.silenced=false;
  n.protectedIds=[...new Set([...(n.protectedIds||[]),...n.harmProtected])];
  // Local turns collect actions before late protection and roleblocks settle.
  if(n.localRoleblocks?.length){
    for(const id of n.blockedIds){
      const record=n.actionRecords?.[id];
      if(record?.action==='protect')n.protectedIds=n.protectedIds.filter(targetId=>targetId!==record.targetId||n.harmProtected.includes(targetId)||Object.values(n.actionRecords).some(r=>r.actorId!==id&&!n.blockedIds.includes(r.actorId)&&r.action==='protect'&&r.targetId===targetId));
      if(record?.action==='silence' && playerOf(record.targetId))playerOf(record.targetId).silenced=false;
      if(record?.action==='framer' && playerOf(record.targetId))playerOf(record.targetId).framedRoleId=null;
      for(const key of ['inspectTargets','seerTargets','trackTargets','watchTargets'])if(n[key])delete n[key][id];
      // Keep truthful submission history even when a late block cancels it.
      if(n.actionRecords)delete n.actionRecords[id];
    }
    n.pendingAttacks=(n.pendingAttacks||[]).filter(a=>!n.blockedIds.includes(a.attackerId));
  }
}

function resolveExtraEffects() {
  const n=state.night;if(n.extraEffectsResolved)return;n.extraEffectsResolved=true;
  n.hiddenActivity=[];n.fakeActivity=[];n.fakeVisits={};n.hiddenAllegiance=[];n.reversedComparison=[];
  for(const [id,c] of Object.entries(n.extraActions||{})){
    const actor=playerOf(id),target=playerOf(c.targetId);
    if(!extraTargetsAvailable(c))continue;
    if(n.blockedIds?.includes(Number(id)) && !isPassiveAbility(c.action)){extraNotice(id,'Your ability was blocked.');continue;}
    if(['hideActivity','fakeActivity','hideAllegiance','reverseComparison'].includes(c.action)){
      const key={hideActivity:'hiddenActivity',fakeActivity:'fakeActivity',hideAllegiance:'hiddenAllegiance',reverseComparison:'reversedComparison'}[c.action];n[key].push(c.targetId);
    }
    if(c.action==='fakeVisit')n.fakeVisits[c.targetId]=Number(c.second);
    if(c.action==='swapRoles'){
      const second=playerOf(c.second);
      if(target?.alive && second?.alive && !changesPrevented(target) && !changesPrevented(second)){
        const firstRole=target.roleId,secondRole=second.roleId;
        const firstOverrides=target.roleOverrides,secondOverrides=second.roleOverrides;
        applyPermanentRoleChange(target,secondRole,actor);applyPermanentRoleChange(second,firstRole,actor);
        target.roleOverrides=secondOverrides||{};second.roleOverrides=firstOverrides||{};
        extraNotice(target.id,`Your role is now ${roleOf(target).title}.`);extraNotice(second.id,`Your role is now ${roleOf(second).title}.`);
      }
    }
    if(['changeAllegiance','changeAbility','changeReaction'].includes(c.action) && target?.alive && !changesPrevented(target)){
      const field={changeAllegiance:'orientation',changeAbility:'nightAction',changeReaction:'nightReaction'}[c.action];
      recordSignalChange(target, {orientation:'orientation',nightAction:'ability',nightReaction:'reaction'}[field], roleOf(target)?.[field], c.second);
      target.roleOverrides={...(target.roleOverrides||{}),[field]:c.second};
      const label=field==='orientation'?labelOrientation(c.second):(NIGHT_ACTIONS[c.second]||NIGHT_REACTIONS[c.second])?.label;
      extraNotice(target.id,`${EXTRA_ABILITIES[c.action].label}: you now have ${label}.`);
    }
    if(c.action==='copyAbility' && target && !changesPrevented(actor)){
      actor.copiedAbility={action:n.startAbilities[target.id]||'none',round:state.round+1};
      extraNotice(actor.id,`Next night you will use ${NIGHT_ACTIONS[actor.copiedAbility.action]?.label||'None'}.`);
    }
    if(c.action==='forceAnswer' && target && !n.harmProtected?.includes(target.id))extraNotice(target.id,`${actor.name} asks: ${c.text} Answer yes or no truthfully tomorrow in real life. Questions directly asking your role or allegiance are invalid.`);
    if(c.action==='sendSignal' && target)extraNotice(target.id,`${actor.name} requests this signal tomorrow: ${c.text}`);
    if(c.action==='sendNote' && target)extraNotice(target.id,`Anonymous note: ${c.text}`);
    if(c.action==='randomAllegiance'){
      const random=randomChoice(playersAlive().filter(p=>p.id!==actor.id && canAbilityTarget(p)));
      // Final allegiance is evaluated after all transformations and deception.
      n.randomAllegianceTargets=n.randomAllegianceTargets||{};n.randomAllegianceTargets[id]=random?.id??null;
    }
  }
  for(const [id,c] of Object.entries(n.extraActions||{})){
    if(c.action!=='revealSelf'||n.blockedIds?.includes(Number(id)))continue;
    const actor=playerOf(id),target=playerOf(c.targetId),role=roleOf(actor);
    if(actor && canAbilityTarget(target) && role)extraNotice(target.id,`${actor.name} revealed their true role to you: ${role.title} (${labelOrientation(role.orientation)}).`);
  }
}

function prepareExtraAttacks() {
  const n=state.night;if(n.extraAttacksPrepared)return;n.extraAttacksPrepared=true;
  n.pendingAttacks=(n.pendingAttacks||[]).filter(a=>canAbilityTarget(playerOf(a.targetId)));
  const attempted=new Set((n.pendingAttacks||[]).map(a=>a.targetId));
  for(const attack of n.pendingAttacks||[]){
    recordSignalAttack(attack);
    const escort=playerOf(n.escorts?.[attack.targetId]);
    if(escort?.alive && canAbilityTarget(escort) && !attack.escortRedirected && !n.protectedIds?.includes(attack.targetId)){attack.redirectedFrom=attack.targetId;attack.targetId=escort.id;attack.escortRedirected=true;attempted.add(escort.id);recordSignalAttack(attack);}
    if(n.deathSources)n.deathSources[attack.targetId]=attack.attackerId;
  }
  n.pendingAttacks=(n.pendingAttacks||[]).filter(attack=>{
    const target=playerOf(attack.targetId);
    return !target || n.protectedIds?.includes(target.id) || !survivePassiveAttack(target);
  });
  if (state.narratorMode) n.attackAttemptedIds = [...new Set([...(n.attackAttemptedIds || []), ...attempted])];
  else for(const [id,action] of Object.entries(n.startAbilities||{})){
    if(action==='detectAttack')extraNotice(id,attempted.has(Number(id))?'Someone attempted to attack you tonight.':'No one attempted to attack you tonight.');
  }
  for(const [id,targetId] of Object.entries(n.randomAllegianceTargets||{})){
    if (state.narratorMode && n.narratorRandomInfoShown?.includes(id)) continue;
    const target=targetId==null?null:playerOf(targetId);
    extraNotice(id,target?`${target.name} is ${labelOrientation(investigationRoleOf(target)?.orientation)}.`:'No other living player was available.');
    if (state.narratorMode) (n.narratorRandomInfoShown ||= []).push(id);
  }
}

function survivePassiveAttack(target) {
  if(nightActionFor(target)!=='surviveOnce'||target.used?.surviveOnce)return false;
  target.used=target.used||{};target.used.surviveOnce=true;
  (state.night.signalSurvivals ||= []).push(target.id);
  extraNotice(target.id,'Survive Once saved you from a lethal attack. It is now used up.');
  return true;
}

function finishExtraNight() {
  const n=state.night;if(n.extraFinished)return;n.extraFinished=true;
  for(const [id,c] of Object.entries(n.extraActions||{}))if(c.action==='predictDeath'&&!n.blockedIds?.includes(Number(id))){
    const target=playerOf(c.targetId),actor=playerOf(id);if(actor)actor.dawnMessages=[...(actor.dawnMessages||[]),`Prediction: ${target?.name||'Your target'} ${target&&!target.alive?'was dead at dawn. Correct.':'was alive at dawn. Incorrect.'}`];
  }
  for(const p of state.players){for(const letter of p.pendingLetters||[])p.dawnMessages=[...(p.dawnMessages||[]),`Anonymous note: ${letter.text}`];p.pendingLetters=[];}
}

function extraTargetsAvailable(choice) {
  if(isPassiveAbility(choice.action))return true;
  if(!canAbilityTarget(playerOf(choice.targetId)))return false;
  return EXTRA_ABILITIES[choice.action]?.second!=='player' || canAbilityTarget(playerOf(choice.second));
}

function showLocalDawnMessages() {
  const recipients=state.players.filter(p=>p.dawnMessages?.length);
  if(!recipients.length)return;
  let index=0;
  const dialog=document.createElement('dialog');dialog.style.cssText='max-width:min(560px,90vw);width:90vw;background:#12151d;color:#fff;border:1px solid #444;border-radius:8px;padding:24px';
  document.body.appendChild(dialog);
  const render=()=>{
    dialog.replaceChildren();const recipient=recipients[index];
    const title=document.createElement('h3');title.textContent=`Pass to ${recipient.name}`;dialog.appendChild(title);
    dialog.appendChild(actionButton('Reveal private messages','reveal',()=>{
      dialog.replaceChildren();const message=document.createElement('div');message.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:16px';message.textContent=recipient.dawnMessages.join('\n\n');dialog.appendChild(message);
      dialog.appendChild(actionButton('Hide & pass','next',()=>{recipient.dawnMessages=[];index++;if(index<recipients.length)render();else{dialog.close();dialog.remove();}}));
    }));
  };
  dialog.addEventListener('cancel',e=>e.preventDefault());render();dialog.showModal();
}
