// Additional abilities share selection, validation and resolution in both modes.
const EXTRA_ABILITIES = {
  inspectReaction:{label:'Inspect Reaction',category:'Investigative',prompt:'Learn a player’s current night reaction.'},
  traceAllegiance:{label:'Trace Allegiance',category:'Investigative',prompt:'Learn a player’s allegiance at the start of tonight.'},
  checkProtection:{label:'Check Protection',category:'Investigative',prompt:'Learn whether a player received attack protection tonight.'},
  findInterference:{label:'Find Interference',category:'Investigative',prompt:'Learn whether a player’s ability or reaction was blocked tonight.'},
  compareVisitors:{label:'Compare Visitors',category:'Investigative',second:'player',prompt:'Learn whether anyone visited both chosen players tonight.'},
  examineRemains:{label:'Examine Remains',category:'Investigative',dead:true,prompt:'Learn the ability a dead player had immediately before their most recent death.'},
  forgeReaction:{label:'Forge Reaction',category:'Deceitful',second:'reaction',prompt:'Choose the reaction Inspect Reaction will report for a player tonight.'},
  swapReports:{label:'Swap Reports',category:'Deceitful',second:'player',prompt:'Swap two players’ ordinary role and allegiance investigation reports tonight.'},
  falseProtection:{label:'False Protection',category:'Deceitful',prompt:'Make Check Protection report protection for a player. Grants no protection.'},
  concealVisitor:{label:'Conceal Visitor',category:'Deceitful',second:'player',prompt:'Choose a visitor, then a destination. Hide that visit from ordinary investigations tonight.'},
  forgeInterference:{label:'Forge Interference',category:'Deceitful',prompt:'Make Find Interference report a roleblock without actually blocking the player.'},
  plantEvidence:{label:'Plant Evidence',category:'Deceitful',prompt:'Ordinary role and allegiance investigations report this player’s identity from the start of tonight.'},
  exchangeAbilities:{label:'Exchange Abilities',category:'Transformative',second:'player',prompt:'Permanently swap two players’ night abilities.'},
  exchangeReactions:{label:'Exchange Reactions',category:'Transformative',second:'player',prompt:'Permanently swap two players’ night reactions.'},
  borrowReaction:{label:'Borrow Reaction',category:'Transformative',prompt:'Use a chosen player’s reaction on the following night only.'},
  temporaryConversion:{label:'Temporary Conversion',category:'Transformative',second:'allegiance',once:true,prompt:'Once per game: change a player’s allegiance for the following night. Reverts at dawn before win checks.'},
  restoreIdentity:{label:'Restore Identity',category:'Transformative',once:true,prompt:'Once per game: restore a player’s originally dealt role, allegiance, ability and reaction. Spent uses remain spent.'},
  bestowAbility:{label:'Bestow Ability',category:'Transformative',prompt:'Permanently give another player your ability, replacing theirs. Your ability becomes None.'},
  piercingAttack:{label:'Piercing Attack',category:'Offensive',once:true,prompt:'Once per game: attack through ordinary protection. Reactions still apply.'},
  ambush:{label:'Ambush',category:'Offensive',prompt:'Attack a player only if they made a recorded visit tonight.'},
  sabotage:{label:'Sabotage',category:'Offensive',prompt:'Stop a player’s active Defensive ability tonight.'},
  jamInvestigation:{label:'Jam Investigation',category:'Offensive',prompt:'Withhold a player’s active Investigative results tonight. Their visits still occur.'},
  delayedStrike:{label:'Delayed Strike',category:'Offensive',prompt:'Mark a player for an attack next night. They are privately warned.'},
  exhaustReaction:{label:'Exhaust Reaction',category:'Offensive',prompt:'If this player successfully uses a reaction tonight, disable it next night.'},
  singleWard:{label:'Single Ward',category:'Defensive',prompt:'Cancel the first attack against a player tonight.'},
  sanctuary:{label:'Sanctuary',category:'Defensive',prompt:'Protect another player from attacks and prevent their active ability tonight.'},
  secureInformation:{label:'Secure Information',category:'Defensive',prompt:'Protect a player’s investigation results from deceit tonight.'},
  guardReaction:{label:'Guard Reaction',category:'Defensive',prompt:'Prevent a player’s reaction being blocked or changed tonight.'},
  reserveShield:{label:'Reserve Shield',category:'Defensive',prompt:'Give a player a shield against their first attack next night.'},
  secondChance:{label:'Second Chance',category:'Defensive',once:true,prompt:'Once per game: revive this living player at dawn if they die tonight.'},
  visitorCounter:{label:'Visitor Counter',category:'Passive',prompt:'Automatically learn the number of distinct visitors to you tonight.'},
  changeAwareness:{label:'Change Awareness',category:'Passive',prompt:'Automatically learn which parts of your identity changed tonight.'},
  blockAwareness:{label:'Block Awareness',category:'Passive',prompt:'Automatically learn whether your ability or reaction was blocked tonight.'},
  deathEcho:{label:'Faction Memory',category:'Passive',prompt:'During your regular night turn, learn how many players already dead at the start of tonight shared your starting allegiance.'},
  firstContact:{label:'First Contact',category:'Passive',prompt:'Once per game, learn the name of one randomly selected visitor on your first night receiving visits.'},
  deceptionAlarm:{label:'Deception Alarm',category:'Passive',prompt:'Automatically learn whether a deceitful investigation effect was applied to you tonight.'},
  deadLetter:{label:'Signed Letter',category:'Miscellaneous',text:true,prompt:'Send a living player a private message signed with your name, delivered on their regular night turn.'},
  sealedReply:{label:'Private Question',category:'Miscellaneous',text:true,prompt:'Send a living player a private question on their regular night turn. Ask them to answer during the day in person; they need not tell the truth.'},
  publicNotice:{label:'Public Notice',category:'Miscellaneous',noTarget:true,text:true,prompt:'Write an anonymous message to display publicly at dawn, even if you die.'},
  recognitionLink:{label:'Recognition Link',category:'Miscellaneous',second:'player',prompt:'Privately introduce two players to each other by name, without revealing identities.'},
  contingencyNote:{label:'Shared Note',category:'Miscellaneous',second:'player',text:true,prompt:'Send the same anonymous private note to two different living players on their regular night turns.'},
  passToken:{label:'Pass the Token',category:'Miscellaneous',prompt:'Give a player a visible token at dawn. The holder may pass it on later nights. Grants no protection or information.'},
  signalReceiver: {label:'Receive a truthful hint', category:'Passive', prompt:'Receive one random truthful hint during your normal night reaction turn. It describes information available so far tonight. Deceitful abilities cannot tamper with the hint.'},
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
  predictDeath: {label:'Read Last Night', category:'Miscellaneous', prompt:'Choose a player. During your regular night turn, learn whether they died during the preceding night, including if subsequently revived.'},
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
  const targets = (spec.dead ? state.players.filter(p=>!p.removed && canAbilityTarget(p)) : validAbilityTargets(actor, roleOf(actor))).filter(p => spec.dead ? !p.alive : p.alive).filter(p=>!['sanctuary','bestowAbility'].includes(action)||p.id!==actor.id);
  let secondary = [];
  if (spec.second === 'player') secondary = targets.map(p => ({id:String(p.id), name:p.name}));
  if (spec.second === 'allegiance') secondary = ['good','evil','neutral'].map(id => ({id,name:labelOrientation(id)}));
  if (spec.second === 'ability') secondary = Object.entries(NIGHT_ACTIONS).filter(([id]) => !NIGHT_REACTION_ACTIONS.has(id)).map(([id,a]) => ({id,name:a.label,category:a.category}));
  if (spec.second === 'reaction') secondary = Object.entries(NIGHT_REACTIONS).map(([id,a]) => ({id,name:a.label,category:a.category}));
  if(spec.second==='reaction')secondary.unshift({id:'none',name:'None',category:'Defensive'});
  return {targets:targets.map(p => ({id:String(p.id),name:p.name})), secondary, text:!!spec.text, noTarget:!!spec.noTarget, passive:isPassiveAbility(action)};
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
  const target=choices.noTarget ? null : select('Player',choices.targets);
  const second=choices.secondary.length ? select('Choice',choices.secondary) : null;
  if (EXTRA_ABILITIES[action].second === 'player' && second) target.addEventListener('change',()=>{
    [...second.options].forEach(o=>o.disabled=!!o.value && o.value===target.value);
    if(second.value===target.value) second.value='';
  });
  let text=null;
  if(choices.text){const label=document.createElement('label');label.textContent=action==='forceAnswer'?'Question':action==='sendSignal'?'Signal':'Message';text=document.createElement('textarea');text.required=true;text.maxLength=500;text.rows=3;label.appendChild(text);form.appendChild(label);}
  const send=document.createElement('button');send.type='submit';send.textContent='Confirm';send.disabled=!choices.noTarget&&!choices.targets.length;form.appendChild(send);
  form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;submit(JSON.stringify({targetId:target?Number(target.value):null,second:second?.value||'',text:text?.value.trim()||''}));});
  form.appendChild(actionButton('Do not use this ability','skip',()=>submit('skip')));
  area.appendChild(form);
}

function parseExtraChoice(actor, action, value) {
  if(isPassiveAbility(action)) return {};
  if(value==='skip') return null;
  if(EXTRA_ABILITIES[action]?.once && actor.used?.[action])throw new Error('This once-per-game ability has already been spent.');
  let choice;try{choice=JSON.parse(value);}catch{throw new Error('Choose a valid player and option.');}
  const available=extraChoices(actor,action),spec=EXTRA_ABILITIES[action];
  if(!choice || (!spec.noTarget && !available.targets.some(p=>p.id===String(choice.targetId))))throw new Error('That player is unavailable.');
  if(spec.second && !available.secondary.some(o=>o.id===choice.second))throw new Error('Choose a valid second option.');
  if(spec.second==='player' && String(choice.targetId)===choice.second)throw new Error('Choose two different players.');
  if(spec.text && (typeof choice.text!=='string'||!choice.text.trim()||choice.text.length>500))throw new Error('Enter between 1 and 500 characters.');
  return {targetId:spec.noTarget?null:Number(choice.targetId),second:choice.second||'',text:spec.text?choice.text.trim():''};
}

function recordExtraChoice(actor, action, choice) {
  const n=state.night;n.extraActions=n.extraActions||{};
  n.extraActions[actor.id]={action,...choice};
  if(EXTRA_ABILITIES[action]?.once)(actor.used ||= {})[action]=true;
  if(!isPassiveAbility(action))recordNightAction(actor,action,choice.targetId,{targetIds:EXTRA_ABILITIES[action].noTarget?[]:EXTRA_ABILITIES[action].second==='player'?[choice.targetId,Number(choice.second)]:[choice.targetId]});
}

function initializeExtraNight() {
  const n=state.night;n.startAbilities={};n.extraNotices={};n.extraActions={};
  n.gamblerActions ||= {};
  for(const p of state.players){
    if(p.copiedAbility && p.copiedAbility.round < state.round)delete p.copiedAbility;
    if(p.copiedAbility?.round===state.round && p.copiedAbility.action==='gambler')n.gamblerActions[p.id]=scheduledGamblerAbility(p);
  }
  initializeProposedNight();
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
  const info=(state.night?.round===2 || state.night?.narratorReporting)?proposedInfoResult(player):'';
  return [...(state.night?.extraNotices?.[player.id]||[]),info].filter(Boolean).join('\n');
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
  resolveProposedDefenses();
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
        const firstReaction=nightReactionFor(target),secondReaction=nightReactionFor(second);
        const firstOverrides=target.roleOverrides,secondOverrides=second.roleOverrides;
        applyPermanentRoleChange(target,secondRole,actor);applyPermanentRoleChange(second,firstRole,actor);
        target.roleOverrides=secondOverrides||{};second.roleOverrides=firstOverrides||{};
        if(n.reactionGuard?.includes(target.id))target.roleOverrides={...target.roleOverrides,nightReaction:firstReaction};
        if(n.reactionGuard?.includes(second.id))second.roleOverrides={...second.roleOverrides,nightReaction:secondReaction};
        extraNotice(target.id,`Your role is now ${roleOf(target).title}.`);extraNotice(second.id,`Your role is now ${roleOf(second).title}.`);
      }
    }
    if(['changeAllegiance','changeAbility','changeReaction'].includes(c.action) && target?.alive && !changesPrevented(target) && !(c.action==='changeReaction'&&n.reactionGuard?.includes(target.id))){
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
  resolveProposedEffects();
  rebuildReactionDeceptions();
}

function prepareExtraAttacks() {
  const n=state.night;if(n.extraAttacksPrepared)return;n.extraAttacksPrepared=true;
  prepareNewReactions();
  prepareProposedAttacks();
  n.pendingAttacks=(n.pendingAttacks||[]).filter(a=>canAbilityTarget(playerOf(a.targetId))).sort((a,b)=>Number(a.attackerId)-Number(b.attackerId)||String(a.sourceAction||'').localeCompare(String(b.sourceAction||'')));
  const attempted=new Set((n.pendingAttacks||[]).map(a=>a.targetId));
  for(const attack of n.pendingAttacks||[]){
    recordSignalAttack(attack);
    const escort=playerOf(n.escorts?.[attack.targetId]);
    if(escort?.alive && canAbilityTarget(escort) && !attack.escortRedirected && attack.redirectedFrom==null && (!n.protectedIds?.includes(attack.targetId)||attack.piercing)){attack.redirectedFrom=attack.targetId;attack.targetId=escort.id;attack.escortRedirected=true;attempted.add(escort.id);recordSignalAttack(attack);}
    if(n.deathSources)n.deathSources[attack.targetId]=attack.attackerId;
  }
  n.pendingAttacks=(n.pendingAttacks||[]).filter(attack=>{
    const target=playerOf(attack.targetId);
    if(proposedAttackStopped(attack))return false;
    return !target || (!attack.piercing && n.protectedIds?.includes(target.id)) || nightReactionFor(target)==='vengefulAwakening' || !survivePassiveAttack(target);
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
  finishProposedNight();

}

function extraTargetsAvailable(choice) {
  if(EXTRA_ABILITIES[choice.action]?.noTarget)return true;
  if(isPassiveAbility(choice.action))return true;
  if(!canAbilityTarget(playerOf(choice.targetId)))return false;
  return EXTRA_ABILITIES[choice.action]?.second!=='player' || canAbilityTarget(playerOf(choice.second));
}

// Expansion abilities use the same recorded events and authoritative host state in both modes.
function proposedEntries() {
  ensureProposedState();
  return Object.entries(state.night.extraActions||{}).filter(([id,c])=>extraTargetsAvailable(c) && (!state.night.blockedIds?.includes(Number(id)) || isPassiveAbility(c.action)));
}
function ensureProposedState() {
  const n=state.night;
  for(const key of ['proposedProcessed','proposedAttackProcessed','proposedReactionUsed','reportSwaps','forgedReactions','proposedResults','decoyTargets','tokenPlans','reactionReportMasks'])n[key] ||= {};
  for(const key of ['proposedAnnouncements','singleWards','revivalWards','infoSecure','reactionGuard','jammed','exhaustTargets','plantedEvidence','falseProtection','forgedInterference','concealedVisits','replyRequests','scrambledWitnesses'])n[key] ||= [];
}
function proposedRecords() {
  return Object.values(state.night.actionRecords||{}).filter(r=>!state.night.blockedIds?.includes(r.actorId) && !isPassiveAbility(r.action));
}
function proposedDestinations(record) {
  return [...new Set(record.targetIds || (record.targetId==null?[]:[record.targetId]))];
}
function proposedVisitors(id, viewer=null) {
  const n=state.night, secure=viewer!=null && n.infoSecure?.includes(Number(viewer));
  return proposedRecords().filter(r=>{
    if(secure)return proposedDestinations(r).includes(Number(id));
    if(n.hiddenActivity?.includes(r.actorId))return false;
    if(n.fakeVisits?.[r.actorId]!=null)return Number(n.fakeVisits[r.actorId])===Number(id);
    return proposedDestinations(r).includes(Number(id)) && !n.concealedVisits?.some(v=>v.actorId===r.actorId && v.targetId===Number(id));
  });
}
function proposedOverride(player, field, value) {
  if(!player || changesPrevented(player) || (field==='nightReaction' && state.night.reactionGuard?.includes(player.id)))return false;
  recordSignalChange(player,{nightAction:'ability',nightReaction:'reaction',orientation:'orientation'}[field],roleOf(player)?.[field],value);
  player.roleOverrides={...(player.roleOverrides||{}),[field]:value};
  extraNotice(player.id,`Your ${field==='nightAction'?'night ability':field==='nightReaction'?'night reaction':'allegiance'} is now ${NIGHT_ACTIONS[value]?.label||NIGHT_REACTIONS[value]?.label||value}.`);
  return true;
}
function initializeProposedNight() {
  const n=state.night;
  n.proposedProcessed={};n.proposedAttackProcessed={};n.proposedReactionUsed={};n.proposedAnnouncements=[];
  n.singleWards=[];n.wardRecipients=[];n.revivalWards=[];n.infoSecure=[];n.reactionGuard=[];n.jammed=[];n.exhaustTargets=[];
  n.reportSwaps={};n.plantedEvidence=[];n.forgedReactions={};n.falseProtection=[];n.forgedInterference=[];n.concealedVisits=[];
  n.hiddenActivity=[];n.fakeActivity=[];n.fakeVisits={};n.hiddenAllegiance=[];n.reversedComparison=[];
  n.replyRequests=[];n.proposedResults={};n.decoyTargets={};n.tokenPlans={};n.dueDelayedAttacks=[];
  n.reactionReportMasks={};n.scrambledWitnesses=[];n.activeReactionDeceptions=[];n.reactionTimingVersion=3;
  for(const key of ['settledReportsRequired','finalizingReports','deferredNightReports','reactionDawnQueries','queuedCounterattacks','reactionDeceptionEffects','reactionRosterSnapshot','reactionCountersSettled'])delete n[key];
  for(const p of state.players){
    n.activeReactionDeceptions.push(...(p.pendingReactionDeceptions||[]).filter(effect=>effect.round===state.round));
    p.pendingReactionDeceptions=(p.pendingReactionDeceptions||[]).filter(effect=>effect.round>state.round);
    p.originalIdentity ||= {roleId:p.roleId,roleOverrides:{...(p.roleOverrides||{})}};
    if(p.borrowedReaction?.round<state.round)delete p.borrowedReaction;
    if(p.temporaryOrientation?.round===state.round){
      p.temporaryOrientation.before=roleOf(p)?.orientation;
      p.roleOverrides={...(p.roleOverrides||{}),orientation:p.temporaryOrientation.value};
    }
    if(p.reserveShieldRound===state.round){n.singleWards.push(p.id);n.wardRecipients.push(p.id);}
    if(p.reserveShieldRound<=state.round)delete p.reserveShieldRound;
    if(p.disabledAbilityRound===state.round && !n.blockedIds?.includes(p.id))(n.blockedIds ||= []).push(p.id);
    if(p.delayedAttacks?.length){
      for(const mark of p.delayedAttacks.filter(m=>m.round===state.round)){
        if(p.alive && canAbilityTarget(p))n.dueDelayedAttacks.push({attackerId:mark.actorId,targetId:p.id,sourceAction:'delayedStrike'});
      }
      p.delayedAttacks=p.delayedAttacks.filter(m=>m.round>state.round);
    }
  }
  rebuildReactionDeceptions();
}
function resolveProposedDefenses() {
  const n=state.night;
  const choices=proposedEntries();
  n.reactionGuard=choices.filter(([,c])=>c.action==='guardReaction').map(([,c])=>c.targetId);
  n.reactionBlocked=n.reactionBlocked.filter(id=>!n.reactionGuard.includes(id));
  // Sanctuary suppresses the protected player's action. Sabotage suppresses Defensive actions only.
  const suppressed=[];
  for(const [,c] of choices){
    const action=n.startAbilities?.[c.targetId] || nightActionFor(playerOf(c.targetId));
    if(!n.harmProtected?.includes(c.targetId) && (c.action==='sanctuary' || (c.action==='sabotage' && NIGHT_ACTIONS[action]?.category==='Defensive')))suppressed.push(c.targetId);
  }
  n.blockedIds=[...new Set([...(n.blockedIds||[]),...suppressed.filter(id=>!n.harmProtected?.includes(id))])];
  const active=proposedEntries();
  for(const [id,c] of active){
    const key=`defense:${id}:${c.action}`;
    if(n.proposedProcessed[key])continue;
    n.proposedProcessed[key]=true;
    if(c.action==='sanctuary')(n.protectedIds ||= []).push(c.targetId);
    if(c.action==='singleWard'){n.singleWards.push(c.targetId);(n.wardRecipients ||= []).push(c.targetId);}
    if(c.action==='secondChance')n.revivalWards.push(c.targetId);
    if(c.action==='secureInformation')n.infoSecure.push(c.targetId);
    if(c.action==='reserveShield')playerOf(c.targetId).reserveShieldRound=state.round+1;
    if(c.action==='jamInvestigation')n.jammed.push(c.targetId);
    if(c.action==='exhaustReaction')n.exhaustTargets.push(c.targetId);
  }
  // Remove already-collected effects from suppressed actions in offline play as well.
  for(const id of suppressed){
    const r=n.actionRecords?.[id];
    const intent=r || n.round1Actions?.[id];
    if(intent?.action==='roleblock'){
      const destination=intent.targetId;
      const another=(n.localRoleblocks||[]).some(b=>b.targetId===destination&&b.actorId!==id&&!suppressed.includes(b.actorId)) || Object.entries(n.round1Actions||{}).some(([actor,c])=>Number(actor)!==id&&!suppressed.includes(Number(actor))&&c.action==='roleblock'&&c.targetId===destination);
      if(!another && !suppressed.includes(destination) && playerOf(destination)?.disabledAbilityRound!==state.round)n.blockedIds=n.blockedIds.filter(blocked=>blocked!==destination);
    }
    if(!r)continue;
    if(r.action==='protect')n.protectedIds=n.protectedIds.filter(target=>target!==r.targetId || n.harmProtected?.includes(target) || active.some(([,c])=>c.action==='sanctuary'&&c.targetId===target) || proposedRecords().some(other=>other.actorId!==id&&other.action==='protect'&&other.targetId===target));
    if(r.action==='silence' && playerOf(r.targetId))playerOf(r.targetId).silenced=false;
    if(r.action==='framer' && playerOf(r.targetId))playerOf(r.targetId).framedRoleId=null;
    for(const key of ['inspectTargets','seerTargets','trackTargets','watchTargets','round1InspectTargets','round1SeerTargets'])if(n[key])delete n[key][id];
  }
  const remaining=proposedEntries();
  n.reactionGuard=remaining.filter(([,c])=>c.action==='guardReaction').map(([,c])=>c.targetId);
  n.infoSecure=remaining.filter(([,c])=>c.action==='secureInformation').map(([,c])=>c.targetId);
  n.revivalWards=remaining.filter(([,c])=>c.action==='secondChance').map(([,c])=>c.targetId);
  for(const id of suppressed){
    const c=n.extraActions?.[id];if(!c)continue;
    const key=`cancel:${id}:${c.action}`;if(n.proposedProcessed[key])continue;n.proposedProcessed[key]=true;
    if(c.action==='singleWard'){const index=n.singleWards.indexOf(c.targetId);if(index>=0)n.singleWards.splice(index,1);}
    if(c.action==='reserveShield' && !remaining.some(([,choice])=>choice.action==='reserveShield'&&choice.targetId===c.targetId))delete playerOf(c.targetId).reserveShieldRound;
    if(['sanctuary','blockHarm'].includes(c.action)){
      if(c.action==='blockHarm')n.harmProtected=n.harmProtected.filter(target=>target!==c.targetId || remaining.some(([,choice])=>choice.action==='blockHarm'&&choice.targetId===target));
      n.protectedIds=n.protectedIds.filter(target=>target!==c.targetId || n.harmProtected.includes(target) || remaining.some(([,choice])=>choice.action==='sanctuary'&&choice.targetId===target) || proposedRecords().some(r=>r.action==='protect'&&r.targetId===target));
    }
  }
  n.reactionBlocked=n.reactionBlocked.filter(target=>remaining.some(([,c])=>c.action==='blockReaction'&&c.targetId===target));
  n.changeProtected=n.changeProtected.filter(target=>remaining.some(([,c])=>c.action==='preventChanges'&&c.targetId===target));
  for(const [target,escort] of Object.entries(n.escorts||{}))if(suppressed.includes(escort))delete n.escorts[target];
  n.pendingAttacks=(n.pendingAttacks||[]).filter(a=>!n.blockedIds.includes(a.attackerId)||a.sourceAction==='delayedStrike');
}
function resolveProposedEffects() {
  const n=state.night;
  for(const [id,c] of proposedEntries()){
    const key=`effect:${id}:${c.action}`;
    if(n.proposedProcessed[key])continue;n.proposedProcessed[key]=true;
    const actor=playerOf(id),target=playerOf(c.targetId),other=playerOf(c.second);
    if(c.action==='forgeReaction')n.forgedReactions[c.targetId]=c.second;
    if(c.action==='swapReports'){n.reportSwaps[c.targetId]=Number(c.second);n.reportSwaps[c.second]=c.targetId;}
    if(c.action==='falseProtection')n.falseProtection.push(c.targetId);
    if(c.action==='forgeInterference')n.forgedInterference.push(c.targetId);
    if(c.action==='plantEvidence')n.plantedEvidence.push(c.targetId);
    if(c.action==='concealVisitor')n.concealedVisits.push({actorId:c.targetId,targetId:Number(c.second)});
    if(['exchangeAbilities','exchangeReactions'].includes(c.action) && target?.alive && other?.alive && !changesPrevented(target) && !changesPrevented(other)){
      const field=c.action==='exchangeAbilities'?'nightAction':'nightReaction';
      if(field==='nightReaction' && [target,other].some(p=>n.reactionGuard.includes(p.id)))continue;
      const first=field==='nightAction'?nightActionFor(target):nightReactionFor(target),second=field==='nightAction'?nightActionFor(other):nightReactionFor(other);
      proposedOverride(target,field,second);proposedOverride(other,field,first);
    }
    if(c.action==='borrowReaction' && !changesPrevented(actor))actor.borrowedReaction={round:state.round+1,action:nightReactionFor(target)};
    if(c.action==='temporaryConversion' && !changesPrevented(target)){
      target.temporaryOrientation={round:state.round+1,value:c.second};extraNotice(target.id,`Your allegiance will become ${labelOrientation(c.second)} next night only.`);
    }
    if(c.action==='restoreIdentity' && target?.originalIdentity && !changesPrevented(target)){
      const original=target.originalIdentity;
      if(applyPermanentRoleChange(target,original.roleId,actor)){
        const restored=state.roles.find(r=>r.id===original.roleId);
        for(const field of ['orientation','nightAction','nightReaction'])proposedOverride(target,field,original.roleOverrides[field] ?? restored?.[field] ?? (field==='orientation'?'good':'none'));
      }
    }
    if(c.action==='bestowAbility' && !changesPrevented(actor) && !changesPrevented(target)){
      if(proposedOverride(target,'nightAction',n.startAbilities[id]))proposedOverride(actor,'nightAction','none');
    }
    if(c.action==='delayedStrike'){
      (target.delayedAttacks ||= []).push({actorId:actor.id,round:state.round+1});
      extraNotice(target.id,'You are marked for an attack on the following night. Protection and reactions will apply.');
    }
    if(c.action==='deadLetter')extraNotice(target.id,`Signed letter from ${actor.name}: ${c.text}`);
    if(c.action==='sealedReply')extraNotice(target.id,`${actor.name} asks: ${c.text} You may answer during the day in person; you need not tell the truth.`);
    if(c.action==='contingencyNote'){
      extraNotice(target.id,`Anonymous shared note: ${c.text}`);extraNotice(other.id,`Anonymous shared note: ${c.text}`);
    }
    if(c.action==='recognitionLink'){
      extraNotice(target.id,`You have been linked with ${other.name}. No role or allegiance is revealed.`);
      extraNotice(other.id,`You have been linked with ${target.name}. No role or allegiance is revealed.`);
    }
  }
}
function prepareProposedAttacks() {
  const n=state.night;
  const shattered=state.players.filter(p=>p.shatteredDefencesRound===state.round).map(p=>p.id);
  n.protectedIds=(n.protectedIds||[]).filter(id=>!shattered.includes(id));
  n.singleWards=(n.singleWards||[]).filter(id=>!shattered.includes(id));
  const beforeAttackPhase=state.narratorMode && !n.narratorReporting && typeof narratorPriority==='function' && narratorPriority(playerOf(n.currentActorId))<60;
  if(!beforeAttackPhase && n.dueDelayedAttacks?.length){(n.pendingAttacks ||= []).push(...n.dueDelayedAttacks);n.dueDelayedAttacks=[];}
  for(const [id,c] of proposedEntries()){
    if(!['piercingAttack','ambush'].includes(c.action)||n.proposedAttackProcessed[id])continue;
    const targetRecord=proposedRecords().find(r=>r.actorId===c.targetId);
    if(c.action==='ambush' && state.narratorMode && !n.narratorReporting && (!targetRecord || !proposedDestinations(targetRecord).length))continue;
    n.proposedAttackProcessed[id]=true;
    if(c.action==='ambush' && (!targetRecord || !proposedDestinations(targetRecord).length))continue;
    (n.pendingAttacks ||= []).push({attackerId:Number(id),targetId:c.targetId,sourceAction:c.action,piercing:c.action==='piercingAttack'});
  }
}
function proposedAttackStopped(attack) {
  const n=state.night;
  if(attack.proposedWardChecked)return false;
  attack.proposedWardChecked=true;
  if(attack.piercing)return false;
  const index=n.singleWards?.indexOf(attack.targetId) ?? -1;
  if(index<0)return false;
  n.singleWards.splice(index,1);attack.wardStopped=true;
  const recorded=n.signalAttacks?.find(a=>a.id===attack.signalAttackId);if(recorded)recorded.protected=true;
  extraNotice(attack.targetId,'A single-use shield stopped an attack against you.');return true;
}
function proposedInvestigationRole(player, viewer) {
  if(!player)return null;
  const n=state.night;
  if((viewer!=null && n.infoSecure?.includes(Number(viewer))) || isJudge(player))return roleOf(player);
  const subject=playerOf(n.reportSwaps?.[player.id]) || player;
  if(n.plantedEvidence?.includes(subject.id)){
    const start=n.signalStart?.[subject.id];
    if(start)return {...state.roles.find(r=>r.id===start.roleId),title:start.roleTitle,orientation:start.orientation,...n.reactionReportMasks?.[subject.id]};
  }
  const role=effectiveRoleOf(subject);
  return role?{...role,...n.reactionReportMasks?.[subject.id]}:role;
}
function proposedDeceived(id) {
  const n=state.night;
  return ['hiddenAllegiance','hiddenActivity','fakeActivity','reversedComparison','plantedEvidence','falseProtection','forgedInterference','scrambledWitnesses'].some(key=>n[key]?.includes(id)) || n.reactionReportMasks?.[id]!=null || n.fakeVisits?.[id]!=null || n.forgedReactions?.[id]!=null || n.reportSwaps?.[id]!=null || playerOf(id)?.framedRoleId || n.concealedVisits?.some(v=>v.actorId===id);
}
function proposedInfoResult(player) {
  const n=state.night, c=n.extraActions?.[player.id], action=c?.action || n.startAbilities?.[player.id] || nightActionFor(player);
  if(!['inspectReaction','traceAllegiance','checkProtection','findInterference','compareVisitors','examineRemains','visitorCounter','changeAwareness','blockAwareness','deceptionAlarm','firstContact','deathEcho','predictDeath'].includes(action))return '';
  ensureProposedState();
  if(n.blockedIds?.includes(player.id) && !isPassiveAbility(action))return 'Your ability was blocked.';
  if(n.jammed?.includes(player.id) && NIGHT_ACTIONS[action]?.category==='Investigative')return 'Your investigation result was jammed.';
  const target=playerOf(c?.targetId), secure=n.infoSecure?.includes(player.id), start=n.signalStart?.[c?.targetId];
  if(action==='deathEcho'){
    const allegiance=n.signalStart?.[player.id]?.orientation;
    const count=Object.values(n.signalStart||{}).filter(p=>!p.alive&&p.orientation===allegiance).length;
    return `Faction Memory: ${count} players already dead when tonight began shared your starting allegiance.`;
  }
  if(action==='predictDeath')return !target?'No valid target was selected.':start?.lastDeathRound===undefined?'No earlier death history was recorded for this player.':`${target.name} ${start.lastDeathRound===state.round-1?'died':'did not die'} during the preceding night.`;
  if(c && NIGHT_ACTIONS[c.action]?.category==='Investigative'){
    if(!target)return 'No valid target remained.';
    if(c.action==='inspectReaction')return `${target.name} has ${NIGHT_REACTIONS[!secure&&n.forgedReactions[target.id]!=null?n.forgedReactions[target.id]:nightReactionFor(target)]?.label||'no night reaction'}.`;
    if(c.action==='traceAllegiance')return `${target.name} began tonight ${labelOrientation(start?.orientation)}.`;
    if(c.action==='checkProtection')return `${target.name} ${n.protectedIds?.includes(target.id)||n.wardRecipients?.includes(target.id)||(!secure&&n.falseProtection.includes(target.id))?'received':'did not receive'} attack protection tonight.`;
    if(c.action==='findInterference')return `${target.name}: active ability ${n.blockedIds?.includes(target.id)||(!secure&&n.forgedInterference.includes(target.id))?'blocked':'not blocked'}; reaction ${n.reactionBlocked?.includes(target.id)||target.disabledReactionRound===state.round?'disabled':'not disabled'}.`;
    if(c.action==='compareVisitors'){
      const a=proposedVisitors(target.id,player.id),b=proposedVisitors(Number(c.second),player.id);
      let shared=a.some(r=>b.some(s=>s.actorId===r.actorId));
      if(!secure && (!!n.scrambledWitnesses?.includes(target.id)!==!!n.scrambledWitnesses?.includes(Number(c.second))))shared=!shared;
      return `${target.name} and ${playerOf(c.second)?.name} ${shared?'shared at least one visitor':'had no shared visitor'} tonight.`;
    }
    if(c.action==='examineRemains')return target.lastDeathAbility==null?`No pre-death ability was recorded for ${target.name}.`:`${target.name}'s ability before their most recent death was ${NIGHT_ACTIONS[target.lastDeathAbility]?.label||'None'}.`;
  }
  const visitors=proposedRecords().filter(r=>proposedDestinations(r).includes(player.id));
  if(action==='visitorCounter')return `${new Set(visitors.map(r=>r.actorId)).size} distinct players visited you tonight.`;
  if(action==='changeAwareness'){
    const fields=[...new Set((n.signalChanges||[]).filter(change=>change.playerId===player.id).map(change=>change.field))];
    return fields.length?`Changed tonight: ${fields.join(', ')}.`:'Your role, allegiance, ability and reaction did not change tonight.';
  }
  if(action==='blockAwareness')return `Your active ability was ${n.blockedIds?.includes(player.id)?'blocked':'not blocked'}; your reaction was ${n.reactionBlocked?.includes(player.id)||player.disabledReactionRound===state.round?'disabled':'not disabled'}.`;
  if(action==='deceptionAlarm')return proposedDeceived(player.id)?'A deceitful investigation effect was applied to you tonight.':'No deceitful investigation effect was applied to you tonight.';
  if(action==='firstContact' && !player.firstContactUsed && visitors.length){
    player.firstContactUsed=true;n.proposedResults[player.id]=`Your first contact was ${playerOf(randomChoice(visitors).actorId)?.name}.`;
  }
  if(action==='firstContact')return n.proposedResults[player.id]||'No new first contact tonight.';
  return '';
}
function finishProposedNight() {
  const n=state.night;
  for(const id of n.revivalWards||[]){const p=playerOf(id);if(p && !p.alive && n.signalLifeEvents?.some(e=>e.playerId===id&&!e.alive))setPlayerAlive(p,true);}
  for(const [id,c] of proposedEntries()){
    const actor=playerOf(id),target=playerOf(c.targetId);
    if(c.action==='publicNotice')n.proposedAnnouncements.push(`Anonymous notice: ${c.text}`);
    if(c.action==='passToken' && target){
      state.visibleTokens ||= [];state.visibleTokens.push({id:`${state.round}:${id}`,holderId:target.id});
    }
  }
  for(const token of state.visibleTokens||[]){
    const target=playerOf(n.tokenPlans?.[token.id]);if(target?.alive && canAbilityTarget(target))token.holderId=target.id;
    n.proposedAnnouncements.push(`Token: ${playerOf(token.holderId)?.name||'departed player'} holds a visible token. It grants no protection or allegiance information.`);
  }
  for(const p of state.players){
    if(p.temporaryOrientation?.round===state.round){
      proposedOverride(p,'orientation',p.temporaryOrientation.before); // Expiration is mandatory, even if changes are now protected.
      p.roleOverrides={...(p.roleOverrides||{}),orientation:p.temporaryOrientation.before};delete p.temporaryOrientation;
    }
    if(p.pendingExposure){n.proposedAnnouncements.push(p.pendingExposure);delete p.pendingExposure;}
  }
}

function proposedPlanningTurn(player) {
  if(!player?.alive)return null;
  const n=state.night, candidates=playersAlive().filter(p=>p.id!==player.id&&canAbilityTarget(p));
  if(nightReactionFor(player)==='decoyTrail' && !player.used?.decoyTrail && !Object.hasOwn(n.decoyTargets||{},player.id))return {type:'nightRound1',action:'proposedPlan',plan:'decoy',prompt:'Secretly nominate your Decoy Trail target before using your night ability.',options:[...candidates.map(p=>({id:String(p.id),name:p.name})),{id:'skip',name:'Do not nominate a decoy'}]};
  const token=(state.visibleTokens||[]).find(t=>t.holderId===player.id&&!Object.hasOwn(n.tokenPlans||{},t.id));
  if(token)return {type:'nightRound1',action:'proposedPlan',plan:token.id,prompt:'Pass your visible token, or keep it. This does not use your night ability.',options:[...candidates.map(p=>({id:String(p.id),name:p.name})),{id:'skip',name:'Keep the token'}]};
  return null;
}
function saveProposedPlan(player,value) {
  const turn=proposedPlanningTurn(player);
  if(!turn || !turn.options.some(o=>o.id===String(value)))throw new Error('That planning choice is unavailable.');
  if(turn.plan==='decoy')(state.night.decoyTargets ||= {})[player.id]=value==='skip'?null:Number(value);
  else (state.night.tokenPlans ||= {})[turn.plan]=value==='skip'?player.id:Number(value);
}
function renderProposedPlanning(player) {
  const turn=proposedPlanningTurn(player);if(!turn)return false;
  $('nightPrompt').textContent=turn.prompt;const area=$('nightActionArea');area.innerHTML='';
  for(const option of turn.options)area.appendChild(actionButton(option.name,option.id,()=>{saveProposedPlan(player,option.id);updateNight();}));
  return true;
}

