/* Doomsday $1 — one script. No framework, no library. */
(function () {
  'use strict';

  /* Values: one source of truth. */
  var PAYPAL_URL = 'https://www.paypal.com/ncp/payment/AVK97HXPV5E8Y';
  var RELEASE_DATE_TEXT = '17 December 2026';
  var RELEASE_DATE_ISO = '2026-12-17T00:00:00+05:30';
  var RELEASE_DATE_SHORT = 'Dec 17, 2026';
  var FEE_LINE_2 = 'PayPal keeps: about $0.34';
  var FEE_LINE_3 = 'I get: about $0.66 — and the ticket here costs less than $1, so it still covers it.';
  var GOAL_LINE_TEXT = 'Goal: $1. Raised so far: $0 — be the first.';
  var LOCAL_TICKET_PRICE = 'less than $1';
  var SHOW_INTRO = true;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* Date strings come from the constants above. */
  document.querySelectorAll('[data-release-date]').forEach(function (el) {
    el.textContent = RELEASE_DATE_TEXT;
  });
  document.querySelectorAll('[data-release-date-short]').forEach(function (el) {
    el.textContent = RELEASE_DATE_SHORT;
  });
  var goalLine = document.getElementById('goal-line');
  if (goalLine) goalLine.textContent = GOAL_LINE_TEXT;

  /* Countdown. */
  var cdDigits = document.getElementById('countdown-digits');
  var cdUnits = document.querySelector('.countdown-units');
  var target = new Date(RELEASE_DATE_ISO).getTime();
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    if (!cdDigits) return;
    var diff = target - Date.now();
    if (diff <= 0) {
      cdDigits.textContent = 'Doomsday is in theatres now.';
      cdDigits.classList.add('countdown-done');
      if (cdUnits) cdUnits.hidden = true;
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor(diff / 3600000) % 24;
    var m = Math.floor(diff / 60000) % 60;
    var s = Math.floor(diff / 1000) % 60;
    document.getElementById('cd-days').textContent = pad(d);
    document.getElementById('cd-hours').textContent = pad(h);
    document.getElementById('cd-mins').textContent = pad(m);
    var secEl = document.getElementById('cd-secs');
    secEl.textContent = pad(s);
    if (!reducedMotion) {
      secEl.classList.remove('pulse');
      void secEl.offsetWidth;
      secEl.classList.add('pulse');
    }
  }
  tick();
  setInterval(tick, 1000);

  /* Scroll reveals, once, children staggered. */
  var revealEls = document.querySelectorAll('.reveal');
  var staggerKids = document.querySelectorAll('.story-block, .gets-cards article, .timeline-list li, .stills picture, .reel');
  staggerKids.forEach(function (el) {
    var sibs = Array.prototype.slice.call(el.parentElement.children);
    el.style.transitionDelay = (sibs.indexOf(el) * 80) + 'ms';
    el.classList.add('reveal');
  });
  var allReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    allReveal.forEach(function (el) { io.observe(el); });
  } else {
    allReveal.forEach(function (el) { el.classList.add('in'); });
  }
  void revealEls;

  /* Flip card. */
  var flipCard = document.getElementById('flip-card');
  function setFace(face) {
    if (!flipCard) return;
    var flipped = face === 'doom';
    flipCard.classList.toggle('flipped', flipped);
    flipCard.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  }
  if (flipCard) {
    flipCard.addEventListener('click', function () {
      setFace(flipCard.classList.contains('flipped') ? 'tony' : 'doom');
    });
  }
  document.querySelectorAll('.flip-pick button').forEach(function (btn) {
    btn.addEventListener('click', function () { setFace(btn.getAttribute('data-face')); });
  });

  /* Pointer tilt, up to 8 degrees. Touch devices keep the idle sway. */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* Reels: landscape, fetched only on tap, one at a time, pause offscreen. */
  var reelVideos = Array.prototype.slice.call(document.querySelectorAll('.reel-video'));
  reelVideos.forEach(function (video) {
    var frame = video.closest('.reel-frame');
    var playBtn = frame.querySelector('.reel-play');
    function showPlay() { playBtn.hidden = false; }
    function hidePlay() { playBtn.hidden = true; }
    playBtn.addEventListener('click', function () {
      reelVideos.forEach(function (other) { if (other !== video && !other.paused) other.pause(); });
      if (!video.getAttribute('src')) {
        video.setAttribute('src', video.getAttribute('data-src'));
        video.load();
      }
      video.play().then(hidePlay).catch(showPlay);
    });
    video.addEventListener('pause', showPlay);
    video.addEventListener('ended', showPlay);
    video.addEventListener('play', function () {
      hidePlay();
      reelVideos.forEach(function (other) { if (other !== video && !other.paused) other.pause(); });
    });
  });
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
      });
    }, { threshold: 0.2 });
    reelVideos.forEach(function (v) { rio.observe(v); });
  }

  /* Marvel intro: behind a tap, plays once, skippable. */
  var introOpen = document.getElementById('intro-open');
  var introPlayer = document.getElementById('intro-player');
  var introVideo = document.getElementById('intro-video');
  var introSkip = document.getElementById('intro-skip');
  var heroSend = document.getElementById('hero-send');
  if (!SHOW_INTRO) {
    if (introOpen) introOpen.remove();
    if (introPlayer) introPlayer.remove();
  } else if (introOpen && introPlayer && introVideo) {
    introOpen.addEventListener('click', function () {
      introPlayer.hidden = false;
      if (!introVideo.getAttribute('src')) {
        introVideo.setAttribute('src', 'assets/marvel-intro.mp4');
        introVideo.load();
      }
      introVideo.play().catch(function () {});
      introSkip.focus();
    });
    function closeIntro(focusTarget) {
      introVideo.pause();
      introPlayer.hidden = true;
      if (focusTarget) focusTarget.focus();
    }
    introSkip.addEventListener('click', function () { closeIntro(heroSend); });
    introVideo.addEventListener('ended', function () { closeIntro(introOpen); });
  }

  /* Background video: after load, after the hero image has painted. Never on data-saver. */
  var bgVideo = document.getElementById('bg-video');
  var heroImg = document.querySelector('.hero-img img');
  function startBgVideo() {
    if (!bgVideo || reducedMotion) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (bgVideo.getAttribute('src')) return;
    var webm = document.createElement('source');
    webm.setAttribute('src', 'assets/bg-video.webm');
    webm.setAttribute('type', 'video/webm');
    var mp4 = document.createElement('source');
    mp4.setAttribute('src', 'assets/bg-video.mp4');
    mp4.setAttribute('type', 'video/mp4');
    bgVideo.appendChild(webm);
    bgVideo.appendChild(mp4);
    bgVideo.load();
    bgVideo.play().catch(function () {});
  }
  window.addEventListener('load', function () {
    if (heroImg && !heroImg.complete) {
      heroImg.addEventListener('load', function () { requestAnimationFrame(startBgVideo); }, { once: true });
      heroImg.addEventListener('error', function () { requestAnimationFrame(startBgVideo); }, { once: true });
    } else {
      requestAnimationFrame(startBgVideo);
    }
  });

  /* Share: copy buttons copy the exact texts. */
  var SHARE_TEXTS = {
    x: "hi, i'm tarun from india. the ticket for DOOMSDAY costs less than $1 here and i'm asking the internet for exactly $1 to watch it. if u want to be the reason i see Dr. Doom on the big screen: " + PAYPAL_URL,
    whatsapp: "hi, i'm tarun from india. i want to watch DOOMSDAY (in theatres 17 December 2026) and the ticket here costs less than $1. i'm asking for exactly $1, one time: " + PAYPAL_URL + " if not, no worries at all. please forward this to one Marvel fan.",
    email: "Subject: $1 for a Doomsday ticket?\n\nhi, i'm tarun from india. i want to watch doomsday and the ticket here costs less than $1. I know that sounds stupid. But if u sent I will able to watch Doomsday. here is the link: " + PAYPAL_URL + " if not no worries at all. — Tarun"
  };
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        if (document.execCommand('copy')) resolve();
        else reject(new Error('copy failed'));
      } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }
  document.querySelectorAll('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var original = btn.innerHTML;
      copyText(SHARE_TEXTS[btn.getAttribute('data-share')] || '').then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.innerHTML = original; }, 2000);
      }).catch(function () {
        btn.textContent = 'Copy failed, select the text and copy by hand';
      });
    });
  });
  var sharePage = document.getElementById('share-page');
  if (sharePage && navigator.share) {
    sharePage.hidden = false;
    sharePage.addEventListener('click', function () {
      navigator.share({
        title: document.title,
        text: "hi, i'm tarun from india. the ticket for DOOMSDAY costs less than $1 here and i'm asking the internet for exactly $1 to watch it.",
        url: window.location.href
      }).catch(function () {});
    });
  }

  /* Doom shader: WebGL fog, embers, lightning, grain, vignette. */
  var canvas = document.getElementById('doom-shader');
  function initShader() {
    if (!canvas || reducedMotion) return;
    var gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) { canvas.style.display = 'none'; return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 u_res;uniform float u_time;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      'return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}',
      'void main(){',
      'vec2 uv=gl_FragCoord.xy/u_res.xy;',
      'vec2 p=uv; p.x*=u_res.x/u_res.y;',
      'float t=u_time*.03;',
      'float fog=fbm(p*2.2+vec2(t*1.4,-t*.6));',
      'float fog2=fbm(p*4.5-vec2(t*2.2,t*.9));',
      'vec3 col=mix(vec3(.023,.031,.028),vec3(.059,.180,.149),fog);',
      'col=mix(col,vec3(.075,.306,.290),fog2*.35);',
      'float ember=0.;',
      'for(int i=0;i<14;i++){',
      'float fi=float(i);',
      'float sx=hash(vec2(fi,1.))*1.4;',
      'float sy=mod(hash(vec2(fi,7.))*1.2+u_time*(.03+hash(vec2(fi,3.))*.05),1.2)-.1;',
      'float d=distance(p,vec2(sx,sy));',
      'ember+=.012/(d*d*60.+.012)*(.5+.5*hash(vec2(fi,floor(u_time*2.))));}',
      'col+=vec3(1.,.42,.21)*ember;',
      'float fi2=floor(u_time/8.);',
      'float flash=step(.93,hash(vec2(fi2,99.)))*max(0.,sin(fract(u_time/8.)*3.14159));',
      'col+=vec3(.55,.75,.7)*flash*.28;',
      'float sky=step(.86,fbm(vec2(p.x*14.,0.)))*step(uv.y,.14);',
      'col=mix(col,vec3(.01,.012,.011),sky*smoothstep(.14,.10,uv.y));',
      'float g=hash(gl_FragCoord.xy+fract(u_time)*100.);',
      'col+=(g-.5)*.05;',
      'float vig=smoothstep(1.25,.35,distance(uv,vec2(.5)));',
      'col*=mix(.55,1.,vig);',
      'gl_FragColor=vec4(col,1.);}'
    ].join('\n');
    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { canvas.style.display = 'none'; return null; }
      return s;
    }
    var v = shader(gl.VERTEX_SHADER, vs);
    var f = shader(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var running = true;
    var start = performance.now();
    function resize() {
      var scale = window.innerWidth <= 768 ? 0.5 : 1;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      var w = Math.floor(canvas.clientWidth * dpr);
      var h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (document.hidden) return;
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    var hero = document.querySelector('.hero');
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !running) { running = true; requestAnimationFrame(frame); }
          else if (!entry.isIntersecting) { running = false; }
        });
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }
  initShader();
})();
