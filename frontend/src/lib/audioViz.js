// Analyser WebAudio UNIC pe elementul audio global al site-ului.
// createMediaElementSource poate fi apelat o singură dată per element — de aceea singleton.
let hooked = false;
let actx = null;
let analyser = null;
let freq = null;
let time = null;

export function ensureAnalyser(audio) {
  if (hooked) return { actx, analyser, freq, time };
  if (!audio) return null;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const src = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser);
    analyser.connect(actx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
    time = new Uint8Array(analyser.fftSize);
    hooked = true;
    audio.__vizHooked = true;
    return { actx, analyser, freq, time };
  } catch {
    return null;
  }
}

export function resumeAudioCtx() {
  actx?.resume().catch(() => {});
}
