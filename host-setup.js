// Host configuration belongs to each player and is saved with the roster.
function hostSettings(player) {
  return state.mode === 'manual' ? player?.hostSetup || {} : {};
}
function hostTarget(actor, key, candidates) {
  const configured = hostSettings(actor)[key];
  return candidates.find(p => p.id === configured) || randomChoice(candidates) || null;
}
function scheduledSeerTarget(actor, candidates) {
  const id = hostSettings(actor).seerSchedule?.[state.round];
  return (candidates.find(p => p.id === id) || randomChoice(candidates))?.id ?? null;
}
function scheduledGamblerAbility(actor) {
  const pool = gamblerAbilityPool();
  const action = hostSettings(actor).gamblerSchedule?.[state.round];
  return pool.includes(action) ? action : randomChoice(pool) || 'none';
}
function removeHostReferences(id) {
  // Player IDs are seat indices, so repair references before seats are renumbered.
  for (const player of state.players) {
    const config = player.hostSetup;
    if (!config) continue;
    for (const key of ['policemanTarget', 'haterTarget']) {
      if (config[key] === id) delete config[key];
      else if (config[key] > id) config[key]--;
    }
    for (const [night, target] of Object.entries(config.seerSchedule || {})) {
      if (target === id) delete config.seerSchedule[night];
      else if (target > id) config.seerSchedule[night]--;
    }
    config.recognises = (config.recognises || []).filter(target => target !== id).map(target => target > id ? target - 1 : target);
  }
}
function renderHostSetup() {
  const panel = $('hostSetupPanel');
  panel.hidden = state.mode !== 'manual';
  const container = $('hostPlayerSettings');
  container.replaceChildren();
  const option = (select, value, label) => {
    const el = document.createElement('option'); el.value = value; el.textContent = label; select.appendChild(el);
  };
  function playerPicker(actor, value, onChange) {
    const select = document.createElement('select');
    option(select, '', 'Random');
    state.players.filter(p => p.id !== actor.id).forEach(p => option(select, p.id, p.name));
    select.value = value ?? '';
    select.addEventListener('change', () => onChange(select.value === '' ? undefined : Number(select.value)));
    return select;
  }
  for (const player of state.players) {
    const config = player.hostSetup ||= {};
    const details = document.createElement('details'); details.className = 'advanced-panel';
    const summary = document.createElement('summary'); summary.textContent = player.name; details.appendChild(summary);
    const body = document.createElement('div'); body.className = 'advanced-body'; details.appendChild(body);
    for (const [key, title] of [['policemanTarget', 'Policeman intelligence target'], ['haterTarget', 'Hater target']]) {
      const label = document.createElement('label'); label.textContent = title;
      label.appendChild(playerPicker(player, config[key], value => { if (value === undefined) delete config[key]; else config[key] = value; }));
      body.appendChild(label);
    }
    for (const [key, title] of [['seerSchedule', 'Seer targets by night'], ['gamblerSchedule', 'Gambler abilities by night']]) {
      const heading = document.createElement('h4'); heading.textContent = title; body.appendChild(heading);
      const rows = document.createElement('div'); body.appendChild(rows);
      const schedule = config[key] ||= {};
      function addRow(night) {
        const row = document.createElement('div'); row.className = 'grid2'; row.style.marginBottom = '8px';
        const label = document.createElement('label'); label.textContent = `Night ${night}`;
        const update = value => { if (value === undefined) delete schedule[night]; else schedule[night] = value; };
        let select;
        if (key === 'seerSchedule') select = playerPicker(player, schedule[night], update);
        else {
          select = document.createElement('select'); option(select, '', 'Random');
          gamblerAbilityPool().forEach(action => option(select, action, NIGHT_ACTIONS[action]?.label || action));
          select.value = schedule[night] || '';
          select.addEventListener('change', () => update(select.value || undefined));
        }
        label.appendChild(select); row.appendChild(label);
        const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'ghost'; clear.textContent = 'Reset to random';
        clear.onclick = () => { delete schedule[night]; select.value = ''; }; row.appendChild(clear); rows.appendChild(row);
      }
      let lastNight = Math.max(1, ...Object.keys(schedule).map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= 1000));
      for (let night = 1; night <= lastNight; night++) addRow(night);
      const add = document.createElement('button'); add.type = 'button'; add.className = 'ghost'; add.textContent = 'Add night'; add.onclick = () => addRow(++lastNight); body.appendChild(add);
    }
    container.appendChild(details);
  }
  const from = $('recognitionFrom'), to = $('recognitionTo');
  from.replaceChildren(); to.replaceChildren();
  state.players.forEach(p => { option(from, p.id, p.name); option(to, p.id, p.name); });
  if (state.players.length > 1) to.value = state.players[1].id;
  const list = $('recognitionList'); list.replaceChildren();
  for (const viewer of state.players) for (const id of viewer.hostSetup?.recognises || []) {
    const target = playerOf(id); if (!target || target.id === viewer.id) continue;
    const row = document.createElement('div'); row.className = 'preset-actions';
    const text = document.createElement('span'); text.textContent = `${viewer.name} recognises ${target.name}`; row.appendChild(text);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'ghost'; remove.textContent = 'Remove';
    remove.onclick = () => { viewer.hostSetup.recognises = viewer.hostSetup.recognises.filter(value => value !== id); renderHostSetup(); };
    row.appendChild(remove); list.appendChild(row);
  }
}
function addHostRecognition() {
  const viewer = playerOf(Number($('recognitionFrom').value)), target = playerOf(Number($('recognitionTo').value));
  if (!viewer || !target || viewer.id === target.id) return;
  function link(a, b) {
    const config = a.hostSetup ||= {}; config.recognises ||= [];
    if (!config.recognises.includes(b.id)) config.recognises.push(b.id);
  }
  link(viewer, target);
  if ($('recognitionDirection').value === 'mutual') link(target, viewer);
  renderHostSetup();
}
