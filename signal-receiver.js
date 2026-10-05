// Signals use true roles and the night's event history, never investigation reports.
const SIGNAL_HINT_FAMILIES = Object.freeze([
  'allegianceCounts', 'allegiances', 'roles', 'capabilities', 'activity',
  'visits', 'targets', 'attacks', 'survival', 'blocking', 'deception',
  'changes', 'deaths', 'comparisons', 'groups', 'seating', 'statistics',
  'connections', 'communications', 'personal'
]);

function initializeSignalNight() {
  const n = state.night;
  n.signalStart = Object.fromEntries(state.players.filter(p => !p.removed).map(p => {
    const role = roleOf(p);
    return [p.id, {alive: !!p.alive, roleId: role?.id, roleTitle: role?.title,
      orientation: role?.orientation, ability: nightActionFor(p), reaction: roleNightReaction(role)}];
  }));
  n.signalSubmitted = {};
  n.signalAttacks = [];
  n.signalLifeEvents = [];
  n.signalChanges = [];
  n.signalSurvivals = [];
  n.signalHints = {};
  n.signalAttackSequence = 0;
}

function recordSignalAttack(attack) {
  const n = state.night;
  n.signalAttacks ||= [];
  if (attack.signalAttackId == null) attack.signalAttackId = (n.signalAttackSequence = (n.signalAttackSequence || 0) + 1);
  let record = n.signalAttacks.find(a => a.id === attack.signalAttackId);
  if (!record) {
    record = {id: attack.signalAttackId, actorId: attack.attackerId,
      originalTargetId: attack.redirectedFrom ?? attack.targetId, targetId: attack.targetId,
      action: attack.sourceAction};
    n.signalAttacks.push(record);
  }
  record.targetId = attack.targetId;
  record.redirected = record.originalTargetId !== attack.targetId;
  if (n.protectedIds?.includes(attack.targetId)) record.protected = true;
}

function recordSignalChange(player, field, before, after) {
  if (state.phase !== 'night' || before === after) return;
  (state.night.signalChanges ||= []).push({playerId: player.id, field, before, after});
}

function signalHintPool(receiver) {
  const n = state.night;
  const pool = Object.fromEntries(SIGNAL_HINT_FAMILIES.map(f => [f, []]));
  const add = (family, message, strong = false) => pool[family].push({message, strong});
  const all = state.players.filter(p => !p.removed && n.signalStart?.[p.id]);
  const living = all.filter(p => p.alive);
  const subjects = all.filter(p => p.id !== receiver.id && canAbilityTarget(p));
  const livingSubjects = subjects.filter(p => p.alive);
  const actual = p => roleOf(p);
  const alignment = p => actual(p)?.orientation;
  const start = p => n.signalStart?.[p.id] || {};
  const abilityName = action => NIGHT_ACTIONS[action]?.label || (action === 'none' ? 'no night ability' : action);
  const category = action => NIGHT_ACTIONS[action]?.category;
  const blocked = id => n.blockedIds?.includes(Number(id));
  // An action record confirms use/visits, not success. Blocked submissions remain separate.
  const records = Object.values(n.actionRecords || {}).filter(r => r.action && r.action !== 'none' &&
    !isPassiveAbility(r.action) && !blocked(r.actorId) && playerOf(r.actorId) &&
    (r.targetId == null || canAbilityTarget(playerOf(r.targetId))) &&
    (!r.targetIds || r.targetIds.every(id => canAbilityTarget(playerOf(id)))));
  const recordFor = p => records.find(r => r.actorId === p.id);
  const destinations = r => [...new Set((r.targetIds || (r.targetId == null ? [] : [r.targetId])).map(Number))];
  const visitors = p => records.filter(r => destinations(r).includes(p.id));
  const attacks = (n.signalAttacks || []).filter(a => canAbilityTarget(playerOf(a.targetId)));
  const attacked = p => attacks.some(a => a.targetId === p.id || a.originalTargetId === p.id);
  const lifeEvents = n.signalLifeEvents || [];
  const died = p => lifeEvents.some(e => e.playerId === p.id && !e.alive);
  const revived = p => lifeEvents.some(e => e.playerId === p.id && e.alive);
  const changes = n.signalChanges || [];
  const changed = (p, field) => changes.some(c => c.playerId === p.id && (!field || c.field === field));
  const submitted = {...(n.signalSubmitted || {}), ...(n.round1Actions || {})};
  const labels = ['good', 'neutral', 'evil'];
  const trueLabel = orientation => labelOrientation(orientation);
  const activeExtras = Object.entries(n.extraActions || {}).filter(([id, c]) =>
    !blocked(id) && extraTargetsAvailable(c));

  for (const orientation of labels) {
    const count = living.filter(p => alignment(p) === orientation).length;
    const deaths = all.filter(p => died(p) && alignment(p) === orientation).length;
    add('allegianceCounts', `There are exactly ${count} living ${trueLabel(orientation)} players when this signal was received.`);
    if (count) add('allegianceCounts', `At least ${count} living players are ${trueLabel(orientation)}.`);
    add('allegianceCounts', `${deaths} ${trueLabel(orientation)} players died during tonight, including any who were revived.`);
    for (const other of labels.filter(o => o !== orientation)) {
      const otherCount = living.filter(p => alignment(p) === other).length;
      if (count > otherCount) add('allegianceCounts', `There are more living ${trueLabel(orientation)} players than ${trueLabel(other)} players when this signal was received.`);
    }
  }

  for (const p of subjects) {
    const role = actual(p), initial = start(p), action = nightActionFor(p);
    if (!role) continue;
    add('allegiances', `${p.name} is ${trueLabel(role.orientation)} when this signal was received.`, true);
    for (const other of labels.filter(o => o !== role.orientation)) {
      add('allegiances', `${p.name} is not ${trueLabel(other)} when this signal was received.`);
      add('allegiances', `${p.name} is either ${labels.filter(o => o !== other).map(trueLabel).join(' or ')} when this signal was received.`);
    }
    if (initial.orientation) add('allegiances', `${p.name} was ${trueLabel(initial.orientation)} at the start of tonight.`, true);
    add('roles', `${p.name} is ${role.title} when this signal was received.`, true);
    for (const other of state.roles.filter(r => r.id !== role.id)) {
      add('roles', `${p.name} is not ${other.title} when this signal was received.`);
      add('roles', `${p.name} is either ${role.title} or ${other.title} when this signal was received.`);
    }
    add('capabilities', `${p.name}'s current night ability is ${abilityName(action)}.`, true);
    if (category(action)) add('capabilities', `${p.name} currently has a ${category(action)} night ability.`);
    if (['kill', 'teamKill'].includes(action)) add('capabilities', `${p.name} currently has a killing ability.`);
    if (action === 'none') add('capabilities', `${p.name} currently has no night ability.`);
    const reaction = roleNightReaction(role);
    add('capabilities', reaction === 'none' ? `${p.name} currently has no night reaction.` : `${p.name}'s current reaction is ${NIGHT_REACTIONS[reaction]?.label || reaction}.`);
    if (p.used?.doctor) add('capabilities', `${p.name} has already spent their Doctor revival.`);
    if (p.used?.surviveOnce) add('capabilities', `${p.name} has already spent Survive Once.`);
    if (p.used?.scapegoat) add('capabilities', `${p.name} has already spent their attack redirection.`);

    const record = recordFor(p);
    add('activity', record ? `${p.name} made a recorded active ability use tonight.` : `${p.name} made no recorded active ability use tonight; passive abilities do not count.`);
    if (record) {
      add('activity', `${p.name} used ${abilityName(record.action)} tonight. This does not guarantee that its effect succeeded.`, true);
      if (category(record.action)) add('activity', `${p.name} used a ${category(record.action)} ability tonight.`);
    }
    if (blocked(p.id)) {
      add('blocking', `${p.name} was successfully roleblocked tonight.`);
      if (submitted[p.id]?.action && submitted[p.id].action !== 'none' && !isPassiveAbility(submitted[p.id].action))
        add('blocking', `${p.name} submitted ${abilityName(submitted[p.id].action)}, but was roleblocked tonight.`);
    }
    if (submitted[p.id]?.action === 'none') add('activity', `${p.name} submitted no active ability tonight.`);
    const visits = record ? destinations(record) : [];
    add('visits', `${p.name} made ${visits.length} recorded visits tonight; passive abilities do not count.`);
    for (const id of visits) {
      const target = playerOf(id);
      if (!target) continue;
      add('visits', `${p.name} visited ${target.name} tonight.`, true);
      add('visits', `${p.name} visited someone who is ${trueLabel(alignment(target))} when this signal was received.`);
      if (id === p.id) add('visits', `${p.name} visited themselves tonight.`);
    }
    const arrivals = visitors(p);
    add('targets', `${arrivals.length} different players made recorded visits to ${p.name} tonight.`);
    if (!arrivals.length) add('targets', `Nobody made a recorded visit to ${p.name} tonight.`);
    for (const r of arrivals) {
      add('targets', `${p.name} was targeted by ${abilityName(r.action)} tonight. This describes the action, not its success.`);
      const actor = playerOf(r.actorId);
      add('targets', `A player who is ${trueLabel(alignment(actor))} when this signal was received visited ${p.name} tonight.`);
    }
    const types = [...new Set(arrivals.map(r => category(r.action)).filter(Boolean))];
    if (types.length > 1) add('targets', `${p.name} received visits from ${types.length} different ability categories tonight.`);
    for (const type of ['Investigative', 'Deceitful', 'Offensive', 'Defensive', 'Transformative'])
      if (!types.includes(type)) add('targets', `No recorded ${type} action targeted ${p.name} tonight.`);
    if (p.silenced) add('targets', `${p.name} is silenced for the coming day.`);

    if (attacked(p)) add('attacks', `${p.name} was targeted by at least one real attack tonight.`);
    if (attacked(p) && p.alive) add('survival', `${p.name} was attacked tonight and is alive when this signal was received.`);
    if (n.protectedIds?.includes(p.id)) {
      add('survival', `${p.name} was protected from attacks tonight.`);
      if (!attacked(p)) add('survival', `${p.name} was protected, but no real attack targeted them tonight.`);
    }
    if (attacks.some(a => a.targetId === p.id && a.protected)) add('survival', `Protection stopped an attack against ${p.name} tonight.`);
    if (n.signalSurvivals?.includes(p.id)) add('survival', `${p.name} consumed Survive Once to survive an attack tonight.`);
    if (n.reactionBlocked?.includes(p.id)) add('blocking', `${p.name}'s night reaction was disabled tonight.`);
    if (n.changeProtected?.includes(p.id)) add('blocking', `${p.name} received protection against changes tonight.`);
    if (p.framedRoleId) add('deception', `${p.name} was framed to appear as a different role tonight.`);
    const deceptive = [
      ['hiddenAllegiance', 'Their allegiance was hidden from ordinary investigations'],
      ['hiddenActivity', 'Their activity was hidden from ordinary investigations'],
      ['fakeActivity', 'Fake activity was created for ordinary investigations'],
      ['reversedComparison', 'Ordinary comparisons involving them were reversed']
    ];
    for (const [key, text] of deceptive) if (n[key]?.includes(p.id)) add('deception', `${p.name}: ${text} tonight. Your signal still uses the truth.`);
    if (n.fakeVisits?.[p.id] != null) add('deception', `A false visit was created for ${p.name} tonight. Your signal ignores it.`);

    for (const [field, description, current] of [
      ['role', 'role', role.title], ['orientation', 'allegiance', trueLabel(role.orientation)],
      ['ability', 'night ability', abilityName(action)], ['reaction', 'night reaction', NIGHT_REACTIONS[reaction]?.label || 'None']
    ]) {
      const old = field === 'role' ? initial.roleId : initial[field];
      const value = field === 'role' ? role.id : field === 'orientation' ? role.orientation : field === 'ability' ? action : reaction;
      if (changed(p, field) || old !== value) {
        add('changes', `${p.name}'s ${description} changed tonight.`);
        add('changes', `${p.name}'s ${description} changed tonight and is now ${current}.`, true);
      } else add('changes', `${p.name}'s ${description} did not change tonight.`);
    }
    if (p.copiedAbility?.round === state.round + 1) add('changes', `${p.name} copied ${abilityName(p.copiedAbility.action)} for the next night.`);
    if (died(p)) add('deaths', `${p.name} died during tonight${revived(p) ? ' and was revived' : ''}.`);
    if (revived(p)) add('deaths', `${p.name} was revived tonight.`);
    if (revived(p)) add('deaths', `Someone revived tonight is ${trueLabel(alignment(p))} when this signal was received.`);
    if (died(p) && !record) add('deaths', `${p.name} died tonight without making a recorded active ability use.`);
  }

  for (const role of state.roles) {
    const count = living.filter(p => actual(p)?.id === role.id).length;
    add('roles', `There are ${count} living players with the role ${role.title} when this signal was received.`, count > 0);
    if (count) add('roles', `At least one living player is ${role.title}.`, true);
    else add('roles', `No living player is ${role.title}.`);
    if (all.some(p => died(p) && actual(p)?.id === role.id)) add('deaths', `Someone who died tonight has the role ${role.title} when this signal was received.`, true);
  }

  for (let i = 0; i < livingSubjects.length; i++) for (const q of livingSubjects.slice(i + 1)) {
    const p = livingSubjects[i], pair = `${p.name} and ${q.name}`;
    add('comparisons', `${pair} have ${alignment(p) === alignment(q) ? 'the same allegiance' : 'different allegiances'} when this signal was received.`);
    add('comparisons', `${pair} have ${actual(p)?.id === actual(q)?.id ? 'the same role' : 'different roles'} when this signal was received.`);
    add('comparisons', `${pair} have ${nightActionFor(p) === nightActionFor(q) ? 'the same night ability' : 'different night abilities'} when this signal was received.`);
    for (const orientation of labels) {
      const count = [p, q].filter(t => alignment(t) === orientation).length;
      if (count === 1) add('comparisons', `Exactly one of ${pair} is ${trueLabel(orientation)} when this signal was received.`);
      if (count === 0) add('comparisons', `Neither ${p.name} nor ${q.name} is ${trueLabel(orientation)} when this signal was received.`);
    }
    if (recordFor(p) && recordFor(q)) add('comparisons', `Both ${p.name} and ${q.name} made recorded active ability uses tonight.`);
    if (visitors(p).length && visitors(q).length) add('comparisons', `Both ${p.name} and ${q.name} received recorded visits tonight.`);
    const pVisits = recordFor(p) ? destinations(recordFor(p)) : [], qVisits = recordFor(q) ? destinations(recordFor(q)) : [];
    if (pVisits.some(id => qVisits.includes(id))) add('connections', `${pair} visited the same player tonight.`);
    if (pVisits.includes(q.id) && qVisits.includes(p.id)) add('connections', `${pair} visited each other tonight.`);
  }

  // Consecutive overlapping groups keep the pool bounded even in large rooms.
  if (livingSubjects.length >= 3) for (let i = 0; i < livingSubjects.length; i++) {
    const group = [0, 1, 2].map(offset => livingSubjects[(i + offset) % livingSubjects.length]);
    const names = group.map(p => p.name).join(', ');
    for (const orientation of labels) {
      const count = group.filter(p => alignment(p) === orientation).length;
      add('groups', `Exactly ${count} of these players are ${trueLabel(orientation)} when this signal was received: ${names}.`);
      if (count) add('groups', `At least one of these players is ${trueLabel(orientation)} when this signal was received: ${names}.`);
    }
    add('groups', `Exactly ${group.filter(recordFor).length} of these players made recorded active ability uses tonight: ${names}.`);
    for (const p of group) add('groups', `A living ${actual(p)?.title} is among these players: ${names}.`, true);
    if (group.some(p => changed(p, 'orientation'))) add('groups', `Someone in this group changed allegiance tonight: ${names}.`);
    if (attacks.some(a => group.some(p => p.id === a.actorId) && group.some(p => p.id === a.targetId)))
      add('groups', `Someone in this group attacked another member tonight: ${names}.`);
  }

  for (const p of livingSubjects) {
    const index = living.findIndex(t => t.id === p.id);
    const neighbours = [...new Set([living[(index - 1 + living.length) % living.length], living[(index + 1) % living.length]])].filter(t => t && t.id !== p.id);
    for (const orientation of labels) {
      const count = neighbours.filter(t => alignment(t) === orientation).length;
      add('seating', `In living roster order when this signal was received, ${p.name} has ${count} ${trueLabel(orientation)} neighbours.`);
    }
    if (neighbours.length === 2) add('seating', `In living roster order when this signal was received, ${p.name}'s neighbours have ${alignment(neighbours[0]) === alignment(neighbours[1]) ? 'the same allegiance' : 'different allegiances'}.`);
    if (neighbours.some(t => visitors(p).some(r => r.actorId === t.id))) add('seating', `A living neighbour of ${p.name} visited them tonight, using roster order when this signal was received.`);
  }

  add('attacks', `${attacks.length} real attacks were attempted tonight.`);
  if (attacks.some(a => a.action === 'teamKill' && alignment(playerOf(a.actorId)) === 'evil')) add('attacks', `The Evil team attempted a shared kill tonight.`);
  if (attacks.some(a => a.redirected)) add('survival', `At least one attack was redirected tonight.`);
  if (attacks.some(a => a.protected)) add('survival', `Protection stopped at least one attack tonight.`);
  for (const a of attacks) {
    const actor = playerOf(a.actorId), target = playerOf(a.targetId);
    if (!actor || !target || !canAbilityTarget(actor)) continue;
    if (actor.id !== receiver.id && target.id !== receiver.id) add('attacks', `${actor.name} attempted an attack against ${target.name} tonight.`, true);
    add('attacks', `A player who is ${trueLabel(alignment(actor))} when this signal was received attempted an attack tonight.`);
    add('attacks', `An attack targeted someone who is ${trueLabel(alignment(target))} when this signal was received.`);
    if (a.redirected) add('survival', `An attack originally aimed at ${playerOf(a.originalTargetId)?.name} was redirected to ${target.name} tonight.`);
    if (died(actor)) add('connections', `Someone attempted an attack and died during tonight.`);
    if (blocked(target.id)) add('connections', `An attack targeted a roleblocked player tonight.`);
    if (revived(target)) add('connections', `Someone attacked tonight was later revived.`);
  }
  if (attacks.some((a, i) => attacks.slice(i + 1).some(b => a.originalTargetId === b.originalTargetId))) add('attacks', `At least two attacks targeted the same player tonight.`);

  const counts = {};
  for (const type of ['Investigative', 'Deceitful', 'Transformative', 'Offensive', 'Defensive', 'Miscellaneous']) {
    counts[type] = records.filter(r => category(r.action) === type).length;
    add('statistics', `${counts[type]} recorded active ${type} abilities were used tonight; this does not guarantee successful effects.`);
  }
  for (const first of Object.keys(counts)) for (const second of Object.keys(counts))
    if (counts[first] > counts[second]) add('statistics', `More active ${first} abilities than active ${second} abilities were recorded tonight.`);
  add('statistics', `${records.length} players made recorded active ability uses tonight.`);
  add('statistics', `${new Set(records.flatMap(destinations)).size} different players received recorded visits tonight.`);
  add('blocking', `${new Set(n.blockedIds || []).size} players were successfully roleblocked tonight.`);
  add('deaths', `${all.filter(died).length} players died during tonight.`);
  add('deaths', `${all.filter(revived).length} players were revived tonight.`);
  add('deaths', `${all.filter(p => start(p).alive && !p.alive).length} players who began tonight alive remain dead when this signal was received.`);
  const duplicateRole = living.some((p, i) => living.slice(i + 1).some(q => actual(p)?.id === actual(q)?.id));
  if (duplicateRole) add('roles', `At least two living players share the same role when this signal was received.`);
  if (!changes.length && all.every(p => start(p).roleId === actual(p)?.id)) add('changes', `No player's role changed tonight.`);
  if (records.some(r => destinations(r).includes(r.actorId))) add('statistics', `Someone made a recorded visit to themselves tonight.`);

  for (const r of records) {
    const actor = playerOf(r.actorId);
    if (!actor) continue;
    if (category(r.action)) add('activity', `A player who is ${trueLabel(alignment(actor))} when this signal was received used a ${category(r.action)} ability tonight.`);
    for (const id of destinations(r)) {
      const target = playerOf(id), targetAction = recordFor(target);
      if (!target) continue;
      if (category(r.action) === 'Investigative' && attacks.some(a => a.actorId === id)) add('connections', `An investigator visited someone who attempted an attack tonight.`);
      if (r.action === 'protect' && targetAction && category(targetAction.action) === 'Deceitful') add('connections', `Someone protected a player who used deception tonight.`);
      if (r.action === 'protect' && attacks.some(a => a.actorId === id && a.targetId === actor.id)) add('connections', `Someone protected their own attacker tonight.`);
      if (revived(target)) add('connections', `Someone visited a player who was revived tonight.`);
    }
  }
  const deceptionTargets = new Set([
    ...(n.hiddenAllegiance || []), ...(n.hiddenActivity || []), ...(n.fakeActivity || []),
    ...(n.reversedComparison || []), ...Object.keys(n.fakeVisits || {}).map(Number),
    ...all.filter(p => p.framedRoleId).map(p => p.id)
  ]);
  add('deception', `${deceptionTargets.size} players had deceitful investigation effects applied tonight.`);
  for (const [id, c] of activeExtras) {
    const actor = playerOf(id), target = playerOf(c.targetId);
    if (!actor || !target) continue;
    if (['sendNote', 'sendSignal', 'revealSelf'].includes(c.action)) {
      const sent = {sendNote:'an anonymous note', sendSignal:'a signal', revealSelf:'a private true-role reveal'}[c.action];
      if (actor.id !== receiver.id && canAbilityTarget(actor)) add('communications', `${actor.name} sent ${sent} tonight.`);
      if (target.id !== receiver.id) add('communications', `${target.name} received ${sent} tonight.`);
      add('communications', `A player who is ${trueLabel(alignment(target))} when this signal was received received ${sent} tonight.`);
    }
    if (c.action === 'predictDeath') add('communications', `Someone's death prediction tonight was ${target.alive ? 'incorrect' : 'correct'}.`);
    if (category(c.action) === 'Deceitful' && alignment(actor) === 'evil' && alignment(target) === 'evil') add('deception', `An Evil player applied deception to another player who is Evil when this signal was received.`);
  }
  for (const p of subjects) {
    if (p.haterTargetId != null && canAbilityTarget(playerOf(p.haterTargetId))) add('communications', `${playerOf(p.haterTargetId).name} is ${p.name}'s Hater target.`, true);
    if (p.policemanIntel?.targetId != null && canAbilityTarget(playerOf(p.policemanIntel.targetId))) add('communications', `${playerOf(p.policemanIntel.targetId).name} is a Policeman's permanent intelligence target.`, true);
  }

  if (canAbilityTarget(receiver)) {
    const arrivals = visitors(receiver);
    add('personal', `${arrivals.length} players made recorded visits to you tonight.`);
    if (!arrivals.length) add('personal', `Nobody made a recorded visit to you tonight.`);
    for (const r of arrivals) {
      add('personal', `A player who is ${trueLabel(alignment(playerOf(r.actorId)))} when this signal was received visited you tonight.`);
      add('personal', `You were targeted by ${abilityName(r.action)} tonight.`);
    }
    if (attacked(receiver)) add('personal', `Someone attempted to attack you tonight.`);
    if (n.protectedIds?.includes(receiver.id)) add('personal', `You were protected from attacks tonight.`);
    if (deceptionTargets.has(receiver.id)) add('personal', `Someone applied a deceitful investigation effect to you tonight.`);
    for (const p of livingSubjects) add('personal', `You and ${p.name} have ${alignment(receiver) === alignment(p) ? 'the same allegiance' : 'different allegiances'} when this signal was received.`);
  }
  for (const family of SIGNAL_HINT_FAMILIES) {
    const seen = new Set();
    pool[family] = pool[family].filter(h => !seen.has(h.message) && seen.add(h.message));
  }
  return pool;
}

function chooseSignalHint(receiver) {
  const pool = signalHintPool(receiver);
  const history = receiver.signalHintHistory || [];
  let families = SIGNAL_HINT_FAMILIES.map(family => ({family, hints: pool[family].filter(h => !history.includes(h.message))})).filter(f => f.hints.length);
  if (!families.length) families = SIGNAL_HINT_FAMILIES.map(family => ({family, hints: pool[family]})).filter(f => f.hints.length);
  if (!families.length) return {family:'statistics', message:'No other round information is available.'};
  const selected = randomChoice(families);
  // Exact identities and attackers have fewer tickets within their family.
  const tickets = selected.hints.flatMap(h => Array(h.strong ? 1 : 4).fill(h));
  const hint = randomChoice(tickets);
  return {family: selected.family, message: hint.message};
}

function deliverSignalHints(receiver = null) {
  const n = state.night;
  n.signalHints ||= {};
  for (const p of state.players) {
    if (receiver && p.id !== receiver.id) continue;
    if (!p.alive || p.removed || isJudge(p) || nightActionFor(p) !== 'signalReceiver' || n.signalHints[p.id]) continue;
    const hint = chooseSignalHint(p);
    n.signalHints[p.id] = {...hint, round: state.round};
    p.signalHintHistory = [...(p.signalHintHistory || []), hint.message].slice(-50);
  }
}

function signalHintFor(player) {
  deliverSignalHints(player);
  const hint = state.night.signalHints?.[player.id];
  return hint ? `Signal Receiver — night ${hint.round}: ${hint.message}` : 'No signal is available tonight.';
}

function signalReactionOrder(players) {
  return [...players.filter(p => nightActionFor(p) !== 'signalReceiver'),
    ...players.filter(p => nightActionFor(p) === 'signalReceiver')];
}
