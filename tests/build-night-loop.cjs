// Rebuild the bundled loop from its credited source without external codecs.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try {
    const page = await browser.newPage();
    const encoded = fs.readFileSync(path.join(__dirname, '../assets/audio/suburban-night-source.mp3')).toString('base64');
    const result = await page.evaluate(async encoded => {
      const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      const decoder = new OfflineAudioContext(2, 1, 44100);
      const decoded = await decoder.decodeAudioData(bytes.buffer);
      const length = Math.round(decoded.duration * 44100);
      const renderer = new OfflineAudioContext(2, length, 44100);
      const source = renderer.createBufferSource(); source.buffer = decoded;
      const filter = renderer.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 3500; filter.Q.value = .5;
      source.connect(filter).connect(renderer.destination); source.start();
      const filtered = await renderer.startRendering();
      const overlap = 44100 * 3;
      const frames = filtered.length - overlap;
      const output = new Uint8Array(frames * 4);
      const view = new DataView(output.buffer);
      for (let i = 0; i < frames; i++) {
        for (let ch = 0; ch < 2; ch++) {
          const data = filtered.getChannelData(ch);
          let sample = data[i + overlap];
          if (i >= frames - overlap) {
            const j = i - (frames - overlap);
            const t = j / overlap;
            const blend = t * t * (3 - 2 * t);
            sample = sample * (1 - blend) + data[j] * blend;
          }
          view.setInt16((i * 2 + ch) * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true);
        }
      }
      let binary = '';
      for (let i = 0; i < output.length; i += 8192) binary += String.fromCharCode(...output.subarray(i, i + 8192));
      return {pcm: btoa(binary), frames, rate: 44100, sourceDuration: decoded.duration};
    }, encoded);
    const pcm = Buffer.from(result.pcm, 'base64');
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
    header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
    header.writeUInt16LE(2, 22); header.writeUInt32LE(result.rate, 24);
    header.writeUInt32LE(result.rate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(path.join(__dirname, '../assets/audio/suburban-night-loop.wav'), Buffer.concat([header, pcm]));
    console.log(`Decoded ${result.sourceDuration.toFixed(2)}s recording; built ${(result.frames/result.rate).toFixed(2)}s stereo loop with 3s overlap.`);
  } finally { await browser.close(); }
})();
