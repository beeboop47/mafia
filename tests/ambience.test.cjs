const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup(AudioContext, hosted = false) {
  const elements = new Map();
  const events = {};
  let sync;
  let clock = 0;
  const intervals = new Map();
  let intervalId = 0;
  const recordings = [];
  class Audio {
    constructor(src) { this.src = src; this.paused = true; recordings.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const element = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {value: '25', textContent: '',
        classList: {contains: name => classes.has(name), toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)},
        addEventListener: (name, fn) => { events[`${id}:${name}`] = fn; }, setAttribute() {}});
    }
    return elements.get(id);
  };
  const context = {state: {narratorMode: false, phase: 'day'}, online: {mode: 'offline'},
    document: {body: {dataset: {}}, hidden: false, getElementById: element,
      addEventListener: (name, fn) => { events[name] = fn; }},
    window: {location: {protocol: hosted ? 'https:' : 'file:'}, AudioContext, addEventListener: (name, fn) => { events[name] = fn; }},
    MutationObserver: class {constructor(fn) { sync = fn; } observe() {}},
    Audio, fetch: async () => ({ok: true, arrayBuffer: async () => new ArrayBuffer(4)}), performance: {now: () => clock},
    setInterval(fn) { intervals.set(++intervalId, fn); return intervalId; },
    clearInterval(id) { intervals.delete(id); },
    clearTimeout() {}, setTimeout() {}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ambience.js'), 'utf8'), context);
  return {context, element, events, sync, recordings, advance(ms) { clock += ms; for (const fn of [...intervals.values()]) fn(); }};
}

test('ambience follows only offline narrator day/night and clears on exit', () => {
  const {context: c, element, sync} = setup();
  assert.equal(c.document.body.dataset.narratorAmbience, undefined);
  assert.ok(element('narratorAmbienceControls').classList.contains('hidden'));
  c.state.narratorMode = true;
  sync();
  assert.equal(c.document.body.dataset.narratorAmbience, 'day');
  c.state.phase = 'night'; sync();
  assert.equal(c.document.body.dataset.narratorAmbience, 'night');
  for (const phase of ['setup', 'handoff', 'gameover']) {
    c.state.phase = phase; sync();
    assert.equal(c.document.body.dataset.narratorAmbience, undefined);
  }
  c.state.phase = 'day'; c.online.mode = 'host'; sync();
  assert.equal(c.document.body.dataset.narratorAmbience, undefined);
  c.online.mode = 'offline'; element('gameScreen').classList.toggle('hidden', true); sync();
  assert.equal(c.document.body.dataset.narratorAmbience, undefined);
});

test('sourced night loop crossfades with the original day sound in both directions', async () => {
  const sources = [], birds = [];
  const param = {setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {}};
  function node() {
    return {gain: param, frequency: param, connect() { return this; }, disconnect() {},
      start() {}, stop() { this.stopped = true; }};
  }
  class AudioContext {
    constructor() { this.state = 'running'; this.sampleRate = 24000; this.currentTime = 0; }
    createGain() { return node(); }
    createOscillator() { const result = node(); birds.push(result); return result; }
    createBuffer(channels, length) { const samples = new Float32Array(length); return {getChannelData: () => samples}; }
    createBufferSource() { const result = node(); sources.push(result); return result; }
  }
  const {context: c, events, sync, recordings, advance} = setup(AudioContext);
  c.state.narratorMode = true;
  await events.click();
  const daytime = sources[0];
  assert.ok(birds.length >= 2);
  advance(3000);
  c.state.phase = 'night'; sync();
  await Promise.resolve();
  const night = recordings[0];
  assert.equal(night.src, 'assets/audio/suburban-night-loop.wav');
  assert.equal(night.loop, true);
  assert.equal(night.paused, false);
  assert.equal(daytime.stopped, undefined, 'day continues during the crossfade');
  advance(1500);
  assert.ok(night.volume > 0 && night.volume < .25 * .3);
  advance(1500);
  assert.equal(daytime.stopped, true);
  assert.ok(birds.every(bird => bird.stopped));
  assert.equal(sources.length, 1, 'night is a recording, not another synthesized buffer');
  c.state.phase = 'day'; sync();
  assert.equal(night.paused, false, 'night continues during the return crossfade');
  advance(3000);
  assert.equal(night.paused, true);
  assert.equal(sources.length, 2);
  c.document.hidden = true; events.visibilitychange();
  assert.equal(sources[1].stopped, true);
});

test('sound controls and unsupported audio remain usable without changing narrator mute', async () => {
  const {context: c, element, events, sync} = setup();
  c.state.narratorMode = true; c.state.narratorMuted = false; sync();
  events['narratorAmbienceToggle:click']();
  assert.equal(element('narratorAmbienceToggle').textContent, 'Unmute ambience');
  assert.equal(c.state.narratorMuted, false);
  events['narratorAmbienceToggle:click']();
  await events.click();
  assert.match(element('narratorAmbienceLabel').textContent, /unavailable/);
  c.document.hidden = true;
  events.visibilitychange();
  events.pagehide();
});

test('leaving narrator play while the night recording starts cannot restart sound', async () => {
  const {context: c, sync, recordings} = setup();
  c.state.narratorMode = true;
  c.state.phase = 'night'; sync();
  c.state.phase = 'gameover'; sync();
  await Promise.resolve();
  assert.equal(recordings[0].paused, true);
  assert.equal(recordings[0].volume, 0);
});

test('mobile setup tap unlocks a single audio engine for hosted night playback', async () => {
  const gains = [];
  let resumeCalled = false, finishResume, nightStarted = false;
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; }
    createGain() {
      const gain = {value: 0, cancelScheduledValues() {}, setTargetAtTime(value) { this.value = value; }};
      gains.push(gain);
      return {gain, connect() { return this; }};
    }
    decodeAudioData() { return Promise.resolve({}); }
    createBufferSource() { return {connect() {}, start() { nightStarted = true; }, stop() {}, disconnect() {}}; }
    resume() {
      resumeCalled = true;
      return new Promise(resolve => { finishResume = () => { this.state = 'running'; resolve(); }; });
    }
  }
  const {context: c, events, recordings, sync, advance} = setup(AudioContext, true);
  c.state.narratorMode = true; c.state.phase = 'handoff';
  const night = recordings[0];
  night.play = () => { throw new Error('Hosted playback must not depend on media play permission'); };
  const unlocking = events.click();
  assert.equal(resumeCalled, true);
  finishResume();
  await unlocking;
  assert.equal(night.paused, true, 'priming stays silent outside gameplay');
  c.state.phase = 'night'; sync();
  for (let i=0;i<12;i++) await Promise.resolve();
  assert.equal(nightStarted, true);
  advance(3000);
  assert.equal(gains[1].value, .25 * .3, 'night volume is controlled through Web Audio');
});

test('bundled night loop is gapless PCM with a continuous seam and no silent padding', () => {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets/audio/suburban-night-loop.wav'));
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WAVE');
  assert.equal(bytes.readUInt32LE(24), 44100);
  assert.equal(bytes.readUInt16LE(22), 2);
  const frames = (bytes.length - 44) / 4;
  assert.equal(frames, 23 * 44100);
  for (let ch = 0; ch < 2; ch++) {
    const sample = i => bytes.readInt16LE(44 + i * 4 + ch * 2);
    let edgeEnergy = 0;
    for (let i = 0; i < 4410; i++) edgeEnergy += sample(i) ** 2 + sample(frames - 1 - i) ** 2;
    assert.ok(edgeEnergy > 0, 'both ends contain audio');
    assert.ok(Math.abs(sample(0) - sample(frames - 1)) < 1000, 'no discontinuity at the join');
  }
});
