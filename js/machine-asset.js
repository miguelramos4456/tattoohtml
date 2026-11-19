/* ============================================================
   machine-asset.js — the tattoo machine GLB as a visual asset.
   No controls, no hotspots, no explanation: just the object,
   lit and composed, leaning slightly toward the pointer.

   • Desktop with WebGL: live render, loaded only when near view.
   • Touch screens, Save-Data, no WebGL: the still render stays.
   • Never rotates on its own. Reduced motion: static.
   • Renders only while the tilt is settling.
   ============================================================ */

(function () {
  'use strict';

  var holders = document.querySelectorAll('[data-machine]');
  if (!holders.length) return;

  var MODEL_URL = 'assets/models/tattoo-machine.web.glb';
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';

  var mq = function (q) { return window.matchMedia(q).matches; };
  var conn = navigator.connection || {};
  var touch = mq('(hover: none), (pointer: coarse)');
  var reduced = mq('(prefers-reduced-motion: reduce)');
  if (touch || conn.saveData || !webgl()) return; // keep the still image

  function webgl() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = false; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  var libs = null;
  function loadLibs() {
    if (!libs) {
      libs = (window.THREE ? Promise.resolve() : loadScript(THREE_URL)).then(function () {
        return window.THREE.GLTFLoader ? null : loadScript(GLTF_URL);
      });
    }
    return libs;
  }

  Array.prototype.forEach.call(holders, function (el) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); start(el); }
    }, { rootMargin: '300px 0px' });
    io.observe(el);
  });

  function start(el) {
    loadLibs().then(function () {
      new window.THREE.GLTFLoader().load(MODEL_URL, function (gltf) { mount(el, gltf); });
    }).catch(function () { /* still image stays */ });
  }

  function mount(el, gltf) {
    var THREE = window.THREE;
    var w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.physicallyCorrectLights = true;
    var canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'machine-asset__canvas';

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, w / h, 0.01, 100);
    try {
      var pm = new THREE.PMREMGenerator(renderer);
      var env = new THREE.Scene(); env.background = new THREE.Color(0x4a4640);
      scene.environment = pm.fromScene(env, 0.04).texture;
      pm.dispose();
    } catch (e) { /* optional */ }
    scene.add(new THREE.HemisphereLight(0xf3ece0, 0x1a1816, 0.7));
    var key = new THREE.DirectionalLight(0xfff4e6, 2.0); key.position.set(3, 4, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xe9e3d8, 1.6); rim.position.set(-4, 2, -3); scene.add(rim);
    var warm = new THREE.DirectionalLight(0xc9a58a, 0.5); warm.position.set(-3, -2, 3); scene.add(warm);

    var model = gltf.scene;
    model.traverse(function (o) {
      if (o.isMesh && o.material && o.material.envMapIntensity !== undefined) o.material.envMapIntensity = 1.3;
    });
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    model.position.sub(box.getCenter(new THREE.Vector3()));
    var pivot = new THREE.Group();
    pivot.add(model);
    pivot.scale.setScalar(2 / Math.max(size.x, size.y, size.z));
    pivot.rotation.z = -0.16; // same lean as the still image
    scene.add(pivot);

    var half = size.clone().multiplyScalar(pivot.scale.x / 2);
    function frameCamera() {
      var vf = camera.fov * Math.PI / 180;
      var hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      var hx = Math.max(half.x, half.z);
      var d = Math.max(half.y / Math.tan(vf / 2), hx / Math.tan(hf / 2)) * 1.05 + hx * 0.6;
      camera.position.copy(new THREE.Vector3(-2.2, 0.7, 3.9).normalize().multiplyScalar(d));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    frameCamera();

    // pointer lean (small, eased, stops rendering when settled)
    var base = { x: 0, y: 0 };
    var cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
    var raf = null, visible = true;

    function render() {
      pivot.rotation.y = base.y + cur.y;
      pivot.rotation.x = base.x + cur.x;
      renderer.render(scene, camera);
    }
    function tick() {
      raf = null;
      cur.x += (tgt.x - cur.x) * 0.08;
      cur.y += (tgt.y - cur.y) * 0.08;
      render();
      if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.0005) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(tick); }

    if (!reduced) {
      window.addEventListener('pointermove', function (e) {
        if (!visible) return;
        tgt.y = ((e.clientX / window.innerWidth) * 2 - 1) * 0.35;
        tgt.x = ((e.clientY / window.innerHeight) * 2 - 1) * 0.12;
        kick();
      }, { passive: true });
    }

    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }).observe(el);

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var nw = el.clientWidth, nh = el.clientHeight;
        if (!nw || !nh) return;
        renderer.setSize(nw, nh, false);
        camera.aspect = nw / nh;
        frameCamera();
        render();
      }).observe(el);
    }

    el.appendChild(canvas);
    render();
    el.classList.add('is-live');
  }
}());
