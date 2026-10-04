// Offline narrator: spoken wake prompts with private on-screen choices.
let narratorLastPrompt = '';
let narratorAutoTimer = null;
let narratorObserver = null;
function narratorCancelAuto() {
  if (narratorAutoTimer !== null) clearTimeout(narratorAutoTimer);
  narratorAutoTimer = null;
}
function narratorAutoButton(area) {
  if (area.querySelector('form,select,input,textarea')) return null;
  const buttons = [...area.querySelectorAll('button')];
  if (buttons.length !== 1 || buttons[0].disabled) return null;
  return buttons[0].dataset.narratorAuto === 'true' ? buttons[0] : null;
}
function narratorRefreshAuto() {
  narratorCancelAuto();
  const status = document.getElementById('narratorAutoStatus');
  if (status) status.textContent = '';
  if (!state.narratorMode || state.phase !== 'night') return;
  const area = document.getElementById('nightActionArea');
  for (const acknowledgement of area.querySelectorAll('button[data-narrator-acknowledgement="true"]')) {
    acknowledgement.hidden = acknowledgement.dataset.narratorImmediate === 'true' && !state.narratorPaused;
  }
  if (state.narratorPaused) return;
  const night = state.night, index = night.index, round = night.round;
  if (night.narratorTransition) {
    const transition = night.narratorTransition;
    if (status) status.textContent = 'Next announcement in 5 seconds…';
    narratorAutoTimer = setTimeout(() => {
      narratorAutoTimer = null;
      if (!state.narratorMode || state.narratorPaused || state.phase !== 'night' || state.night !== night || night.index !== index || night.round !== round || night.narratorTransition !== transition) return;
      night.narratorTransition = null;
      narratorAdvanceTransition(transition);
    }, 5000);
    return;
  }
  const button = narratorAutoButton(area);
  if (!button) { if (status) status.textContent = 'Waiting for the role’s choice.'; return; }
  if (button.dataset.narratorImmediate === 'true') {
    button.click();
    return;
  }
  if (button.dataset.narratorAcknowledgement === 'true') {
    const prompt=document.getElementById('nightPrompt');
    if (prompt) prompt.textContent='Take your time to read your private result, then acknowledge and continue.';
    if (status) status.textContent = 'Waiting for your acknowledgement.';
    return;
  }
  if (status) status.textContent = 'Continuing automatically in 5 seconds…';
  narratorAutoTimer = setTimeout(() => {
    narratorAutoTimer = null;
    if (!state.narratorMode || state.narratorPaused || state.phase !== 'night' || state.night !== night || night.index !== index || night.round !== round) return;
    if (!button.isConnected || narratorAutoButton(area) !== button) return;
    button.click();
  }, 5000);
}
function narratorStartAuto() {
  if (!narratorObserver) {
    narratorObserver = new MutationObserver(narratorRefreshAuto);
    narratorObserver.observe(document.getElementById('nightActionArea'), {childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
  }
  narratorRefreshAuto();
}
function narratorSpeak(text) {
  narratorLastPrompt = text;
  const label = document.getElementById('narratorCaption');
  if (label) label.textContent = text;
  if (state.narratorMuted || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.75;
  window.speechSynthesis.speak(utterance);
}
function narratorRoleName(actor) {
  const role = roleOf(actor);
  if (role?.id === 'mafia' && state.players.some(player => player.alive && !player.removed && roleOf(player)?.orientation === 'evil' && roleOf(player)?.id !== 'mafia')) return 'Ordinary Mafia';
  return role?.title || (role?.id === 'mafia' ? 'Mafia' : 'Player');
}
function narratorWakeRole(actor) {
  state.night.narratorWakeRoleName = narratorRoleName(actor);
  state.night.narratorHasWoken = true;
  narratorSpeak(`${state.night.narratorWakeRoleName}, open your eyes.`);
}
function narratorSkipBlockedTurn(actor) {
  return !state.night.narratorReporting && state.night.narratorReactionActorId == null &&
    state.night.blockedIds?.includes(actor.id) && !isPassiveAbility(nightActionFor(actor)) &&
    !findPendingAttacksFor(actor.id).length;
}
function narratorBeginTransition(kind = 'continue') {
  narratorCancelAuto();
  const night = state.night;
  night.narratorTransition = {kind};
  night.handoffReady = true;
  night.busy = false;
  // There is no clickable continuation and no next role's private information.
  for (const id of ['nightActionArea','nightResult','nightKnownRoles']) document.getElementById(id).innerHTML = '';
  document.getElementById('nightPrompt').textContent = 'Waiting for the next announcement.';
  document.getElementById('resolveNightBtn').classList.add('hidden');
  document.getElementById('resolveNightBtn').disabled = true;
  narratorRefreshAuto();
}
function narratorOpenPendingReaction() {
  const night = state.night;
  // Ordinary deaths resolve silently. Only attacks needing a choice interrupt.
  resolveNightBeforeReactions();
  const target = night.pendingAttacks.map(attack => playerOf(attack.targetId)).find(player => player?.alive);
  if (!target) return false;
  night.narratorReactionActorId = target.id;
  night.currentActorId = target.id;
  night.turnRevealed = true;
  night.handoffReady = false;
  night.busy = false;
  document.getElementById('nightTitle').textContent = 'Night';
  document.getElementById('nightProgress').textContent = 'Triggered reaction';
  narratorWakeRole(target);
  renderReactionTurn(target);
  return true;
}
function narratorAdvanceTransition(transition) {
  const night = state.night;
  night.handoffReady = false;
  if (transition.kind === 'mafiaMeeting') {
    // Recheck at execution, including a queued meeting from an older page or
    // a player eliminated/removed during the announcement delay.
    const evil = state.players.filter(player => player.alive && !player.removed && roleOf(player)?.orientation === 'evil');
    if (evil.length < 2) {
      night.narratorMeetingDone = true;
      night.narratorHasWoken = true;
      night.turnRevealed = false;
      updateNight();
      return;
    }
    document.getElementById('nightTitle').textContent = 'Mafia discussion';
    document.getElementById('nightProgress').textContent = 'All living Evil players';
    narratorSpeak('Mafia, open your eyes. Discuss your plans together. When you are ready, everyone will close their eyes and each role will take its own turn.');
    document.getElementById('nightPrompt').textContent = 'All living Evil players may coordinate. Finish the discussion when everyone is ready.';
    document.getElementById('nightActionArea').appendChild(actionButton('Finish Mafia discussion', 'mafiaDiscussion', () => {
      if (state.phase !== 'night' || state.night !== night || night.narratorMeetingDone) return;
      night.narratorMeetingDone = true;
      narratorSpeak('Mafia, close your eyes.');
      narratorBeginTransition('afterMafiaMeeting');
    }));
    narratorRefreshAuto();
    return;
  }
  if (transition.kind === 'afterMafiaMeeting') {
    night.narratorHasWoken = true;
    night.turnRevealed = false;
    updateNight();
    return;
  }
  if (transition.kind === 'wake') {
    const actor = night.queue[night.index];
    if (actor && narratorSkipBlockedTurn(actor)) {
      night.turnRevealed = false;
      updateNight();
      return;
    }
    if (actor?.alive) narratorWakeRole(actor);
    night.turnRevealed = true;
    updateNight();
    return;
  }
  // Interruptions keep the original queue position; the target's regular
  // ability remains in its own scheduled turn if they survive the attack.
  night.narratorReactionActorId = null;
  if (narratorOpenPendingReaction()) return;
  night.currentActorId = night.queue[night.index]?.id;
  advanceNightActor();
}
function narratorPriority(player) {
  const action = nightActionFor(player);
  // Protection from blocking/changes must exist before those effects resolve.
  if (['blockHarm','preventChanges'].includes(action)) return 0;
  if (action === 'roleblock') return 10;
  if (['changeRole','swapRoles','changeAllegiance','changeAbility','changeReaction','copyAbility'].includes(action)) return 20;
  if (['protect','takeAttack','blockReaction','removeSilence','framer','hideAllegiance','hideActivity','fakeActivity','fakeVisit','reverseComparison'].includes(action)) return 30;
  // Prediction, silence and messages are submitted before anybody can die.
  if (['silence','forceAnswer','sendNote','sendSignal','revealSelf','predictDeath','hater'].includes(action)) return 40;
  if (roleOf(player)?.orientation === 'evil' && action === 'teamKill') return 50;
  if (['teamKill','kill'].includes(action)) return 60;
  // Inspect bodies before a revival removes them from the dead-player list.
  if (action === 'janitor') return 70;
  if (action === 'doctor') return 80;
  return 90;
}
function narratorOrder(players, reactions = false) {
  const priority = player => reactions && (findPendingAttacksFor(player.id).length || newReactionTurn(player)) ? -1 : narratorPriority(player);
  return players.slice().sort((a,b) => priority(a)-priority(b) || a.id-b.id);
}
function narratorDeferredInfo(action) {
  return ['track','watch','audit'].includes(action);
}
function narratorActionQueue(players) {
  let mafiaAdded = false;
  const candidates = players.filter(player => !player.removed && !state.night?.narratorCompleted?.includes(player.id));
  const mafia = candidates.filter(player => roleOf(player)?.orientation === 'evil' && nightActionFor(player) === 'teamKill');
  // One blocked/dead representative must not cancel an unblocked team's turn.
  const available = mafia.filter(player => player.alive && !state.night?.blockedIds?.includes(player.id));
  const representative = available.find(player => roleHasSpecialId(roleOf(player), 'godfather')) || available[0] || mafia.find(player => player.alive) || mafia[0];
  return narratorOrder(candidates.filter(player => {
    const role = roleOf(player), action = nightActionFor(player);
    if (role?.orientation === 'evil' && action === 'teamKill') {
      if (state.night?.narratorMafiaDone || mafiaAdded || player !== representative) return false;
      mafiaAdded = true; return true;
    }
    // These passives work automatically; their information is delivered at the end.
    if (isPassiveAbility(action) && action !== 'seer') return false;
    return action !== 'none';
  }));
}
function narratorRefreshRemainingQueue() {
  const n = state.night;
  const actor = n.queue[n.index];
  n.narratorCompleted ||= [];
  if (actor && !n.narratorCompleted.includes(actor.id)) n.narratorCompleted.push(actor.id);
  if (n.narratorTurnIsMafia ?? (roleOf(actor)?.orientation === 'evil' && nightActionFor(actor) === 'teamKill')) n.narratorMafiaDone = true;
  n.narratorTurnIsMafia = null;
  const players = n.round1Players || n.queue;
  // A transformation can give an idle player an action, or change an upcoming
  // action's priority. Completed players never receive a second regular action.
  for (const player of players) {
    if (n.narratorCompleted.includes(player.id)) continue;
    n.gamblerActions ||= {};
    if (nightActionFor(player) === 'gambler') n.gamblerActions[player.id] = scheduledGamblerAbility(player);
    if (nightActionFor(player) === 'seer') {
      n.seerTargets ||= {};
      if (n.seerTargets[player.id] == null) n.seerTargets[player.id] = scheduledSeerTarget(player, playersAlive().filter(target => target.id !== player.id));
    }
    const action = nightActionFor(player), previous = n.extraActions?.[player.id];
    if (previous && isPassiveAbility(previous.action) && previous.action !== action) delete n.extraActions[player.id];
    if (player.alive && isPassiveAbility(action) && action !== 'seer' && !n.extraActions?.[player.id]) recordExtraChoice(player, action, {});
  }
  n.queue.splice(n.index + 1, n.queue.length, ...narratorActionQueue(players));
}
function narratorStartReports() {
  const n = state.night;
  if (n.narratorReporting) return false;
  n.narratorReporting = true;
  narratorResolveTurnEffects();
  for (const player of n.round1Players || state.players) {
    if (player.alive && nightActionFor(player) === 'detectAttack') {
      extraNotice(player.id, n.attackAttemptedIds?.includes(player.id) ? 'Someone attempted to attack you tonight.' : 'No one attempted to attack you tonight.');
    }
  }
  n.queue = (n.round1Players || state.players).filter(player => player.alive && !player.removed && (
    (narratorDeferredInfo(nightActionFor(player)) && !n.blockedIds?.includes(player.id) &&
      (n.trackTargets?.[player.id] != null || n.watchTargets?.[player.id] != null || n.limitedInvestigations?.[player.id])) || extraNoticesFor(player)
  ));
  n.index = 0;
  n.turnRevealed = false;
  if (!n.queue.length) return false;
  updateNight();
  return true;
}
function narratorResolveTurnEffects() {
  const n=state.night;
  delete n.extraDefensesResolved;
  resolveExtraDefenses();
  resolvePendingRoleChanges();
  const all=n.extraActions||{}, processed=n.narratorProcessedExtras||={};
  const fresh=Object.fromEntries(Object.entries(all).filter(([id,c])=>processed[id] !== JSON.stringify(c) && (c.action !== 'randomAllegiance' || n.narratorReporting)));
  if (Object.keys(fresh).length) {
    const saved={};
    for (const key of ['hiddenActivity','fakeActivity','fakeVisits','hiddenAllegiance','reversedComparison']) saved[key]=n[key];
    n.extraActions=fresh; delete n.extraEffectsResolved; resolveExtraEffects(); n.extraActions=all;
    for (const [key,value] of Object.entries(saved)) if(value) n[key]=Array.isArray(value)?[...new Set([...value,...(n[key]||[])])]:{...value,...n[key]};
    Object.entries(fresh).forEach(([id,c])=>processed[id]=JSON.stringify(c));
  }
  delete n.extraAttacksPrepared;
  prepareExtraAttacks();
  resolveNightBeforeReactions();
  resolveLimitedInvestigations();
}
function narratorReactionQueue(players) {
  return narratorOrder(players.filter(player => {
    if (!player.alive) return false;
    const action = nightActionFor(player);
    return findPendingAttacksFor(player.id).length || newReactionTurn(player) ||
      hasReactionRoundInfo(action) || extraNoticesFor(player);
  }), true);
}
function assignNarratorRoles() {
  if (typeof online !== 'undefined' && online.mode !== 'offline') {
    alert('Narrator mode supports offline pass & play.'); return false;
  }
  const roles = state.roles;
  const mafia = roles.find(r => r.id === 'mafia' && r.orientation === 'evil');
  if (!mafia) { alert('Narrator mode needs the ordinary Mafia role in the library.'); return false; }
  const fixed = state.mode === 'manual' ? state.players.filter(p => roles.some(r => r.id === p.roleId)) : [];
  const pending = state.players.filter(p => !fixed.includes(p));
  const counts = {};
  for (const player of fixed) {
    const role = roles.find(r => r.id === player.roleId);
    counts[role.id] = (counts[role.id] || 0)+1;
    if (!['mafia','citizen'].includes(role.id) && counts[role.id] > 1) {
      alert(`Narrator mode permits only one ${role.title}.`); return false;
    }
  }
  let pool = roles.filter(r => r.orientation !== 'evil' && r.randomEnabled !== false && !counts[r.id]).map(r => r.id);
  // Citizens may repeat and fill seats left after drawing the special roles.
  const citizen = roles.find(r => r.id === 'citizen' && r.orientation !== 'evil');
  if (citizen && !counts[citizen.id] && !pool.includes(citizen.id)) pool.push(citizen.id);
  const evilEnabled = roles.some(r => r.orientation === 'evil' && r.randomEnabled !== false);
  const evilLimit = Math.max(0, Math.floor((state.players.length-1)/2));
  let evilCount = fixed.filter(player => roleOf(player)?.orientation === 'evil').length;
  if (evilCount > evilLimit) { alert('Narrator mode needs fewer Mafia to avoid an immediate Evil win.'); return false; }
  if (evilEnabled) {
    const evilPool = roles.filter(role => role.orientation === 'evil' && role.id !== mafia.id && role.randomEnabled !== false && !counts[role.id]).map(role => role.id);
    if (mafia.randomEnabled !== false) for (let i=evilCount; i<evilLimit; i++) evilPool.push(mafia.id);
    pool.push(...shuffle(evilPool).slice(0, evilLimit - evilCount));
  }
  const assigned = [];
  for (const [orientation, required] of [['evil',state.requireEvil],['neutral',state.requireNeutral]]) {
    if (!required || fixed.some(p => roleOf(p)?.orientation === orientation)) continue;
    const eligible = pool.filter(id => roles.find(r => r.id === id)?.orientation === orientation);
    if (!eligible.length || assigned.length >= pending.length) { alert(`Narrator mode cannot meet the ${orientation} minimum with this pool and roster.`); return false; }
    const id = randomChoice(eligible); assigned.push(id); pool.splice(pool.indexOf(id),1);
  }
  pool = shuffle(pool);
  while (assigned.length < pending.length && pool.length) assigned.push(pool.shift());
  if (assigned.length < pending.length && !citizen) { alert('Narrator mode needs a Citizen role to fill the remaining seats, or more enabled unique Good or Neutral roles.'); return false; }
  while (assigned.length < pending.length) assigned.push(citizen.id);
  const shuffled = shuffle(assigned);
  pending.forEach((p,i) => p.roleId=shuffled[i]);
  return true;
}
