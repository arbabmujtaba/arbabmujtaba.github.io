/**
 * Ambient sound, synthesised — no audio files.
 *
 * Only ever loaded after a visitor switches sound on (that click is also the
 * user gesture browsers require). A quiet room tone (brown noise through a low
 * pass, warmer at night), plus three cues: a chime for a discovery, a soft
 * draught for a door, a tick for a spark. Suspended whenever the tab is hidden.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bed: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;

function context(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend();
      else if (bed) void ctx.resume();
    });
  }
  return ctx;
}

function noiseBuffer(audio: AudioContext, seconds = 4): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    // Brown noise: integrated white noise, kept in range.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

export function startAmbience(theme: 'day' | 'night') {
  const audio = context();
  void audio.resume();
  if (bed) {
    setAmbienceTheme(theme);
    return;
  }
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer(audio);
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  const gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(master!);
  source.start();
  bed = { source, filter, gain };
  setAmbienceTheme(theme);
}

export function setAmbienceTheme(theme: 'day' | 'night') {
  if (!bed || !ctx) return;
  const now = ctx.currentTime;
  bed.filter.frequency.setTargetAtTime(theme === 'night' ? 420 : 900, now, 0.8);
  bed.gain.gain.setTargetAtTime(theme === 'night' ? 0.05 : 0.03, now, 0.8);
}

export function stopAmbience() {
  if (!bed || !ctx) return;
  const { source, gain } = bed;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  window.setTimeout(() => {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
  }, 1200);
  bed = null;
}

export function playCue(name: 'chime' | 'door' | 'spark') {
  if (!ctx || !master || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (name === 'chime') {
    [880, 1318.5, 1760].forEach((frequency, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.06 / (i + 1), now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 1.6);
      osc.connect(gain).connect(master!);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 1.7);
    });
  } else if (name === 'door') {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 1.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    source.stop(now + 1.5);
  } else {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.16);
  }
}
