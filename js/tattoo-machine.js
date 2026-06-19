/* ============================================================
   TATTOO MACHINE — tattoo-machine.js
   Fixed canvas overlay, transparent.
   Appears after the statement/quote section.
   Oval path through Work section → locks left at About.
   Three.js r128.
   ============================================================ */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') { console.warn('[machine] THREE missing'); return; }

  var _clamp = (THREE.MathUtils || THREE.Math).clamp;
  var _lerp  = function (a, b, t) { return a + (b - a) * t; };

  /* ── Fixed transparent canvas ──────────────────────────────── */
  var mc = document.createElement('canvas');
  mc.id  = 'machine-canvas';
  mc.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100%', 'height:100%',
    'z-index:5',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.7s ease'
  ].join(';');
  document.body.appendChild(mc);

  /* ── Dimensions ─────────────────────────────────────────────── */
  var SW = window.innerWidth;
  var SH = window.innerHeight;

  /* ── Three.js renderer ─────────────────────────────────────── */
  var renderer = new THREE.WebGLRenderer({ canvas: mc, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(SW, SH);
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding          = THREE.sRGBEncoding;
  renderer.toneMapping             = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure     = 1.1;
  renderer.physicallyCorrectLights = true;

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, SW / SH, 0.01, 100);
  camera.position.set(0, 0.2, 8);

  /* Environment */
  try {
    var pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var es = new THREE.Scene(); es.background = new THREE.Color(0x3a3a3a);
    scene.environment = pmrem.fromScene(es, 0.04).texture;
    pmrem.dispose();
  } catch (e) { /* skip */ }

  /* Lights */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, 5, 4); scene.add(keyLight);
  var fillLight = new THREE.DirectionalLight(0xaabbdd, 0.6);
  fillLight.position.set(-4, 1, -2); scene.add(fillLight);
  var rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
  rimLight.position.set(0, -3, -5); scene.add(rimLight);
  var mouseLight = new THREE.PointLight(0xffffff, 2.0, 8);
  mouseLight.position.set(0, 1, 3); scene.add(mouseLight);

  /* ── State ──────────────────────────────────────────────────── */
  var model = null;

  /* base Y rotation — face slightly toward viewer */
  var BASE_ROT_Y = -0.12;

  /* oval path constants */
  var LEFT_X  = -3.0;   /* locked left anchor */
  var OVAL_RX =  6.0;   /* how far right the arc extends */
  var OVAL_RY =  0.5;   /* vertical height of the arc */

  /* scroll-driven targets — updated by onScroll */
  var POS_X    = LEFT_X;
  var POS_Y    =  0.0;
  var currPosX = LEFT_X;
  var currPosY =  0.0;

  /* Z tilt — lerped toward targetRotZ each frame */
  var targetRotZ = 0.52;   /* needle right at start */
  var currRotZ   = 0.52;

  /* needle tip in model local space — auto-detected in onLoaded */
  var NEEDLE_LOCAL = new THREE.Vector3(0.0, -1.15, 0.1);

  /* mouse / drag */
  var mouseInflX = 0, mouseInflY = 0;
  var targetMX   = 0, targetMY   = 0;
  var isDragging = false, dragRotY = 0, dragRotX = 0;
  var lastMX = 0, lastMY = 0;

  var idleTime = 0;
  var prevT    = 0;
  var rafId    = null;
  var visible  = false;

  /* ── DOM section references ─────────────────────────────────── */
  var heroEl      = document.querySelector('.hero')      || document.getElementById('hero');
  var statementEl = document.querySelector('.statement');
  var workEl      = document.querySelector('.work')      || document.getElementById('work');
  var aboutEl     = document.querySelector('.about')     || document.getElementById('about');
  var contactEl      = document.querySelector('.contact')      || document.getElementById('contact');
  var specialtiesEl  = document.querySelector('.specialties')  || document.getElementById('specialties');

  function getTop(el) {
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }

  /* ── Scroll handler ─────────────────────────────────────────── */
  function onScroll() {
    var sy = window.scrollY;

    var showStart = statementEl
      ? getTop(statementEl) + statementEl.offsetHeight - 80
      : (heroEl ? heroEl.offsetHeight + 100 : SH + 100);

    /* Hide when about section's bottom edge scrolls above 60% of the viewport —
       reliable regardless of cloud-separator negative-margin overlap. */
    var hideNow = aboutEl
      ? aboutEl.getBoundingClientRect().bottom < SH * 0.6
      : sy > (specialtiesEl ? getTop(specialtiesEl) : showStart + SH * 4);

    setVisible(sy >= showStart && !hideNow);

    /* ── Oval path: left → arc through Work → lock left at About ── */
    var workTop  = workEl  ? getTop(workEl)  : showStart;
    var aboutTop = aboutEl ? getTop(aboutEl) : workTop + SH * 3;

    if (sy < workTop) {
      /* before Work section — fixed left */
      POS_X = LEFT_X; POS_Y = 0.0; targetRotZ = 0.52;
    } else if (sy <= aboutTop) {
      /* inside Work section — trace a half-oval */
      var t     = (sy - workTop) / (aboutTop - workTop);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      var angle = t * Math.PI;                         /* 0 → π */
      POS_X = LEFT_X + OVAL_RX * Math.sin(angle);     /* left → right → left */
      POS_Y = OVAL_RY * Math.sin(angle);               /* gentle vertical arc */
      /* tilt: left side = needle right (+), right side = needle left (-) */
      var nx = (POS_X - LEFT_X) / OVAL_RX;            /* 0 at left, 1 at peak right */
      nx = nx < 0 ? 0 : nx > 1 ? 1 : nx;
      targetRotZ = 0.52 - nx * 1.04;
    } else {
      /* About section and beyond — lock left, needle right */
      POS_X = LEFT_X; POS_Y = 0.0; targetRotZ = 0.52;
    }
  }

  /* ── Visibility ─────────────────────────────────────────────── */
  function setVisible(v) {
    if (v === visible) return;
    visible = v;
    mc.style.opacity        = v ? '1' : '0';
    mc.style.pointerEvents  = v ? 'all' : 'none';
    if (v && !rafId) { prevT = performance.now(); tick(); }
    if (!v && rafId)  { cancelAnimationFrame(rafId); rafId = null; }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(onScroll, 120);

  /* ── Load GLB ───────────────────────────────────────────────── */
  if (typeof THREE.GLTFLoader === 'undefined') {
    console.warn('[machine] GLTFLoader missing'); return;
  }

  new THREE.GLTFLoader().load(
    './js/tattoo-machine.glb',
    function (gltf) { onLoaded(gltf); },
    undefined,
    function (e) { console.error('[machine] GLB load error', e); }
  );

  function onLoaded(gltf) {
    var m = gltf.scene;

    /* keep original GLB materials, boost env reflections */
    m.traverse(function (c) {
      if (!c.isMesh || !c.material) return;
      if (c.material.envMapIntensity !== undefined) {
        c.material.envMapIntensity = 1.5;
        c.material.needsUpdate = true;
      }
    });

    /* ── Center + scale ───────────────────────────────────────── */
    var b1 = new THREE.Box3().setFromObject(m);
    var s1 = new THREE.Vector3(); b1.getSize(s1);
    var c1 = new THREE.Vector3(); b1.getCenter(c1);
    m.position.sub(c1);

    var targetSize = 2.4;
    m.scale.setScalar(targetSize / (Math.max(s1.x, s1.y, s1.z) || 1));

    var b2 = new THREE.Box3().setFromObject(m);
    var c2 = new THREE.Vector3(); b2.getCenter(c2);
    m.position.sub(c2);

    /* initial orientation */
    m.rotation.set(-0.10, BASE_ROT_Y, currRotZ);

    /* camera distance */
    var fov  = camera.fov * Math.PI / 180;
    var camZ = (targetSize / 2) / Math.tan(fov / 2) * 1.7;
    camera.position.set(0, 0.2, camZ);
    camera.near = 0.01;
    camera.far  = camZ * 4;
    camera.updateProjectionMatrix();

    scene.add(m);
    model = m;

    /* auto-detect needle tip: lowest y vertex in model local space */
    (function () {
      var savedRX = m.rotation.x, savedRY = m.rotation.y, savedRZ = m.rotation.z;
      m.rotation.set(0, 0, 0);
      m.updateMatrixWorld(true);
      var minY = Infinity, tv = new THREE.Vector3();
      m.traverse(function (node) {
        if (!node.isMesh || !node.geometry) return;
        var attr = node.geometry.attributes.position;
        if (!attr) return;
        for (var vi = 0; vi < attr.count; vi++) {
          tv.fromBufferAttribute(attr, vi);
          node.localToWorld(tv);
          m.worldToLocal(tv);
          if (tv.y < minY) { minY = tv.y; NEEDLE_LOCAL.copy(tv); }
        }
      });
      m.rotation.set(savedRX, savedRY, savedRZ);
      m.updateMatrixWorld(true);
    }());

    onScroll();   /* recompute scroll state now model is ready */
  }

  /* ── Render loop ───────────────────────────────────────────── */
  function tick() {
    if (!visible) { rafId = null; return; }
    rafId = requestAnimationFrame(tick);

    var now = performance.now();
    var dt  = Math.min((now - prevT) / 1000, 0.05);
    prevT   = now;
    idleTime += dt;

    /* smoothly follow scroll-driven targets */
    currPosX = _lerp(currPosX, POS_X, 0.14);
    currPosY = _lerp(currPosY, POS_Y, 0.14);
    currRotZ = _lerp(currRotZ, targetRotZ, 0.10);

    /* mouse influence */
    mouseInflX = _lerp(mouseInflX, targetMX, 0.05);
    mouseInflY = _lerp(mouseInflY, targetMY, 0.05);

    /* mouse light */
    mouseLight.position.x = _lerp(mouseLight.position.x, targetMX * 4, 0.08);
    mouseLight.position.y = _lerp(mouseLight.position.y, targetMY * 2, 0.08);

    if (model) {
      model.rotation.y = BASE_ROT_Y
                       + dragRotY
                       + mouseInflX * 0.12
                       + Math.sin(idleTime * 0.6) * 0.025;

      model.rotation.x = -0.10
                       + dragRotX
                       + Math.sin(idleTime * 0.9) * 0.025
                       + mouseInflY * 0.09;

      model.rotation.z = currRotZ;

      model.position.x = currPosX + Math.sin(idleTime * 0.75) * 0.02;
      model.position.y = currPosY + Math.sin(idleTime * 1.3) * 0.06;

      camera.position.x = 0;
      camera.lookAt(0, model.position.y * 0.3, 0);
    }

    renderer.render(scene, camera);
  }

  /* ── Mouse / touch ──────────────────────────────────────────── */
  window.addEventListener('mousemove', function (e) {
    targetMX = (e.clientX / SW) * 2 - 1;
    targetMY = -((e.clientY / SH) * 2 - 1);
    if (isDragging && model) {
      dragRotY += (e.clientX - lastMX) * 0.007;
      dragRotX  = _clamp(dragRotX + (e.clientY - lastMY) * 0.007, -0.5, 0.5);
      lastMX = e.clientX; lastMY = e.clientY;
    }
  });

  window.addEventListener('mousedown', function (e) {
    if (!visible) return;
    isDragging = true; lastMX = e.clientX; lastMY = e.clientY;
  });
  window.addEventListener('mouseup', function () { isDragging = false; });

  window.addEventListener('touchmove', function (e) {
    if (!e.touches.length || !visible) return;
    var t = e.touches[0];
    targetMX = (t.clientX / SW) * 2 - 1;
    targetMY = -((t.clientY / SH) * 2 - 1);
    if (isDragging && model) {
      dragRotY += (t.clientX - lastMX) * 0.007;
      dragRotX  = _clamp(dragRotX + (t.clientY - lastMY) * 0.007, -0.5, 0.5);
      lastMX = t.clientX; lastMY = t.clientY;
    }
  }, { passive: true });

  window.addEventListener('touchstart', function (e) {
    if (!e.touches.length || !visible) return;
    isDragging = true; lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
  });
  window.addEventListener('touchend', function () { isDragging = false; });

  /* ── Resize ─────────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    SW = window.innerWidth; SH = window.innerHeight;
    renderer.setSize(SW, SH);
    camera.aspect = SW / SH;
    camera.updateProjectionMatrix();
  });

}());
