import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

// Lights: one warm kitchen lamp, one cool rim from the window side.
scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x1a1208, 0.35));
const lamp = new THREE.DirectionalLight(0xffd29a, 2.6);
lamp.position.set(2.5, 6, 2);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.camera.left = lamp.shadow.camera.bottom = -2.5;
lamp.shadow.camera.right = lamp.shadow.camera.top = 2.5;
lamp.shadow.radius = 6;
lamp.shadow.bias = -0.0005;
scene.add(lamp);
const rim = new THREE.PointLight(0x7f9cff, 6, 12);
rim.position.set(-3, 2.5, -3);
scene.add(rim);

// ---------- textures ----------
const loader = new THREE.TextureLoader();
function tex(name) {
  const t = loader.load(`/food/${name}.jpg`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Planar UVs from x/z so a photo lies flat on a curved surface. */
function planarUV(geom, radius, zoom = 0.85) {
  const pos = geom.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = 0.5 + (pos.getX(i) / radius) * 0.5 * zoom;
    uv[i * 2 + 1] = 0.5 - (pos.getZ(i) / radius) * 0.5 * zoom;
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geom;
}

// ---------- steel ----------
const steel = new THREE.MeshStandardMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.2 });

function lathe(points, segments = 96) {
  const g = new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
  g.computeVertexNormals();
  return g;
}

const thaliGeom = lathe([
  [0, 0],
  [1.0, 0],
  [1.1, 0.012],
  [1.18, 0.045],
  [1.24, 0.095],
  [1.27, 0.125],
  [1.275, 0.135],
  [1.255, 0.138],
  [1.2, 0.1],
  [1.12, 0.055],
  [1.03, 0.028],
  [0, 0.028],
]);

const katoriGeom = lathe([
  [0, 0],
  [0.17, 0],
  [0.235, 0.045],
  [0.268, 0.12],
  [0.278, 0.165],
  [0.268, 0.168],
  [0.256, 0.125],
  [0.225, 0.06],
  [0.16, 0.022],
  [0, 0.022],
]);

/** A shallow dome of food with a photo laid on top. */
function foodCap(radius, height, map) {
  const sphereR = (radius * radius + height * height) / (2 * height);
  const theta = Math.asin(radius / sphereR);
  const g = planarUV(new THREE.SphereGeometry(sphereR, 48, 16, 0, Math.PI * 2, 0, theta), radius);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, roughness: 0.55, metalness: 0 }));
  m.position.y = -(sphereR - height);
  m.receiveShadow = true;
  const holder = new THREE.Group();
  holder.add(m);
  return holder;
}

function katori(x, z, food) {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(katoriGeom, steel);
  bowl.castShadow = bowl.receiveShadow = true;
  g.add(bowl);
  const fill = foodCap(0.25, 0.035, tex(food));
  fill.position.y = 0.115;
  g.add(fill);
  g.position.set(x, 0.028, z);
  return g;
}

const thali = new THREE.Group();
const plate = new THREE.Mesh(thaliGeom, steel);
plate.castShadow = plate.receiveShadow = true;
thali.add(plate);

thali.add(katori(-0.62, -0.32, 'dal'));
thali.add(katori(-0.14, -0.7, 'shrikhand'));
thali.add(katori(0.4, -0.62, 'salad'));
thali.add(katori(0.72, -0.12, 'sabji'));

// Rice heap on the plate.
const rice = foodCap(0.3, 0.09, tex('rice'));
rice.position.set(0.36, 0.028, 0.4);
thali.add(rice);

// A stack of rotlis, slightly fanned.
const rotliTex = tex('rotli');
const rotliSide = new THREE.MeshStandardMaterial({ color: 0xc9995e, roughness: 0.9 });
for (let i = 0; i < 3; i++) {
  const top = new THREE.MeshStandardMaterial({ map: rotliTex, roughness: 0.85 });
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.012, 64), [rotliSide, top, rotliSide]);
  r.position.set(-0.38 + i * 0.03, 0.036 + i * 0.013, 0.36 - i * 0.02);
  r.rotation.y = i * 0.9;
  r.castShadow = r.receiveShadow = true;
  thali.add(r);
}

// Khaman pieces between rice and rotli.
const khamanTex = tex('khaman');
const khamanMat = [
  new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ map: khamanTex, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xd9ad2e, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.7 }),
];
[
  [0.0, 0.05, 0.3],
  [0.13, 0.08, -0.4],
  [-0.06, -0.1, 0.9],
].forEach(([x, z, ry]) => {
  const k = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.075, 0.13), khamanMat);
  k.position.set(x, 0.066, z);
  k.rotation.y = ry;
  k.castShadow = k.receiveShadow = true;
  thali.add(k);
});

scene.add(thali);

// Shadow catcher and a warm pool of lamp light on the table.
const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShadowMaterial({ opacity: 0.45 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,190,110,0.55)');
  grad.addColorStop(0.5, 'rgba(255,150,80,0.15)');
  grad.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 5),
  new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
);
pool.rotation.x = -Math.PI / 2;
pool.position.y = -0.002;
scene.add(pool);

// ---------- steam ----------
const STEAM = 70;
const steamGeom = new THREE.BufferGeometry();
const sPos = new Float32Array(STEAM * 3);
const sLife = new Float32Array(STEAM);
const sSeed = new Float32Array(STEAM);
const sources = [
  [-0.62, -0.32],
  [0.72, -0.12],
  [0.36, 0.4],
];
for (let i = 0; i < STEAM; i++) {
  sLife[i] = Math.random();
  sSeed[i] = Math.random();
}
steamGeom.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
steamGeom.setAttribute('life', new THREE.BufferAttribute(sLife, 1));
steamGeom.setAttribute('seed', new THREE.BufferAttribute(sSeed, 1));
const steamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: { uScale: { value: 1 } },
  vertexShader: /* glsl */ `
    attribute float life;
    attribute float seed;
    uniform float uScale;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (90.0 + 160.0 * life) * uScale / -mv.z;
      vAlpha = smoothstep(0.0, 0.2, life) * (1.0 - life) * (0.18 + 0.1 * seed);
    }`,
  fragmentShader: /* glsl */ `
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d) * vAlpha;
      gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a);
    }`,
});
const steam = new THREE.Points(steamGeom, steamMat);
thali.add(steam);

function updateSteam(dt, t) {
  for (let i = 0; i < STEAM; i++) {
    sLife[i] += dt * (0.18 + sSeed[i] * 0.12);
    if (sLife[i] > 1) sLife[i] = 0;
    const [sx, sz] = sources[i % sources.length];
    const l = sLife[i];
    sPos[i * 3] = sx + Math.sin(t * 0.8 + sSeed[i] * 20) * 0.08 * l + (sSeed[i] - 0.5) * 0.12;
    sPos[i * 3 + 1] = 0.18 + l * 1.1;
    sPos[i * 3 + 2] = sz + Math.cos(t * 0.6 + sSeed[i] * 12) * 0.06 * l;
  }
  steamGeom.attributes.position.needsUpdate = true;
  steamGeom.attributes.life.needsUpdate = true;
}

// ---------- scroll story ----------
// One camera pose per section. x = where the thali sits on wide screens, as a fraction of screen width from centre.
const POSES = [
  { cam: [0, 3.9, 5.2], look: [0, 1.75, 0], x: 0 }, // hero: thali rises from below the fold
  { cam: [0, 7.2, 2.6], look: [0, 0, 0], x: 0.25 }, // the question: behind the chat
  { cam: [0, 6.8, 0.3], look: [0, 0, 0], x: 0.24 }, // plan: top-down, the week laid out
  { cam: [0, 3.4, 4.6], look: [0, 0.1, 0], x: -0.24 }, // scaling: angled and warm
  { cam: [1.7, 2.6, 3.9], look: [0.2, 0.1, -0.1], x: 0.25 }, // balance: low over the katoris
  { cam: [0, 6.8, 0.3], look: [0, 0, 0], x: -0.24 }, // family: top-down again
  { cam: [0, 3.6, 4.8], look: [0, 0.1, 0], x: 0.24 }, // dadi
  { cam: [0, 3.6, 4.6], look: [0, 1.2, 0], x: 0 }, // final: under the closing line
];

const sections = [...document.querySelectorAll('[data-stage]')];
let stage = 0;
function readStage() {
  const mid = innerHeight / 2;
  const centers = sections.map((s) => {
    const r = s.getBoundingClientRect();
    return r.top + r.height / 2;
  });
  if (mid <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid >= centers[i] && mid <= centers[i + 1]) return i + (mid - centers[i]) / (centers[i + 1] - centers[i]);
  }
  return centers.length - 1;
}

const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

const narrow = () => innerWidth < 900;
const camPos = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / innerWidth - 0.5;
  pointer.y = e.clientY / innerHeight - 0.5;
});

function pose(s) {
  const i = Math.floor(s);
  const j = Math.min(i + 1, POSES.length - 1);
  const t = ease(s - i);
  const a = POSES[i];
  const b = POSES[j];
  let cam = lerp3(a.cam, b.cam, t);
  let look = lerp3(a.look, b.look, t);
  let x = lerp(a.x, b.x, t);
  if (narrow()) {
    // Phones: thali stays centred in the top half, copy sits below it.
    x = 0;
    cam = [cam[0], cam[1] + 1.2, cam[2] + 1.4];
    const top = s > 6 ? lerp(-1.1, -1.6, Math.min(1, s - 6)) : -1.1;
    look = [look[0], s < 0.5 ? lerp(0.9, -1.1, s * 2) : top, look[2]];
  }
  return { cam, look, x };
}

// ---------- loop ----------
function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  steamMat.uniforms.uScale.value = h / 900;
}
addEventListener('resize', resize);
resize();

const veil = document.querySelector('.veil');
const clock = new THREE.Clock();
let smooth = 0;
let spin = 0;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  stage = readStage();
  smooth = reduceMotion ? stage : lerp(smooth, stage, 1 - Math.pow(0.001, dt));

  const p = pose(smooth);
  camPos.set(p.cam[0] + pointer.x * 0.35, p.cam[1] - pointer.y * 0.2, p.cam[2]);
  lookAt.set(p.look[0], p.look[1], p.look[2]);
  camera.position.copy(camPos);
  camera.lookAt(lookAt);
  // Slide the whole picture sideways in screen space so the thali clears the copy.
  camera.setViewOffset(innerWidth, innerHeight, -p.x * innerWidth, 0, innerWidth, innerHeight);

  if (!reduceMotion) {
    spin += dt * 0.08;
    thali.rotation.y = spin;
    updateSteam(dt, t);
  }
  veil.style.opacity = narrow() && smooth > 0.6 ? '1' : '0';

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
if (reduceMotion) updateSteam(0, 0);
requestAnimationFrame(frame);

// Chat plays once when it scrolls into view.
const chat = document.querySelector('.chat');
new IntersectionObserver(
  (entries, obs) => {
    if (entries[0].isIntersecting) {
      chat.classList.add('play');
      obs.disconnect();
    }
  },
  { threshold: 0.4 },
).observe(chat);
