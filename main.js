/* =====================================================================
   SISTEMA SOLAR 3D
   - Render con Three.js
   - Simulacion gravitatoria newtoniana (integrador velocity-Verlet)
   - Unidades de simulacion: distancia en UA, masa en masas solares,
     tiempo en años. En estas unidades G = 4*PI^2, de modo que un
     cuerpo a 1 UA orbita en 1 año (3a ley de Kepler exacta).
   ===================================================================== */
(function () {
  "use strict";

  // ---- Comprobacion de que Three.js cargo desde el CDN ----
  if (typeof THREE === "undefined") {
    const m = document.getElementById("loader-msg");
    if (m) {
      m.innerHTML =
        "No se pudo cargar Three.js.<br>Comprueba tu conexion a internet y recarga la pagina.";
      m.style.color = "#ff8a8a";
    }
    document.querySelector(".spinner").style.borderTopColor = "#ff8a8a";
    return;
  }

  // ========================= CONSTANTES =========================
  const AU_IN_UNITS = 30;                 // unidades de escena por 1 UA
  const AU_KM = 1.495978707e8;            // km por UA
  const SUN_MASS = 1.98892e30;            // kg
  const G = 4 * Math.PI * Math.PI;        // UA^3 / (Msol * año^2)
  const DT_MAX = 0.0015;                  // paso de integracion maximo (años)
  const SEC_PER_YEAR = 31557600;          // segundos en 1 año (365.25 dias)

  // ========================= ESTADO GLOBAL =========================
  let scene, camera, renderer, controls, clock, raycaster, pointer;
  let running = true;
  let speed = 1;                          // segundos simulados por segundo real (1 = tiempo real)
  let selected = null;                    // cuerpo seleccionado
  let followBody = null;                  // cuerpo que sigue la camara
  let flight = null;                      // animacion de vuelo de camara
  let showOrbits = true, showLabels = true, realSize = true;
  const prevFollow = new THREE.Vector3();
  const hitboxes = [];
  let simTime = 0;                        // tiempo simulado acumulado (años)
  const MOONS = [];                       // lunas (satelites)
  const PROBES = [];                      // sondas y naves humanas
  let bodiesAndMoons = [];                // planetas + lunas + sondas (lista/etiquetas)

  const dom = {
    scene: document.getElementById("scene"),
    loader: document.getElementById("loader"),
    play: document.getElementById("btn-play"),
    reset: document.getElementById("btn-reset"),
    speed: document.getElementById("speed"),
    speedVal: document.getElementById("speed-val"),
    tOrbits: document.getElementById("toggle-orbits"),
    tLabels: document.getElementById("toggle-labels"),
    list: document.getElementById("body-list-items"),
    search: document.getElementById("body-search"),
    info: document.getElementById("info-panel"),
    infoClose: document.getElementById("info-close"),
    infoName: document.getElementById("info-name"),
    infoType: document.getElementById("info-type"),
    infoGrid: document.getElementById("info-grid"),
    infoFact: document.getElementById("info-fact"),
  };

  // ========================= UTILIDADES =========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function hexRgb(h) { return { r: (h >> 16) & 255, g: (h >> 8) & 255, b: h & 255 }; }
  function rgbStr(c, l = 1, a = 1) {
    const r = clamp(c.r * l, 0, 255) | 0, g = clamp(c.g * l, 0, 255) | 0, b = clamp(c.b * l, 0, 255) | 0;
    return `rgba(${r},${g},${b},${a})`;
  }
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  function toSup(n) { return String(n).split("").map((d) => SUP[d] || d).join(""); }
  function fmtMass(kg) {
    const e = Math.floor(Math.log10(kg));
    const m = kg / Math.pow(10, e);
    return `${m.toFixed(2)} × 10${toSup(e)} kg`;
  }
  const fmtNum = (n) => n.toLocaleString("es-ES");
  // quita acentos y pasa a minusculas (para el buscador)
  function normalize(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  // velocidad del tiempo -> texto legible (mult = segundos sim por segundo real)
  function formatRate(mult) {
    const t = mult;
    if (t < 1.5) return "Tiempo real";
    if (t < 90) return `${Math.round(t)}× tiempo real`;
    if (t < 5400) return `${Math.round(t / 60)} min/s`;
    if (t < 129600) return `${Math.round(t / 3600)} h/s`;
    if (t < 0.9 * SEC_PER_YEAR) return `${Math.round(t / 86400)} días/s`;
    const y = t / SEC_PER_YEAR;
    return `${y < 10 ? y.toFixed(1) : Math.round(y)} años/s`;
  }

  // ========================= TEXTURAS PROCEDURALES =========================
  function makeTexture(body) {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 256;
    const x = cv.getContext("2d");
    const base = hexRgb(body.color);

    if (body.id === "sol") {
      x.fillStyle = rgbStr(base, 1); x.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 2600; i++) {
        const px = Math.random() * 512, py = Math.random() * 256, r = Math.random() * 7 + 1;
        const l = 0.6 + Math.random() * 0.9;
        x.fillStyle = rgbStr(base, l, 0.5);
        x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
      }
    } else if (/gigante/i.test(body.type)) {
      // bandas horizontales
      for (let y = 0; y < 256; y++) {
        const f = Math.sin(y * 0.09) * 0.5 + Math.sin(y * 0.31 + 1) * 0.22 + 0.5;
        const l = 0.72 + f * 0.45 + (Math.random() - 0.5) * 0.05;
        x.fillStyle = rgbStr(base, l); x.fillRect(0, y, 512, 1);
      }
      if (body.id === "jupiter") { // Gran Mancha Roja
        x.fillStyle = "rgba(170,60,30,0.8)";
        x.beginPath(); x.ellipse(360, 165, 34, 16, 0, 0, 7); x.fill();
      }
    } else {
      // rocoso: base + moteado
      x.fillStyle = rgbStr(base, 1); x.fillRect(0, 0, 512, 256);
      const blobs = body.id === "tierra" ? 0 : 1500;
      for (let i = 0; i < blobs; i++) {
        const px = Math.random() * 512, py = Math.random() * 256, r = Math.random() * 6 + 1;
        const l = 0.65 + Math.random() * 0.6;
        x.fillStyle = rgbStr(base, l, 0.5);
        x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
      }
      if (body.id === "tierra") {
        // --- oceano (degradado azul) ---
        const og = x.createLinearGradient(0, 0, 0, 256);
        og.addColorStop(0, "#27457a");
        og.addColorStop(0.5, "#1d68b2");
        og.addColorStop(1, "#234a88");
        x.fillStyle = og; x.fillRect(0, 0, 512, 256);

        // proyeccion equirectangular: (longitud, latitud) -> pixel
        const P = (lon, lat) => [((lon + 180) / 360) * 512, ((90 - lat) / 180) * 256];
        const drawLand = (poly, fill) => {
          x.beginPath();
          for (let i = 0; i < poly.length; i++) {
            const c = P(poly[i][0], poly[i][1]);
            if (i) x.lineTo(c[0], c[1]); else x.moveTo(c[0], c[1]);
          }
          x.closePath(); x.fillStyle = fill; x.fill();
        };

        const G1 = "#3f8a3a", G2 = "#357c39", TAN = "#cdb277";
        const continents = [
          // Norteamerica
          [[-168,65],[-158,71],[-130,71],[-110,73],[-95,73],[-82,73],[-65,62],[-57,52],[-66,48],[-70,43],[-76,35],[-81,30],[-81,25],[-90,29],[-94,26],[-104,21],[-110,24],[-117,31],[-122,37],[-124,42],[-124,48],[-128,52],[-138,58],[-152,59]],
          // Sudamerica
          [[-80,8],[-72,11],[-62,9],[-50,2],[-44,-2],[-35,-8],[-40,-15],[-48,-27],[-56,-34],[-63,-41],[-70,-50],[-74,-53],[-73,-46],[-71,-37],[-71,-25],[-75,-16],[-78,-8],[-81,-2]],
          // Africa
          [[-17,14],[-13,21],[-7,30],[0,32],[10,33],[20,32],[28,31],[33,28],[36,20],[43,12],[51,12],[48,5],[42,-2],[40,-10],[35,-20],[27,-31],[20,-35],[16,-29],[13,-20],[11,-10],[9,1],[4,5],[-5,5],[-12,8]],
          // Europa
          [[-10,37],[-9,43],[0,49],[-5,50],[2,51],[-3,58],[6,63],[12,58],[20,70],[30,70],[42,66],[48,55],[50,46],[40,44],[30,45],[28,41],[20,40],[14,45],[7,44],[-2,43]],
          // Asia
          [[48,55],[60,68],[70,73],[90,76],[105,77],[125,73],[140,72],[160,69],[170,66],[165,60],[150,59],[143,53],[140,48],[132,45],[130,40],[123,40],[122,31],[119,24],[110,21],[106,10],[102,6],[100,13],[97,16],[92,21],[88,22],[82,20],[80,13],[77,8],[74,16],[70,25],[62,25],[58,30],[52,38],[50,46]],
          // Arabia
          [[35,30],[40,32],[48,30],[56,26],[59,22],[54,17],[48,13],[43,13],[40,20],[36,25]],
          // Australia
          [[114,-22],[122,-18],[130,-12],[137,-11],[143,-12],[147,-18],[151,-24],[153,-28],[150,-37],[143,-39],[137,-36],[130,-32],[123,-34],[116,-35],[113,-29]],
          // Groenlandia
          [[-45,60],[-30,61],[-18,68],[-20,76],[-32,82],[-48,81],[-55,73],[-52,65]],
          // Japon
          [[131,33],[137,36],[142,42],[140,37],[134,33]],
          // Indonesia
          [[95,2],[108,-1],[120,-2],[131,-3],[120,-6],[105,-5]],
          // Reino Unido / Irlanda
          [[-6,50],[-2,52],[-3,57],[-6,58],[-7,54]],
          // Madagascar
          [[44,-13],[48,-16],[50,-23],[47,-25],[44,-19]],
          // Nueva Zelanda
          [[166,-44],[172,-41],[175,-37],[177,-40],[172,-44],[168,-46]],
        ];
        continents.forEach((c, i) => drawLand(c, i % 2 ? G2 : G1));

        // desiertos (tonos tierra)
        drawLand([[-12,16],[5,28],[28,28],[33,22],[25,15],[5,13],[-10,14]], TAN); // Sahara
        drawLand([[36,28],[48,28],[56,24],[52,16],[44,14],[39,20]], TAN);         // Arabia
        drawLand([[120,-22],[136,-20],[141,-29],[130,-31],[121,-29]], TAN);       // centro de Australia

        // casquetes polares con borde irregular
        x.fillStyle = "rgba(243,247,255,0.94)";
        x.fillRect(0, 0, 512, 12);    // Artico
        x.fillRect(0, 240, 512, 16);  // Antartida
        for (let i = 0; i < 70; i++) {
          x.beginPath(); x.arc(Math.random() * 512, 12, 3 + Math.random() * 7, 0, 7); x.fill();
          x.beginPath(); x.arc(Math.random() * 512, 240, 4 + Math.random() * 8, 0, 7); x.fill();
        }
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace || undefined;
    return t;
  }

  function makeGlow() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const x = cv.getContext("2d");
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,220,120,0.9)");
    g.addColorStop(0.25, "rgba(255,180,60,0.45)");
    g.addColorStop(0.6, "rgba(255,120,30,0.12)");
    g.addColorStop(1, "rgba(255,120,30,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  }

  // ========================= TEXTURAS REALES (imagenes) =========================
  const _texLoader = new THREE.TextureLoader();
  function loadTexture(dataURI) {
    const t = _texLoader.load(dataURI);
    t.colorSpace = THREE.SRGBColorSpace || undefined;
    t.anisotropy = 4;
    return t;
  }
  // usa la imagen real de TEX si existe; si no, una textura procedural de respaldo
  function bodyTexture(b) {
    const key = b.tex || b.id;
    if (typeof TEX !== "undefined" && TEX[key]) return loadTexture(TEX[key]);
    return makeTexture(b);
  }

  // ========================= ESCALA VISUAL =========================
  function visualRadius(body) {
    if (realSize) return (body.radius_km / AU_KM) * AU_IN_UNITS; // escala 1:1 real
    if (body.id === "sol") return clamp(Math.pow(body.radius_km, 0.4) * 0.02, 2, 7);
    return clamp(Math.pow(body.radius_km, 0.4) * 0.022, 0.28, 3.2);
  }

  const SPACECRAFT_SIZE_M = {
    voyager1: 3.7, voyager2: 3.7, pioneer10: 2.7, pioneer11: 2.7,
    newhorizons: 2.5,
    parker: 3.4, solarorbiter: 4.5, bepicolombo: 4.2,
    akatsuki: 2.5,
    iss: 109, hubble: 13.2, jwst: 22, euclid: 4.0,
    odyssey: 3.2, marsexpress: 3.0, mro: 3.2, maven: 3.2,
    hope: 4.5, tianwen1: 4.8, curiosity: 3.0, perseverance: 3.0,
    dawn: 3.0, juno: 20,
  };

  function probeVisualRadius(s) {
    const size_m = s.size_m || SPACECRAFT_SIZE_M[s.id] || 3.5;
    if (realSize) {
      return ((size_m * 0.5) / 1000 / AU_KM) * AU_IN_UNITS;
    }
    return 0.18;
  }

  // Tamaño de la imagen-billboard en unidades del MUNDO (no constante en pantalla):
  // mantiene las proporciones reales (segun los metros de cada nave) y es fijo, asi que
  // se encoge con la distancia y de lejos casi no se ve, como un objeto real.
  // Sube PROBE_VIS_SCALE si las quieres mas grandes; bajalo para acercarte mas al tamaño exacto.
  const PROBE_VIS_SCALE = 0.012;   // sondas de espacio profundo / orbita solar
  function probeSizeMeters(s) { return s.size_m || SPACECRAFT_SIZE_M[s.id] || 3.5; }
  function probeSpriteSize(s) {
    // Naves que orbitan un PLANETA (ISS, Hubble, James Webb, las de Marte, Akatsuki...):
    // tamaño RELATIVO a su planeta, como un satelite. A escala real el planeta es diminuto,
    // asi que un tamaño absoluto grande lo aplastaria; lo ligamos al radio del planeta.
    if (s.parent && s.parent !== "sol" && s.solarDist_AU === undefined) {
      const parent = BODIES.find((b) => b.id === s.parent);
      const base = parent ? visualRadius(parent) : 0.001;
      const f = clamp(Math.cbrt(probeSizeMeters(s) / 15), 0.55, 1.9); // variacion suave por tamaño real
      return base * 0.42 * f;
    }
    // Espacio profundo y orbita solar: tamaño absoluto visible.
    return probeSizeMeters(s) * PROBE_VIS_SCALE;
  }

  // ========================= ETIQUETAS HTML =========================
  let labelLayer;
  function buildLabel(body) {
    const el = document.createElement("div");
    el.className = body.isMoon ? "label moon" : "label";
    el.textContent = body.name;
    labelLayer.appendChild(el);
    body.label = el;
  }

  // ========================= INICIALIZAR ESCENA =========================
  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060d);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.00002, 200000);
    camera.position.set(0, 320, 560);

    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    dom.scene.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.00002;
    controls.maxDistance = 40000;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x404060, 0.18));

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // capa de etiquetas
    labelLayer = document.createElement("div");
    labelLayer.id = "labels";
    document.body.appendChild(labelLayer);

    buildSky();
    buildStars();
    buildBodies();
    buildMoons();
    buildSpacecraft();
    updateOrbits();   // estilo de orbitas para el modo tamaño real (siempre activo)
    initPhysics();
    buildList();
    bindUI();

    window.addEventListener("resize", onResize);
  }

  // ========================= ESTRELLAS DE FONDO =========================
  function buildStars() {
    const N = 4000, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 7000 + Math.random() * 4000;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xffffff, size: 7, sizeAttenuation: true });
    scene.add(new THREE.Points(g, m));
  }

  // ========================= FONDO: VIA LACTEA =========================
  function buildSky() {
    if (typeof TEX === "undefined" || !TEX.via_lactea) return;   // si no hay textura, queda el fondo liso + estrellas
    const tex = loadTexture(TEX.via_lactea);
    const geo = new THREE.SphereGeometry(90000, 64, 40);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, fog: false });
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -1;        // se dibuja al fondo de todo
    scene.add(sky);
  }

  // ========================= CUERPOS =========================
  const unitSphere = new THREE.SphereGeometry(1, 48, 48);
  const moonSphere = new THREE.SphereGeometry(1, 24, 24);
  // circulo unitario para las orbitas de las lunas (se escala a su radio en applyMoonSize)
  const moonOrbitGeo = (function () {
    const pts = [], seg = 96;
    for (let i = 0; i < seg; i++) { const t = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t))); }
    return new THREE.BufferGeometry().setFromPoints(pts);
  })();

  // anillo con UV radiales (para usar la textura real del anillo de Saturno)
  function buildRing(b) {
    const inner = b.ring.inner, outer = b.ring.outer;
    const geo = new THREE.RingGeometry(inner, outer, 128, 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); // u: interior(0) -> exterior(1)
    }
    uv.needsUpdate = true;
    const key = b.id === "saturno" ? "anillo_saturno" : null;
    let mat;
    if (key && typeof TEX !== "undefined" && TEX[key]) {
      const rt = loadTexture(TEX[key]);
      rt.wrapS = rt.wrapT = THREE.ClampToEdgeWrapping;
      mat = new THREE.MeshBasicMaterial({ map: rt, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false });
    } else {
      mat = new THREE.MeshBasicMaterial({ color: b.ring.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false });
    }
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    return ring;
  }

  function buildBodies() {
    BODIES.forEach((b) => {
      const group = new THREE.Group();        // posicion orbital
      const tilt = new THREE.Group();          // inclinacion axial + escala de tamaño
      group.add(tilt);
      tilt.rotation.z = THREE.MathUtils.degToRad(b.axial_tilt || 0);

      const tex = bodyTexture(b);
      let mat;
      if (b.id === "sol") {
        mat = new THREE.MeshBasicMaterial({ map: tex });
      } else {
        mat = new THREE.MeshStandardMaterial({
          map: tex, roughness: 0.95, metalness: 0,
          emissive: new THREE.Color(b.color).multiplyScalar(0.05),
        });
      }
      const mesh = new THREE.Mesh(unitSphere, mat);
      tilt.add(mesh);
      b.mesh = mesh; b.tilt = tilt; b.group = group;

      // anillos
      if (b.ring) tilt.add(buildRing(b));

      // sol: luz + halo
      if (b.id === "sol") {
        const light = new THREE.PointLight(0xfff2d6, 1.6, 0, 0); // sin atenuacion
        group.add(light);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeGlow(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        b.glow = glow; group.add(glow);
      }

      // hitbox invisible para facilitar el clic (se escala en applySize)
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData.body = b;
      group.add(hit);
      hitboxes.push(hit);
      b.hit = hit;

      scene.add(group);

      // linea de orbita (circulo guia en el plano de la ecliptica)
      if (b.a_AU > 0) {
        const pts = [], R = b.a_AU * AU_IN_UNITS, seg = 256;
        for (let i = 0; i <= seg; i++) {
          const t = (i / seg) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R));
        }
        const og = new THREE.BufferGeometry().setFromPoints(pts);
        const om = new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.35 });
        b.orbit = new THREE.LineLoop(og, om);
        BODIES[0].group.add(b.orbit); // la orbita cuelga del Sol: lo sigue cuando se desplaza
      }

      buildLabel(b);
      applySize(b);
    });
  }

  function applySize(b) {
    const r = visualRadius(b);
    b.tilt.scale.setScalar(r);
    // hitbox generoso para poder pinchar cuerpos diminutos a escala real
    if (b.hit) b.hit.scale.setScalar(Math.max(r * 2.4, 2.5));
    if (b.glow) {
      const s = r * 7;
      b.glow.scale.set(s, s, 1);
    }
  }

  // ========================= REGENERAR ORBITAS =========================
  function updateOrbits() {
    BODIES.forEach((b) => {
      if (b.a_AU <= 0 || !b.orbit) return; // solo planetas con orbita
      
      // eliminar la orbita anterior
      BODIES[0].group.remove(b.orbit);

      // crear nueva orbita con propiedades ajustadas
      const pts = [], R = b.a_AU * AU_IN_UNITS, seg = 256;
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * R, 0, Math.sin(t) * R));
      }
      const og = new THREE.BufferGeometry().setFromPoints(pts);
      // mayor opacidad y grosor visual en modo tamaño real
      const opacity = realSize ? 0.65 : 0.35;
      const om = new THREE.LineBasicMaterial({ 
        color: b.color, 
        transparent: true, 
        opacity: opacity,
        linewidth: realSize ? 3 : 1
      });
      b.orbit = new THREE.LineLoop(og, om);
      BODIES[0].group.add(b.orbit);
      b.orbit.visible = showOrbits;
    });
  }

  // Redibuja la linea de orbita como la ORBITA REAL del planeta (elipse osculadora
  // a partir de su posicion y velocidad respecto al Sol). El planeta queda exactamente
  // sobre la linea aunque la fisica newtoniana lo desvie del circulo ideal.
  // Ademas el vertice 0 se clava en la posicion exacta del planeta (preciso a cualquier zoom).
  function updateOrbitEllipse(b) {
    if (!b.orbit || !b.pos) return;
    const sun = BODIES[0];
    const rx = b.pos.x - sun.pos.x, rz = b.pos.z - sun.pos.z;          // posicion relativa al Sol (UA)
    const vx = b.vel.x - sun.vel.x, vz = b.vel.z - sun.vel.z;          // velocidad relativa (UA/año)
    const r = Math.hypot(rx, rz) || 1e-9;
    const v2 = vx * vx + vz * vz;
    const mu = G * (sun.massSolar + b.massSolar);                      // parametro gravitatorio
    const a = -mu / (2 * (v2 / 2 - mu / r));                           // semieje mayor
    if (!isFinite(a) || a <= 0) return;
    const rv = rx * vx + rz * vz;
    const cc = v2 - mu / r;
    const ex = (cc * rx - rv * vx) / mu, ez = (cc * rz - rv * vz) / mu; // vector excentricidad
    const e = Math.hypot(ex, ez);
    if (e >= 0.98) return;                                             // proteccion (no eliptica)
    const omega = Math.atan2(ez, ex);                                  // direccion del periapsis
    const phiNow = Math.atan2(rz, rx);                                 // angulo actual del planeta
    const thetaNow = phiNow - omega;                                   // anomalia verdadera actual
    const p = a * (1 - e * e);                                         // semi-latus rectum
    const attr = b.orbit.geometry.attributes.position, arr = attr.array, n = attr.count;
    const dth = (Math.PI * 2) / (n - 1);
    for (let i = 0; i < n; i++) {
      const th = thetaNow + i * dth;                                   // i=0 -> el planeta exacto
      const rr = p / (1 + e * Math.cos(th));
      const phi = phiNow + i * dth;
      arr[i * 3] = Math.cos(phi) * rr * AU_IN_UNITS;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(phi) * rr * AU_IN_UNITS;
    }
    attr.needsUpdate = true;
  }

  // ========================= LUNAS =========================
  function moonVisualRadius(m) {
    if (realSize) return (m.radius_km / AU_KM) * AU_IN_UNITS;        // tamaño real 1:1
    return clamp(Math.pow(m.radius_km, 0.4) * 0.012, 0.12, 0.7);     // exagerado
  }
  function moonOrbitRadius(m) {
    if (realSize) return (m.a_km / AU_KM) * AU_IN_UNITS;             // distancia real
    return visualRadius(m.parent) * (1.7 + m.siblingIndex * 0.95);  // fuera del planeta exagerado
  }
  function applyMoonSize(m) {
    m.mesh.scale.setScalar(moonVisualRadius(m));
    m.orbitR = moonOrbitRadius(m);
    if (m.orbitLine) m.orbitLine.scale.setScalar(m.orbitR); // la orbita sigue a la luna en ambos modos
    m.hit.scale.setScalar(realSize
      ? Math.max(moonVisualRadius(m) * 3, 0.004)
      : Math.max(moonVisualRadius(m) * 2.2, 0.25));
  }

  function buildMoons() {
    BODIES.forEach((planet) => {
      if (!planet.satellites) return;
      planet.satellites.forEach((data, idx) => {
        const m = Object.assign({}, data);
        m.isMoon = true;
        m.parent = planet;
        m.type = "Satelite (luna) de " + planet.name;
        m.siblingIndex = idx;
        m.period_years = m.period_days / 365.25;
        m.phase = idx * 1.7 + 0.6;
        m.dir = m.retro ? -1 : 1;

        const group = new THREE.Group();   // posicion en el mundo (igual que los planetas)
        const mat = new THREE.MeshStandardMaterial({
          map: bodyTexture(m), roughness: 1, metalness: 0,
          emissive: new THREE.Color(m.color).multiplyScalar(0.04),
        });
        const mesh = new THREE.Mesh(moonSphere, mat);
        group.add(mesh);

        const hit = new THREE.Mesh(moonSphere,
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.userData.body = m;
        group.add(hit);
        hitboxes.push(hit);

        scene.add(group);
        m.group = group; m.mesh = mesh; m.hit = hit;

        // orbita visible de la luna: circulo en el plano de la ecliptica que cuelga
        // del grupo del planeta (lo sigue) y se escala a su radio (real o exagerado)
        const orbitLine = new THREE.LineLoop(moonOrbitGeo,
          new THREE.LineBasicMaterial({ color: m.color, transparent: true, opacity: 0.38 }));
        orbitLine.visible = showOrbits;
        planet.group.add(orbitLine);
        m.orbitLine = orbitLine;

        buildLabel(m);
        MOONS.push(m);
        applyMoonSize(m);
      });
    });
  }

  function updateMoons() {
    for (let i = 0; i < MOONS.length; i++) {
      const m = MOONS[i];
      const pp = m.parent.group.position;
      const ang = m.phase + m.dir * 2 * Math.PI * (simTime / m.period_years);
      m.group.position.set(pp.x + Math.cos(ang) * m.orbitR, pp.y, pp.z + Math.sin(ang) * m.orbitR);
    }
  }

  // ========================= SONDAS Y NAVES =========================
  // crea una textura billboard a partir de la imagen real de la nave;
  // si la imagen es una foto (fondo opaco) le desvanece los bordes para integrarla en el espacio
  function makeProbeSprite(dataURI) {
    const SZ = 256;
    const cv = document.createElement("canvas"); cv.width = cv.height = SZ;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace || undefined;
    const img = new Image();
    img.onload = () => {
      // ¿la imagen ya trae fondo transparente (render) o es una foto?
      const tc = document.createElement("canvas"); tc.width = img.width; tc.height = img.height;
      const tx = tc.getContext("2d"); tx.drawImage(img, 0, 0);
      let opaque = 0;
      [[1, 1], [img.width - 2, 1], [1, img.height - 2], [img.width - 2, img.height - 2]]
        .forEach((p) => { if (tx.getImageData(p[0], p[1], 1, 1).data[3] > 200) opaque++; });
      const isPhoto = opaque >= 3;
      const s = Math.min(SZ / img.width, SZ / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.clearRect(0, 0, SZ, SZ);
      ctx.drawImage(img, (SZ - w) / 2, (SZ - h) / 2, w, h);
      if (isPhoto) {
        ctx.globalCompositeOperation = "destination-in";
        const g = ctx.createRadialGradient(SZ / 2, SZ / 2, SZ * 0.27, SZ / 2, SZ / 2, SZ * 0.5);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, SZ, SZ);
        ctx.globalCompositeOperation = "source-over";
      }
      tex.needsUpdate = true;
    };
    img.src = dataURI;
    return tex;
  }

  function buildSpacecraft() {
    if (typeof SPACECRAFT === "undefined") return;
    // contar sondas por planeta para espaciar orbitas visuales
    const sibCount = {};
    SPACECRAFT.forEach((s) => {
      const key = (s.parent && s.parent !== "sol") ? s.parent : null;
      s.siblingIdx = key ? (sibCount[key] = (sibCount[key] || 0) + 1) - 1 : 0;
    });

    SPACECRAFT.forEach((s, idx) => {
      s.isSpacecraft = true;
      s.phase = idx * 2.1 + 0.3;
      const inactive = /inactiv/i.test(s.status);

      const group = new THREE.Group();
      const probeRadius = probeVisualRadius(s);

      // núcleo de la nave
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(1, 6, 6),
        new THREE.MeshStandardMaterial({
          color: s.color,
          roughness: 0.8,
          metalness: 0,
          emissive: 0x000000,
        })
      );
      core.scale.setScalar(Math.max(probeRadius, 0.0001));
      group.add(core);

      // billboard con la imagen real de la nave, a tamaño fijo (proporciones reales)
      if (typeof PROBE_IMG !== "undefined" && PROBE_IMG[s.id]) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: makeProbeSprite(PROBE_IMG[s.id]), transparent: true, depthWrite: false,
        }));
        const sw = probeSpriteSize(s);
        sprite.scale.set(sw, sw, 1);
        group.add(sprite);
        s.sprite = sprite; s.spriteSize = sw;
        core.visible = false; // la imagen sustituye al nucleo
      }

      // hitbox invisible para clic
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.scale.setScalar(s.sprite ? Math.max(s.spriteSize * 0.6, 0.004) : Math.max(probeRadius * 60, 1.5));
      hit.userData.body = s;
      group.add(hit); hitboxes.push(hit);

      scene.add(group);
      s.group = group; s.hit = hit;
      s.spacecraftOrbitR = 1; // se actualiza cada frame en updateSpacecraft

      buildLabel(s);
      PROBES.push(s);
    });
    bodiesAndMoons = BODIES.concat(MOONS).concat(PROBES);
  }

  function updateSpacecraft() {
    const sunPos = BODIES[0].group.position;
    for (let i = 0; i < PROBES.length; i++) {
      const s = PROBES[i];

      if (s.solarDist_AU !== undefined) {
        // Sonda interestelar — avanza lentamente desde el Sol
        const dist = (s.solarDist_AU + (s.driftPerYear_AU || 0) * simTime) * AU_IN_UNITS;
        const ang = THREE.MathUtils.degToRad(s.angle_deg || 0);
        s.group.position.set(sunPos.x + Math.cos(ang) * dist, 0, sunPos.z + Math.sin(ang) * dist);
        s.spacecraftOrbitR = dist;

      } else if (!s.parent || s.parent === "sol") {
        // Orbita el Sol
        const R = (s.a_AU || 0.1) * AU_IN_UNITS;
        const ang = s.phase + 2 * Math.PI * (simTime / (s.period_years || 1));
        s.group.position.set(sunPos.x + Math.cos(ang) * R, 0, sunPos.z + Math.sin(ang) * R);
        s.spacecraftOrbitR = R;

      } else {
        // Orbita un planeta
        const parentBody = BODIES.find((b) => b.id === s.parent);
        if (!parentBody) continue;
        const pp = parentBody.group.position;
        const realR = s.onSurface
          ? (parentBody.radius_km / AU_KM) * AU_IN_UNITS
          : (s.a_km / AU_KM) * AU_IN_UNITS;
        const minR = visualRadius(parentBody) * (3.5 + s.siblingIdx * 1.3);
        const orbitR = Math.max(realR, minR);
        s.spacecraftOrbitR = orbitR;
        const period_years = (s.period_days || 1) / 365.25;
        const ang = s.phase + 2 * Math.PI * (simTime / period_years);
        s.group.position.set(pp.x + Math.cos(ang) * orbitR, pp.y, pp.z + Math.sin(ang) * orbitR);
      }
    }
  }

  // ========================= FISICA =========================
  // ===================== POSICIONES REALES (efemerides JPL) =====================
  // Elementos keplerianos (epoca J2000) + tasa por siglo juliano. Validos ~1800-2050.
  // [valor J2000, tasa/siglo]: a(UA), e, i(grados), L=long.media, wbar=long.perihelio, Om=long.nodo
  const PLANET_ELEMENTS = {
    mercurio: { a:[0.38709927,0.00000037], e:[0.20563593,0.00001906], i:[7.00497902,-0.00594749], L:[252.25032350,149472.67411175], wbar:[77.45779628,0.16047689], Om:[48.33076593,-0.12534081] },
    venus:    { a:[0.72333566,0.00000390], e:[0.00677672,-0.00004107], i:[3.39467605,-0.00078890], L:[181.97909950,58517.81538729], wbar:[131.60246718,0.00268329], Om:[76.67984255,-0.27769418] },
    tierra:   { a:[1.00000261,0.00000562], e:[0.01671123,-0.00004392], i:[-0.00001531,-0.01294668], L:[100.46457166,35999.37244981], wbar:[102.93768193,0.32327364], Om:[0.0,0.0] },
    marte:    { a:[1.52371034,0.00001847], e:[0.09339410,0.00007882], i:[1.84969142,-0.00813131], L:[-4.55343205,19140.30268499], wbar:[-23.94362959,0.44441088], Om:[49.55953891,-0.29257343] },
    jupiter:  { a:[5.20288700,-0.00011607], e:[0.04838624,-0.00013253], i:[1.30439695,-0.00183714], L:[34.39644051,3034.74612775], wbar:[14.72847983,0.21252668], Om:[100.47390909,0.20469106] },
    saturno:  { a:[9.53667594,-0.00125060], e:[0.05386179,-0.00050991], i:[2.48599187,0.00193609], L:[49.95424423,1222.49362201], wbar:[92.59887831,-0.41897216], Om:[113.66242448,-0.28867794] },
    urano:    { a:[19.18916464,-0.00196176], e:[0.04725744,-0.00004397], i:[0.77263783,-0.00242939], L:[313.23810451,428.48202785], wbar:[170.95427630,0.40805281], Om:[74.01692503,0.04240589] },
    neptuno:  { a:[30.06992276,0.00026291], e:[0.00859048,0.00005105], i:[1.77004347,0.00035372], L:[-55.12002969,218.45945325], wbar:[44.96476227,-0.32241464], Om:[131.78422574,-0.00508664] },
  };

  // Estado real (posicion + velocidad heliocentricas) proyectado al plano de la ecliptica (UA, UA/año).
  function realPlanetState(el, T) {
    const D = Math.PI / 180;
    const a = el.a[0] + el.a[1] * T, e = el.e[0] + el.e[1] * T;
    const I = (el.i[0] + el.i[1] * T) * D;
    const L = el.L[0] + el.L[1] * T, wbar = el.wbar[0] + el.wbar[1] * T;
    const Om = (el.Om[0] + el.Om[1] * T) * D;
    const omega = wbar * D - Om;                                       // argumento del perihelio
    let M = ((((L - wbar) % 360) + 540) % 360 - 180) * D;              // anomalia media (rad)
    let E = M + e * Math.sin(M);                                       // ecuacion de Kepler
    for (let k = 0; k < 12; k++) {
      const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE; if (Math.abs(dE) < 1e-10) break;
    }
    const bb = Math.sqrt(1 - e * e);
    const xp = a * (Math.cos(E) - e), yp = a * bb * Math.sin(E);       // plano orbital (UA)
    const n = 2 * Math.PI / Math.pow(a, 1.5), Edot = n / (1 - e * Math.cos(E));
    const xpd = -a * Math.sin(E) * Edot, ypd = a * bb * Math.cos(E) * Edot;
    const cw = Math.cos(omega), sw = Math.sin(omega), cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(I);
    const m11 = cw * cO - sw * sO * ci, m12 = -sw * cO - cw * sO * ci;
    const m21 = cw * sO + sw * cO * ci, m22 = -sw * sO + cw * cO * ci;
    return { px: m11 * xp + m12 * yp, pz: m21 * xp + m22 * yp, vx: m11 * xpd + m12 * ypd, vz: m21 * xpd + m22 * ypd };
  }
  // Siglos julianos desde J2000 hasta AHORA (se recalcula al abrir la pagina -> siempre el momento real).
  const T_NOW = (Date.now() / 86400000 + 2440587.5 - 2451545.0) / 36525;

  function initPhysics() {
    BODIES.forEach((b, i) => {
      b.massSolar = b.mass_kg / SUN_MASS;
      if (b.a_AU === 0) {
        b.pos = new THREE.Vector3(0, 0, 0);
        b.vel = new THREE.Vector3(0, 0, 0);
      } else {
        const el = PLANET_ELEMENTS[b.id];
        if (el) {
          const s = realPlanetState(el, T_NOW);   // posicion y velocidad reales de HOY
          b.pos = new THREE.Vector3(s.px, 0, s.pz);
          b.vel = new THREE.Vector3(s.vx, 0, s.vz);
        } else {
          const a = b.a_AU, th = i * 2.39996323;  // respaldo: reparto circular
          b.pos = new THREE.Vector3(Math.cos(th) * a, 0, Math.sin(th) * a);
          const v = Math.sqrt(G / a);
          b.vel = new THREE.Vector3(-Math.sin(th) * v, 0, Math.cos(th) * v);
        }
      }
    });
    // fijar el baricentro: la velocidad del Sol cancela el momento total
    const sun = BODIES[0];
    const p = new THREE.Vector3();
    BODIES.forEach((b) => { if (b !== sun) p.addScaledVector(b.vel, b.massSolar); });
    sun.vel.copy(p).multiplyScalar(-1 / sun.massSolar);

    syncMeshes();
  }

  const _acc = BODIES.map(() => new THREE.Vector3());
  function computeAcc(out) {
    for (let i = 0; i < BODIES.length; i++) out[i].set(0, 0, 0);
    for (let i = 0; i < BODIES.length; i++) {
      for (let j = i + 1; j < BODIES.length; j++) {
        const dx = BODIES[j].pos.x - BODIES[i].pos.x;
        const dy = BODIES[j].pos.y - BODIES[i].pos.y;
        const dz = BODIES[j].pos.z - BODIES[i].pos.z;
        const d2 = dx * dx + dy * dy + dz * dz + 1e-9;
        const invD3 = 1 / (d2 * Math.sqrt(d2));
        const f = G * invD3;
        out[i].x += f * BODIES[j].massSolar * dx;
        out[i].y += f * BODIES[j].massSolar * dy;
        out[i].z += f * BODIES[j].massSolar * dz;
        out[j].x -= f * BODIES[i].massSolar * dx;
        out[j].y -= f * BODIES[i].massSolar * dy;
        out[j].z -= f * BODIES[i].massSolar * dz;
      }
    }
  }

  const _acc2 = BODIES.map(() => new THREE.Vector3());
  function stepVerlet(dt) {
    computeAcc(_acc);
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i];
      b.pos.x += b.vel.x * dt + 0.5 * _acc[i].x * dt * dt;
      b.pos.y += b.vel.y * dt + 0.5 * _acc[i].y * dt * dt;
      b.pos.z += b.vel.z * dt + 0.5 * _acc[i].z * dt * dt;
    }
    computeAcc(_acc2);
    for (let i = 0; i < BODIES.length; i++) {
      const b = BODIES[i];
      b.vel.x += 0.5 * (_acc[i].x + _acc2[i].x) * dt;
      b.vel.y += 0.5 * (_acc[i].y + _acc2[i].y) * dt;
      b.vel.z += 0.5 * (_acc[i].z + _acc2[i].z) * dt;
    }
  }

  function syncMeshes() {
    BODIES.forEach((b) => {
      b.group.position.set(b.pos.x * AU_IN_UNITS, b.pos.y * AU_IN_UNITS, b.pos.z * AU_IN_UNITS);
    });
  }

  // ========================= LISTA DE CUERPOS =========================
  function makeListItem(b, isMoon) {
    const li = document.createElement("li");
    if (isMoon) li.className = "moon-item";
    li.innerHTML = `<span class="dot" style="background:#${b.color.toString(16).padStart(6, "0")}"></span>${b.name}`;
    li.addEventListener("click", () => selectBody(b));
    b.li = li;
    return li;
  }
  function buildList() {
    BODIES.forEach((b) => {
      dom.list.appendChild(makeListItem(b, false));
      MOONS.filter((m) => m.parent === b).forEach((m) => dom.list.appendChild(makeListItem(m, true)));
    });
    if (PROBES.length) {
      const hdr = document.createElement("li");
      hdr.className = "list-section"; hdr.dataset.section = "probes";
      hdr.textContent = "🛸 Sondas y naves";
      dom.list.appendChild(hdr);
      PROBES.forEach((s) => {
        const li = document.createElement("li");
        li.className = "probe-item";
        const hex = s.color.toString(16).padStart(6, "0");
        li.innerHTML = `<span class="dot probe-dot" style="background:#${hex}"></span>${s.name}`;
        li.addEventListener("click", () => selectBody(s));
        s.li = li; dom.list.appendChild(li);
      });
    }
  }

  // ========================= PANEL DE INFORMACION =========================
  function showInfo(b) {
    dom.infoName.textContent = b.name;
    dom.infoType.textContent = b.type;
    dom.infoFact.textContent = b.fact;

    const M = [];
    if (b.isSpacecraft) {
      M.push({ k: "Agencia", v: b.agency || "—", wide: true });
      M.push({ k: "Lanzamiento", v: b.launched || "—", wide: true });
      M.push({ k: "Estado", v: b.status || "—", wide: true });
      if (b.solarDist_AU !== undefined) {
        const cur = b.solarDist_AU + (b.driftPerYear_AU || 0) * simTime;
        M.push({ k: "Distancia al Sol", v: `~${cur.toFixed(1)} UA`, wide: true });
        M.push({ k: "= miles de M. km", v: `${(cur * 149.598).toFixed(0)}`, wide: true });
      }
      if (b.parent && b.parent !== "sol") {
        const pb = BODIES.find((bd) => bd.id === b.parent);
        if (pb) {
          M.push({ k: "Orbita", v: pb.name, wide: true });
          if (b.onSurface) {
            M.push({ k: "Ubicacion", v: "Superficie", wide: true });
          } else if (b.a_km) {
            M.push({ k: "Altitud media", v: `${fmtNum(Math.round(b.a_km - pb.radius_km))} km` });
            M.push({ k: "Radio orbital", v: `${fmtNum(Math.round(b.a_km))} km` });
          }
          if (b.period_days) M.push({ k: "Periodo", v: b.period_days < 1 ? `${(b.period_days * 24).toFixed(1)} h` : `${b.period_days.toFixed(2)} dias` });
        }
      } else if (b.parent === "sol" && b.a_AU) {
        M.push({ k: "Dist. media al Sol", v: `${b.a_AU.toFixed(3)} UA`, wide: true });
        if (b.period_years) M.push({ k: "Periodo orbital", v: b.period_years < 1 ? `${Math.round(b.period_years * 365.25)} dias` : `${b.period_years.toFixed(2)} años` });
      }
    } else if (b.isMoon) {
      if (b.gravity) M.push({ k: "Gravedad superficial", v: `${b.gravity} m/s²`, wide: true });
      if (b.mass_kg) M.push({ k: "Masa", v: fmtMass(b.mass_kg), wide: true });
      M.push({ k: "Radio", v: `${fmtNum(b.radius_km)} km` });
      M.push({ k: "Diametro", v: `${fmtNum(Math.round(b.radius_km * 2))} km` });
      M.push({ k: "Planeta", v: b.parent.name, wide: true });
      M.push({ k: "Distancia al planeta", v: `${fmtNum(Math.round(b.a_km))} km`, wide: true });
      M.push({ k: "Periodo orbital", v: b.period_days < 1 ? `${(b.period_days * 24).toFixed(1)} h` : `${b.period_days.toFixed(2)} días` });
      if (b.retro) M.push({ k: "Sentido", v: "retrogrado" });
    } else {
      M.push({ k: "Gravedad superficial", v: `${b.gravity} m/s²`, wide: true });
      if (b.id !== "sol") M.push({ k: "vs. gravedad terrestre", v: `${(b.gravity / 9.807).toFixed(2)} × g`, wide: true });
      M.push({ k: "Masa", v: fmtMass(b.mass_kg), wide: true });
      M.push({ k: "Radio", v: `${fmtNum(b.radius_km)} km` });
      M.push({ k: "Diametro", v: `${fmtNum(Math.round(b.radius_km * 2))} km` });
      if (b.a_AU > 0) {
        M.push({ k: "Distancia al Sol", v: `${b.a_AU.toFixed(3)} UA`, });
        M.push({ k: "= millones de km", v: `${(b.a_AU * 149.6).toFixed(1)}` });
        M.push({ k: "Periodo orbital", v: b.orbital_period });
        M.push({ k: "Vel. orbital", v: `${b.orbital_velocity} km/s` });
        M.push({ k: "Excentricidad", v: b.eccentricity.toFixed(4) });
      }
      M.push({ k: "Rotacion", v: b.rotation_period });
      M.push({ k: "Inclinacion eje", v: `${b.axial_tilt}°` });
      M.push({ k: b.id === "sol" ? "Temp. superficie" : "Temp. media", v: `${fmtNum(b.mean_temp_C)} °C` });
      if (b.id !== "sol") {
        const enSim = b.satellites ? b.satellites.length : 0;
        M.push({ k: "Lunas", v: enSim && enSim !== b.moons ? `${fmtNum(b.moons)} (${enSim} en 3D)` : fmtNum(b.moons) });
      }
    }

    const probeImg = (b.isSpacecraft && typeof PROBE_IMG !== "undefined" && PROBE_IMG[b.id]) ? PROBE_IMG[b.id] : null;
    dom.infoGrid.innerHTML =
      (probeImg ? `<img class="info-img" src="${probeImg}" alt="${b.name}" />` : "") +
      M.map((x) =>
        `<div class="metric${x.wide ? " wide" : ""}"><span class="k">${x.k}</span><span class="v">${x.v}</span></div>`
      ).join("");

    dom.info.classList.remove("hidden");
  }

  function selectBody(b) {
    selected = b;
    bodiesAndMoons.forEach((x) => x.li && x.li.classList.toggle("active", x === b));
    showInfo(b);
    focusBody(b);
  }

  // ========================= CAMARA: VUELO Y SEGUIMIENTO =========================
  function focusBody(b) {
    followBody = b;
    const dist = b.isSpacecraft ? Math.max((b.spriteSize || 0.1) * 4.5, 0.0015)
      : Math.max((b.isMoon ? moonVisualRadius(b) : visualRadius(b)) * 3.5, 0.0025);
    const dir = camera.position.clone().sub(controls.target).normalize();
    flight = {
      camFrom: camera.position.clone(),
      tgtFrom: controls.target.clone(),
      getTgt: () => b.group.position.clone(),
      getCam: () => b.group.position.clone().add(dir.clone().multiplyScalar(dist)),
      t: 0,
    };
  }

  function overview() {
    followBody = null; selected = null;
    bodiesAndMoons.forEach((x) => x.li && x.li.classList.remove("active"));
    dom.info.classList.add("hidden");
    const camTo = new THREE.Vector3(0, 320, 560), tgtTo = new THREE.Vector3(0, 0, 0);
    flight = {
      camFrom: camera.position.clone(),
      tgtFrom: controls.target.clone(),
      getTgt: () => tgtTo, getCam: () => camTo, t: 0,
    };
  }

  function updateCamera(dt) {
    if (flight) {
      flight.t += dt / 0.9;
      const k = easeInOut(clamp(flight.t, 0, 1));
      camera.position.lerpVectors(flight.camFrom, flight.getCam(), k);
      controls.target.lerpVectors(flight.tgtFrom, flight.getTgt(), k);
      if (flight.t >= 1) { flight = null; if (followBody) prevFollow.copy(followBody.group.position); }
    } else if (followBody) {
      const tgt = followBody.group.position;
      camera.position.add(tgt.clone().sub(prevFollow));
      controls.target.copy(tgt);
      prevFollow.copy(tgt);
    }
  }

  // ========================= INTERACCION (CLIC) =========================
  let downX = 0, downY = 0;
  function onPointerDown(e) { downX = e.clientX; downY = e.clientY; }
  function onPointerUp(e) {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return; // fue un arrastre
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitboxes, false);
    if (hits.length) selectBody(hits[0].object.userData.body);
  }

  // ========================= UI =========================
  function bindUI() {
    dom.play.addEventListener("click", () => {
      running = !running;
      dom.play.textContent = running ? "⏸ Pausar" : "▶ Reanudar";
    });
    dom.reset.addEventListener("click", overview);
    dom.infoClose.addEventListener("click", () => {
      dom.info.classList.add("hidden");
      selected = null;
      bodiesAndMoons.forEach((x) => x.li && x.li.classList.remove("active"));
    });
    dom.speed.addEventListener("input", () => {
      const p = parseFloat(dom.speed.value) / 1000;  // 0 .. 1
      speed = Math.pow(10, p * 9);                    // 1 .. 1e9 (× tiempo real)
      dom.speedVal.textContent = formatRate(speed);
    });
    dom.speedVal.textContent = formatRate(speed);
    dom.tOrbits.addEventListener("change", () => {
      showOrbits = dom.tOrbits.checked;
      BODIES.forEach((b) => { if (b.orbit) b.orbit.visible = showOrbits; });
      MOONS.forEach((m) => { if (m.orbitLine) m.orbitLine.visible = showOrbits; });
    });
    dom.tLabels.addEventListener("change", () => {
      showLabels = dom.tLabels.checked;
      labelLayer.style.display = showLabels ? "block" : "none";
    });
    if (dom.search) dom.search.addEventListener("input", () => {
      const q = normalize(dom.search.value.trim());
      bodiesAndMoons.forEach((b) => {
        if (b.li) b.li.style.display = (!q || normalize(b.name).includes(q)) ? "" : "none";
      });
      // ocultar/mostrar el cabecero de la seccion sondas
      const hdr = document.querySelector('#body-list-items li.list-section[data-section="probes"]');
      if (hdr) hdr.style.display = q ? "none" : "";
    });
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ========================= ETIQUETAS: PROYECCION =========================
  const _v = new THREE.Vector3();
  function placeLabel(b, isMoon, W, H) {
    _v.copy(b.group.position).project(camera);
    let visible = _v.z < 1;
    // las etiquetas de lunas solo se muestran al acercarse a su planeta (evita saturar)
    if (visible && isMoon && camera.position.distanceTo(b.group.position) > b.orbitR * 70) visible = false;
    b.label.style.display = visible ? "block" : "none";
    if (!visible) return;
    const x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
    b.label.style.transform = `translate(-50%,-140%) translate(${x}px,${y}px)`;
  }
  function updateLabels() {
    if (!showLabels) return;
    const W = window.innerWidth, H = window.innerHeight;
    BODIES.forEach((b) => placeLabel(b, false, W, H));
    MOONS.forEach((m) => placeLabel(m, true, W, H));
    PROBES.forEach((s) => {
      _v.copy(s.group.position).project(camera);
      let vis = _v.z < 1;
      if (vis) {
        const d = camera.position.distanceTo(s.group.position);
        const thr = Math.max(s.spacecraftOrbitR * 80, 15);
        if (d > thr) vis = false;
      }
      s.label.style.display = vis ? "block" : "none";
      if (!vis) return;
      const lx = (_v.x * 0.5 + 0.5) * W, ly = (-_v.y * 0.5 + 0.5) * H;
      s.label.style.transform = `translate(-50%,-140%) translate(${lx}px,${ly}px)`;
    });
  }

  // ========================= BUCLE PRINCIPAL =========================
  function animate() {
    requestAnimationFrame(animate);
    const real = Math.min(clock.getDelta(), 0.05);

    // ---- fisica ----
    if (running && speed > 0) {
      const simYears = (speed * real) / SEC_PER_YEAR;
      simTime += simYears;
      const n = Math.min(Math.ceil(simYears / DT_MAX), 1500);
      const dt = simYears / n;
      for (let k = 0; k < n; k++) stepVerlet(dt);
      syncMeshes();
      // rotacion estetica sobre el eje
      BODIES.forEach((b) => {
        const dir = (b.id === "venus" || b.id === "urano") ? -1 : 1;
        const sp = /gigante/i.test(b.type) ? 0.8 : 0.35;
        b.mesh.rotation.y += dir * sp * simYears * 3;
      });
    }

    updateMoons();
    updateSpacecraft();
    BODIES.forEach(updateOrbitEllipse);   // la linea de orbita sigue la orbita real del planeta
    updateCamera(real);
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  }

  // ========================= ARRANQUE =========================
  initScene();
  // seleccionar la Tierra por defecto para mostrar el panel
  const earth = BODIES.find((b) => b.id === "tierra");
  if (earth) showInfo(earth);
  animate();

  // ocultar el loader
  setTimeout(() => dom.loader.classList.add("hidden"), 350);
})();
