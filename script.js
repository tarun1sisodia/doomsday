const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/AVK97HXPV5E8Y';
const RELEASE_DATE_ISO = '2026-12-17T00:00:00+05:30';
const RAISED_LINE = 'Goal: $1. Raised so far: $0 — be the first.';
const SHOW_INTRO = true;

const releaseDate = new Date(RELEASE_DATE_ISO);
const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' };
const longDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(releaseDate);
const shortDate = new Intl.DateTimeFormat('en-US', { ...dateOptions, month: 'short' }).format(releaseDate);
const year = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(releaseDate);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.getElementById('hero');
const backgroundVideo = document.getElementById('background-video');
let heroVisible = true;
let backgroundReady = false;
let currentMedia = null;

document.querySelectorAll('[data-date-format]').forEach((element) => {
  const format = element.dataset.dateFormat;
  element.textContent = format === 'short' ? shortDate : format === 'upper' ? longDate.toUpperCase() : format === 'year' ? year : longDate;
  element.dateTime = RELEASE_DATE_ISO;
});
document.getElementById('goal-line').textContent = RAISED_LINE;
document.getElementById('ticket-image').alt = `Illustrated cinema ticket with Doctor Doom art: DOOMSDAY, Tarun Sisodia, ${shortDate}, 7:00 PM, $1.00`;
if (!window.paypal) document.querySelector('.paypal-area').hidden = true;

// The numbers are derived from the same release date as the page copy.
const countdown = document.getElementById('countdown');
let countdownTimer;
function updateCountdown() {
  const remaining = Math.max(0, releaseDate.getTime() - Date.now());
  if (remaining === 0) {
    countdown.textContent = 'Doomsday is in theatres now.';
    countdown.classList.add('is-finished');
    countdown.removeAttribute('aria-label');
    clearInterval(countdownTimer);
    countdownTimer = null;
    return;
  }
  const seconds = Math.floor(remaining / 1000);
  const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
  Object.entries(values).forEach(([unit, value]) => {
    const node = countdown.querySelector(`[data-unit="${unit}"]`);
    if (node) node.textContent = String(value).padStart(2, '0');
  });
}
function syncCountdown() {
  clearInterval(countdownTimer);
  countdownTimer = null;
  if (document.hidden || !heroVisible) return;
  updateCountdown();
  if (Date.now() < releaseDate.getTime()) countdownTimer = setInterval(updateCountdown, 1000);
}
syncCountdown();

// Make reveal effects progressive enhancement: content remains visible without JS.
if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) {
    document.documentElement.classList.add('js-motion');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
      revealObserver.observe(element);
    });
  }
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('offscreen', !entry.isIntersecting));
  });
  document.querySelectorAll('main > section').forEach((section) => sectionObserver.observe(section));
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    syncCountdown();
    updateBackgroundPlayback();
  }).observe(hero);
}
reducedMotion.addEventListener?.('change', () => {
  if (reducedMotion.matches) {
    document.documentElement.classList.remove('js-motion');
    backgroundVideo.pause();
    backgroundVideo.classList.remove('is-playing');
  } else {
    updateBackgroundPlayback();
  }
});

// Flip card is a real button, with explicit controls for either face.
const flipCard = document.getElementById('flip-card');
const frontFace = flipCard.querySelector('.flip-front');
const backFace = flipCard.querySelector('.flip-back');
function showFace(back) {
  flipCard.setAttribute('aria-pressed', String(back));
  frontFace.setAttribute('aria-hidden', String(back));
  backFace.setAttribute('aria-hidden', String(!back));
  document.querySelectorAll('[data-face]').forEach((control) => control.setAttribute('aria-pressed', String((control.dataset.face === 'back') === back)));
}
flipCard.addEventListener('click', () => showFace(flipCard.getAttribute('aria-pressed') !== 'true'));
document.querySelectorAll('[data-face]').forEach((control) => control.addEventListener('click', () => showFace(control.dataset.face === 'back')));

// Fine pointers get tilt; touch users get the existing slow float on the hero.
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tilt-target').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches) return;
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -16;
      element.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
}

// Videos have no media source until a deliberate tap.
function pauseOtherMedia(next) {
  if (currentMedia && currentMedia !== next) currentMedia.pause();
  currentMedia = next;
}
const mediaObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (!entry.isIntersecting) entry.target.querySelector('video')?.pause(); });
}, { threshold: 0.05 }) : null;
document.querySelectorAll('.reel-frame').forEach((frame) => {
  mediaObserver?.observe(frame);
  frame.querySelector('button').addEventListener('click', () => {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('aria-label', frame.querySelector('button').getAttribute('aria-label'));
    video.src = frame.dataset.video;
    frame.append(video);
    frame.querySelector('button').hidden = true;
    video.addEventListener('play', () => pauseOtherMedia(video));
    video.addEventListener('error', () => { video.remove(); frame.querySelector('button').hidden = false; });
    pauseOtherMedia(video);
    video.play().catch(() => { video.controls = true; });
  });
});

// The optional intro is built only when enabled; media is requested on tap.
if (SHOW_INTRO) {
  const slot = document.getElementById('intro-slot');
  const introButton = document.createElement('button');
  introButton.className = 'intro-toggle';
  introButton.type = 'button';
  introButton.textContent = 'Play the intro';
  slot.append(introButton);
  introButton.addEventListener('click', () => {
    const player = document.createElement('div');
    player.className = 'intro-player';
    const video = document.createElement('video');
    const name = ['marvel', 'intro'].join('-');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = `assets/${name}-poster.jpg`;
    video.src = `assets/${name}.mp4`;
    video.setAttribute('aria-label', 'Play the intro');
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'skip-intro';
    skip.textContent = 'Skip';
    player.append(video, skip);
    slot.append(player);
    introButton.hidden = true;
    const close = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (currentMedia === video) currentMedia = null;
      player.remove();
      introButton.hidden = false;
      document.getElementById('primary-payment').focus();
    };
    skip.addEventListener('click', close);
    video.addEventListener('ended', close);
    video.addEventListener('play', () => pauseOtherMedia(video));
    mediaObserver?.observe(player);
    pauseOtherMedia(video);
    video.play().catch(() => { video.controls = true; });
  });
}

// Copy text avoids asserting a ticket price that has not been verified.
const shareText = {
  x: `hi, i'm tarun from india. i'm asking the internet for exactly $1, one time, to watch DOOMSDAY. if u want to be the reason i see Dr. Doom on the big screen: ${PAYPAL_URL}`,
  whatsapp: `hi, i'm tarun from india. i want to watch DOOMSDAY (in theatres ${longDate}). i'm asking for exactly $1, one time: ${PAYPAL_URL} if not, no worries at all. please forward this to one Marvel fan.`,
  email: `Subject: $1 for a Doomsday ticket?\n\nhi, i'm tarun from india. i want to watch doomsday. I know that sounds stupid. But if u sent I will able to watch Doomsday. here is the link: ${PAYPAL_URL} if not no worries at all. — Tarun`
};
const copyStatus = document.getElementById('copy-status');
const copyFallback = document.getElementById('copy-fallback');
document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const original = button.textContent;
    const text = shareText[button.dataset.copy];
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      copyFallback.hidden = true;
      button.textContent = 'Copied';
      copyStatus.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; copyStatus.textContent = ''; }, 2000);
    } catch {
      button.textContent = 'Copy failed, select the text and copy by hand.';
      copyStatus.textContent = 'Copy failed, select the text and copy by hand.';
      copyFallback.value = text;
      copyFallback.hidden = false;
      copyFallback.focus();
      copyFallback.select();
      setTimeout(() => { button.textContent = original; }, 2000);
    }
  });
});
const nativeShare = document.getElementById('native-share');
if (navigator.share) {
  nativeShare.hidden = false;
  nativeShare.addEventListener('click', () => navigator.share({ title: 'Send $1 for Doomsday', url: document.querySelector('link[rel="canonical"]').href }).catch(() => {}));
}

function updateBackgroundPlayback() {
  if (!backgroundReady || reducedMotion.matches || document.hidden || !heroVisible) {
    backgroundVideo.pause();
    return;
  }
  backgroundVideo.play().then(() => backgroundVideo.classList.add('is-playing')).catch(() => backgroundVideo.classList.remove('is-playing'));
}
window.addEventListener('load', () => {
  const image = document.getElementById('hero-image');
  const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (reducedMotion.matches || navigator.connection?.saveData) return;
    [['assets/bg-video.webm', 'video/webm'], ['assets/bg-video.mp4', 'video/mp4']].forEach(([src, type]) => {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      backgroundVideo.append(source);
    });
    backgroundVideo.addEventListener('error', () => backgroundVideo.classList.remove('is-playing'));
    backgroundReady = true;
    backgroundVideo.load();
    updateBackgroundPlayback();
  }));
  if (image.complete) afterPaint();
  else image.addEventListener('load', afterPaint, { once: true });
});
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) currentMedia?.pause();
  syncCountdown();
  updateBackgroundPlayback();
});

// Small standalone WebGL atmosphere; a static background remains if WebGL fails.
function startShader() {
  if (reducedMotion.matches) return;
  const canvas = document.getElementById('doom-shader');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  const vertex = 'attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}';
  const fragment = `precision mediump float;
    uniform vec2 r; uniform float t;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 uv=gl_FragCoord.xy/r; vec2 p=uv*vec2(r.x/r.y,1.);
      float fog=noise(p*3.1+vec2(t*.014,t*.007))*.55+noise(p*6.0-vec2(t*.01,0.))*.2;
      vec3 color=mix(vec3(.01,.035,.025),vec3(.035,.20,.16),fog);
      float block=floor(p.x*20.); float skyline=.05+hash(vec2(block,2.))*.14;
      if(uv.y<skyline) color*=.15;
      vec2 ember=vec2(p.x*32.,(p.y-t*.035)*18.); vec2 cell=floor(ember);vec2 f=fract(ember)-.5;
      float spark=(1.-smoothstep(0.,.13,length(f)))*step(.91,hash(cell))*(1.-smoothstep(.1,.8,uv.y));
      color+=vec3(.9,.23,.035)*spark*.6;
      float flash=pow(max(0.,sin(t*.82)),90.)*.09; color+=vec3(.18,.3,.23)*flash;
      float vignette=1.-.55*length(uv-.5); color*=vignette;
      color+=(hash(gl_FragCoord.xy+floor(t*4.))-.5)*.025;
      gl_FragColor=vec4(color,1.);}`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  }
  const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'r'), time = gl.getUniformLocation(program, 't');
  let last = 0, animationFrame = 0;
  function frame(now) {
    if (document.hidden || !heroVisible || reducedMotion.matches || gl.isContextLost()) { animationFrame = 0; return; }
    if (now - last >= 33) {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 768 ? .5 : 1);
      const width = Math.max(1, Math.round(canvas.clientWidth * scale)), height = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
      gl.uniform2f(resolution, width, height); gl.uniform1f(time, now / 1000); gl.drawArrays(gl.TRIANGLES, 0, 6); last = now;
    }
    animationFrame = requestAnimationFrame(frame);
  }
  function resume() { if (!animationFrame && !document.hidden && heroVisible && !reducedMotion.matches) animationFrame = requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener?.('change', resume);
  if ('IntersectionObserver' in window) new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { heroVisible = true; resume(); } }).observe(hero);
  resume();
}
window.addEventListener('load', () => { window.setTimeout(startShader, 1500); }, { once: true });
