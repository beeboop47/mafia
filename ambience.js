// Original synthesized day birds; sourced night loop (see assets/audio/CREDITS.md).
(() => {
  const controls = document.getElementById('narratorAmbienceControls');
  const toggle = document.getElementById('narratorAmbienceToggle');
  const volume = document.getElementById('narratorAmbienceVolume');
  const label = document.getElementById('narratorAmbienceLabel');
  let context, master, nightGain, bed, timer, phase = '', muted = false;
  const activeCalls = new Set();
  const nightAudio = new Audio('assets/audio/suburban-night-loop.wav');
  nightAudio.loop = true;
  nightAudio.preload = 'auto';
  nightAudio.volume = 0;
  let dayMix = 0, nightMix = 0, fadeTimer, revision = 0;
  let nightBuffer, nightLoading, nightBed;
  const hosted = ['http:', 'https:'].includes(window.location?.protocol);
  const enable = document.getElementById('narratorAmbienceEnable');
  function stopNight() {
    if (nightBed) { nightBed.stop(); nightBed.disconnect(); nightBed = null; }
    nightAudio.pause();
  }
  function loadNight() {
    if (!nightLoading) {
      nightLoading = fetch('assets/audio/suburban-night-loop.wav').then(response => {
        if (!response.ok) throw new Error('Night recording missing');
        return response.arrayBuffer();
      }).then(bytes => context.decodeAudioData(bytes)).then(buffer => { nightBuffer = buffer; return buffer; }).catch(error => {
        nightLoading = null;
        throw error;
      });
    }
    return nightLoading;
  }

  function targetPhase() {
    return state.narratorMode && online.mode === 'offline' &&
      !document.getElementById('gameScreen').classList.contains('hidden') &&
      ['day', 'night'].includes(state.phase) ? state.phase : '';
  }
  function level() {
    return phase && !muted && !document.hidden ? Number(volume.value) / 100 * .16 : 0;
  }
  function updateVolume() {
    if (master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(level() * dayMix, context.currentTime, .04);
    }
    const nightLevel = level() / .16 * .3 * nightMix;
    if (nightGain) {
      nightGain.gain.cancelScheduledValues(context.currentTime);
      nightGain.gain.setTargetAtTime(nightLevel, context.currentTime, .04);
    } else nightAudio.volume = nightLevel;
  }
  function stop() {
    clearTimeout(timer);
    timer = null;
    if (bed) { bed.stop(); bed.disconnect(); bed = null; }
    for (const oscillator of activeCalls) { oscillator.stop(); oscillator.disconnect(); }
    activeCalls.clear();
  }
  function chirp(at, frequency, duration, night) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (night ? .92 : 1.45), at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(night ? .12 : .23, at + .015);
    envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(envelope).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + .02);
    activeCalls.add(oscillator);
    oscillator.onended = () => { activeCalls.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  }
  function calls() {
    timer = null;
    if (phase !== 'day' || muted || document.hidden || context.state !== 'running') return;
    const start = context.currentTime + .05;
    const pitch = 1600 + Math.random() * 1300;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) chirp(start + i * .22, pitch, .15, false);
    timer = setTimeout(calls, 3000 + Math.random() * 4500);
  }
  function start() {
    const current = ++revision;
    if (!phase || muted || document.hidden) {
      clearInterval(fadeTimer);
      dayMix = nightMix = 0;
      updateVolume();
      stop();
      stopNight();
      return;
    }
    if (phase === 'night') {
      if (hosted && context) {
        if (context.state !== 'running') { enable.textContent = 'Tap to enable ambience sound'; return; }
        loadNight().then(() => {
          if (current !== revision || muted || document.hidden || phase !== 'night') return;
          if (!nightBed) {
            nightBed = context.createBufferSource();
            nightBed.buffer = nightBuffer;
            nightBed.loop = true;
            nightBed.connect(nightGain);
            nightBed.start();
          }
          enable.textContent = 'Ambience sound enabled';
          crossfade('night');
        }).catch(() => { if (current === revision) enable.textContent = 'Night audio could not load · tap to retry'; });
        return;
      }
      nightAudio.play().then(() => {
        if (current === revision) crossfade('night');
        else if (phase !== 'night' || muted || document.hidden) nightAudio.pause();
      }).catch(() => {
        if (current === revision) label.textContent = 'Night ambience unavailable · tap to retry';
      });
      return;
    }
    if (!context || context.state !== 'running') return;
    if (!bed) startDayBed();
    else if (timer === null) calls();
    crossfade('day');
  }
  function crossfade(next) {
    clearInterval(fadeTimer);
    const fromDay = dayMix, fromNight = nightMix, began = performance.now();
    const tick = () => {
      const progress = Math.min(1, (performance.now() - began) / 3000);
      const eased = progress * progress * (3 - 2 * progress);
      dayMix = fromDay + ((next === 'day' ? 1 : 0) - fromDay) * eased;
      nightMix = fromNight + ((next === 'night' ? 1 : 0) - fromNight) * eased;
      updateVolume();
      if (progress === 1) {
        clearInterval(fadeTimer);
        if (next !== 'day') stop();
        if (next !== 'night') stopNight();
      }
    };
    fadeTimer = setInterval(tick, 30);
    tick();
  }
  function startDayBed() {
    const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < samples.length; i++) {
        smooth = (smooth + (Math.random() * 2 - 1) * .025) / 1.025;
        samples[i] = smooth * .5;
    }
    bed = context.createBufferSource();
    bed.buffer = buffer;
    bed.loop = true;
    bed.connect(master);
    bed.start();
    calls();
  }
  function sync() {
    const next = targetPhase();
    controls.classList.toggle('hidden', !next);
    if (next) document.body.dataset.narratorAmbience = next;
    else delete document.body.dataset.narratorAmbience;
    label.textContent = next === 'night' ? 'Night ambience · distant traffic & insects' : 'Day ambience · birds';
    if (next !== phase) { phase = next; start(); }
  }
  async function unlock() {
    sync();
    // Unlock both audio engines in the tap itself, including setup/handoff taps.
    // Mobile browsers do not carry a gesture into later timers or observers.
    if (!state.narratorMode || online.mode !== 'offline' || muted || document.hidden) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      label.textContent = 'Ambience audio is unavailable in this browser';
      return;
    }
    try {
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        // Hosted recordings use decoded buffers and gain in the same unlocked
        // context. Local file pages retain media playback for opaque origins.
        if (hosted) {
          nightGain = context.createGain();
          nightGain.gain.value = 0;
          nightGain.connect(context.destination);
        }
      }
      const resume = context.state !== 'running' ? context.resume() : Promise.resolve();
      // Call play before awaiting anything; prime the recording even during day.
      // A missing/blocked night recording must never prevent daytime playback.
      if (!hosted && nightAudio.paused) nightAudio.play().then(() => {
        if (phase !== 'night' || muted || document.hidden) nightAudio.pause();
      }).catch(() => { if (phase === 'night') enable.textContent = 'Night audio could not load · tap to retry'; });
      await resume;
      if (phase && !muted && !document.hidden) {
        if (phase === 'night' ? hosted ? !nightBed : nightMix === 0 : !bed || dayMix === 0) start();
        if (phase === 'day') enable.textContent = 'Ambience sound enabled';
      }
    } catch {
      label.textContent = 'Tap to enable ambience sound';
    }
  }
  toggle.addEventListener('click', () => {
    muted = !muted;
    toggle.textContent = muted ? 'Unmute ambience' : 'Mute ambience';
    toggle.setAttribute('aria-pressed', String(muted));
    start();
  });
  volume.addEventListener('input', updateVolume);
  enable.addEventListener('click', event => {
    event?.stopPropagation();
    muted = false;
    toggle.textContent = 'Mute ambience';
    toggle.setAttribute('aria-pressed', 'false');
    if (Number(volume.value) === 0) volume.value = '25';
    return unlock();
  });
  // Clicks and keyboard activation unlock browser audio after phase-changing actions.
  document.addEventListener('click', unlock);
  document.addEventListener('change', sync);
  document.addEventListener('visibilitychange', () => { sync(); start(); });
  window.addEventListener('pagehide', () => { phase = ''; start(); });
  window.addEventListener('pageshow', sync);
  const observer = new MutationObserver(sync);
  for (const id of ['gameScreen', 'dayCard', 'nightCard', 'winCard', 'setupScreen']) {
    observer.observe(document.getElementById(id), {attributes: true, attributeFilter: ['class']});
  }
  sync();
})();
