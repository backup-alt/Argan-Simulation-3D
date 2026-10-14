import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gsap from 'gsap';

const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#030408');
scene.fog = new THREE.FogExp2('#030408', 0.0045);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.4, 0.75);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false;

const STATIONS = [
  { id: 0, name: 'HELIOS DYSON CORE', tag: 'STAR CORE // PRIMARY ION DRIVE (BLENDER GLB)', au: 0.0, center: new THREE.Vector3(0, 0, 0), camOffset: new THREE.Vector3(0, 2.2, 11.5), lookOffset: new THREE.Vector3(-2.2, 0.2, 0) },
  { id: 1, name: 'TERRA-TOKYO ARK', tag: 'HABITAT WORLD // LITTLEST TOKYO + SKY FAUNA', au: 1.42, center: new THREE.Vector3(34, 2, -28), camOffset: new THREE.Vector3(-6.2, 3.0, 7.5), lookOffset: new THREE.Vector3(1.8, 0.6, 0) },
  { id: 2, name: 'KRONOS SENTINEL MOON', tag: 'OUTER RELAY // RIGGED UNIT-09 MECHA DROID', au: 2.85, center: new THREE.Vector3(-38, -4, -68), camOffset: new THREE.Vector3(4.5, 2.0, 6.8), lookOffset: new THREE.Vector3(-1.4, 0.8, 0) },
  { id: 3, name: 'VALKYRIE SINGULARITY', tag: 'DEEP SPACE ANOMALY // DAMAGED HELMET ARTIFACT', au: 4.10, center: new THREE.Vector3(26, 10, -110), camOffset: new THREE.Vector3(-3.2, 0.8, 5.2), lookOffset: new THREE.Vector3(1.1, 0.2, 0) },
  { id: 4, name: 'FULL SYSTEM ORRERY', tag: 'ECLIPTIC OBSERVATORY // ALL WORLDS IN ORBIT', au: 6.50, center: new THREE.Vector3(0, 0, -45), camOffset: new THREE.Vector3(0, 78, 88), lookOffset: new THREE.Vector3(0, 0, -40) }
];

const cameraSpline = new THREE.CatmullRomCurve3(STATIONS.map(s => s.center.clone().add(s.camOffset)), false, 'catmullrom', 0.35);
const targetSpline = new THREE.CatmullRomCurve3(STATIONS.map(s => s.center.clone().add(s.lookOffset)), false, 'catmullrom', 0.35);

const starCount = 3500;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 420;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 260;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 420 - 40;
  const t = Math.random();
  starColors.set(t > 0.8 ? [1, 0.78, 0.45] : t > 0.5 ? [0.45, 0.88, 1] : [0.92, 0.95, 1], i * 3);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, opacity: 0.85 })));

[44.04, 62.0, 77.89, 113.03].forEach((radius, idx) => {
  const pts = [];
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: idx === 1 ? '#ff5e1a' : '#4af2ff', transparent: true, opacity: idx === 1 ? 0.18 : 0.25 })));
});

const flightLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cameraSpline.getPoints(240)), new THREE.LineDashedMaterial({ color: '#f5c26b', dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.28 }));
flightLine.computeLineDistances();
scene.add(flightLine);

const asteroidCount = 650;
const asteroidBelt = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: '#3a3f54', roughness: 0.85, metalness: 0.25 }), asteroidCount);
const dummy = new THREE.Object3D();
for (let i = 0; i < asteroidCount; i++) {
  const a = (i / asteroidCount) * Math.PI * 2;
  const r = 59 + (Math.random() - 0.5) * 9;
  dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 5.5, Math.sin(a) * r);
  dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  const s = 0.4 + Math.random() * 1.4;
  dummy.scale.set(s, s * 0.7, s);
  dummy.updateMatrix();
  asteroidBelt.setMatrixAt(i, dummy.matrix);
}
scene.add(asteroidBelt);

const mixers = [];
const interactiveMeshes = [];
scene.add(new THREE.PointLight('#ff9d5c', 8, 220, 0.5));
const dirLight = new THREE.DirectionalLight('#ffffff', 2.2);
dirLight.position.set(25, 45, 30);
scene.add(dirLight);

const heliosGroup = new THREE.Group();
heliosGroup.position.copy(STATIONS[0].center);
scene.add(heliosGroup);

const coronaMesh = new THREE.Mesh(new THREE.SphereGeometry(2.35, 48, 48), new THREE.MeshBasicMaterial({ color: '#ff5511', wireframe: true, transparent: true, opacity: 0.22 }));
coronaMesh.userData = { stationId: 0, label: 'HELIOS DYSON CORE // CLICK FOR SOLAR PULSE' };
heliosGroup.add(coronaMesh);
interactiveMeshes.push(coronaMesh);

const dysonRing1 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.04, 12, 96), new THREE.MeshBasicMaterial({ color: '#f5c26b' }));
const dysonRing2 = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.03, 12, 96), new THREE.MeshBasicMaterial({ color: '#4af2ff' }));
dysonRing2.rotation.x = Math.PI / 3;
heliosGroup.add(dysonRing1, dysonRing2);

const shockwaveMat = new THREE.MeshBasicMaterial({ color: '#ffaa44', side: THREE.DoubleSide, transparent: true, opacity: 0 });
const shockwaveRing = new THREE.Mesh(new THREE.RingGeometry(2.5, 2.85, 64), shockwaveMat);
shockwaveRing.rotation.x = Math.PI / 2;
heliosGroup.add(shockwaveRing);

const tokyoWorldGroup = new THREE.Group();
tokyoWorldGroup.position.copy(STATIONS[1].center);
scene.add(tokyoWorldGroup);

const planetCrust = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3.2, 9), new THREE.MeshStandardMaterial({ color: '#1b2038', roughness: 0.7, metalness: 0.3, flatShading: true }));
planetCrust.rotation.x = Math.PI;
planetCrust.position.y = -2.35;
planetCrust.userData = { stationId: 1, label: 'TERRA-TOKYO HABITAT // CLICK TO ORBIT' };
tokyoWorldGroup.add(planetCrust);
interactiveMeshes.push(planetCrust);

const atmoRing = new THREE.Mesh(new THREE.RingGeometry(4.5, 5.4, 64), new THREE.MeshBasicMaterial({ color: '#4af2ff', side: THREE.DoubleSide, transparent: true, opacity: 0.25 }));
atmoRing.rotation.x = Math.PI / 2.2;
atmoRing.position.y = -0.6;
tokyoWorldGroup.add(atmoRing);

const birdOrbitGroup = new THREE.Group();
tokyoWorldGroup.add(birdOrbitGroup);

const kronosGroup = new THREE.Group();
kronosGroup.position.copy(STATIONS[2].center);
scene.add(kronosGroup);

const moonPedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.8, 1.2, 16), new THREE.MeshStandardMaterial({ color: '#182436', roughness: 0.5, metalness: 0.6 }));
moonPedestal.position.y = -2.0;
moonPedestal.userData = { stationId: 2, label: 'KRONOS RELAY DECK // CLICK DROID TO ANIMATE' };
kronosGroup.add(moonPedestal);
interactiveMeshes.push(moonPedestal);

const moonHalo = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.05, 12, 64), new THREE.MeshBasicMaterial({ color: '#ff5e1a' }));
moonHalo.rotation.x = Math.PI / 2;
moonHalo.position.y = -1.4;
kronosGroup.add(moonHalo);

const valkyrieGroup = new THREE.Group();
valkyrieGroup.position.copy(STATIONS[3].center);
scene.add(valkyrieGroup);

const astrolabe1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.035, 16, 80), new THREE.MeshStandardMaterial({ color: '#f5c26b', metalness: 0.9, roughness: 0.1 }));
const astrolabe2 = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.025, 16, 80), new THREE.MeshBasicMaterial({ color: '#4af2ff' }));
astrolabe2.rotation.y = Math.PI / 3;
valkyrieGroup.add(astrolabe1, astrolabe2);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let ionDriveMixer = null;
let robotMixer = null;
let robotActions = {};
let activeRobotClip = null;
let helmetMeshRoot = null;
let helmetWireframe = false;

const loaderEl = document.getElementById('loader');
const loaderPct = document.getElementById('loader-pct');
const loaderLog = document.getElementById('loader-log');

const ASSET_QUEUE = [
  { name: 'PrimaryIonDrive.glb', url: 'https://threejs.org/examples/models/gltf/PrimaryIonDrive.glb', onLoad: (gltf) => { const m = gltf.scene; m.scale.setScalar(1.35); heliosGroup.add(m); if (gltf.animations[0]) { ionDriveMixer = new THREE.AnimationMixer(m); ionDriveMixer.clipAction(gltf.animations[0]).play(); mixers.push(ionDriveMixer); } } },
  { name: 'LittlestTokyo.glb', url: 'https://threejs.org/examples/models/gltf/LittlestTokyo.glb', onLoad: (gltf) => { const m = gltf.scene; m.scale.setScalar(0.0085); m.position.set(0, 0.35, 0); tokyoWorldGroup.add(m); if (gltf.animations[0]) { const mx = new THREE.AnimationMixer(m); mx.clipAction(gltf.animations[0]).play(); mixers.push(mx); } } },
  { name: 'Flamingo.glb', url: 'https://threejs.org/examples/models/gltf/Flamingo.glb', onLoad: (gltf) => { for (let i = 0; i < 3; i++) { const b = gltf.scene.clone(); b.scale.setScalar(0.018); const a = (i / 3) * Math.PI * 2; b.position.set(Math.cos(a) * 3.8, 2.2 + i * 0.4, Math.sin(a) * 3.8); b.rotation.y = -a; birdOrbitGroup.add(b); if (gltf.animations[0]) { const mx = new THREE.AnimationMixer(b); mx.clipAction(gltf.animations[0]).startAt(i * 0.35).play(); mixers.push(mx); } } } },
  { name: 'RobotExpressive.glb', url: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb', onLoad: (gltf) => { const m = gltf.scene; m.scale.setScalar(0.68); m.position.set(0, -1.4, 0); m.traverse(c => { if (c.isMesh) { c.userData = { stationId: 2, label: 'UNIT-09 DROID // CLICK TO CYCLE ANIMATION' }; interactiveMeshes.push(c); } }); kronosGroup.add(m); robotMixer = new THREE.AnimationMixer(m); gltf.animations.forEach(clip => { robotActions[clip.name] = robotMixer.clipAction(clip); }); playRobotAnimation('Wave'); mixers.push(robotMixer); } },
  { name: 'DamagedHelmet.gltf', url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf', onLoad: (gltf) => { helmetMeshRoot = gltf.scene; helmetMeshRoot.scale.setScalar(1.65); helmetMeshRoot.traverse(c => { if (c.isMesh) { c.userData = { stationId: 3, label: 'VALKYRIE ARTIFACT // CLICK FOR HOLO WIREFRAME' }; interactiveMeshes.push(c); } }); valkyrieGroup.add(helmetMeshRoot); } }
];

let loadedCount = 0;
ASSET_QUEUE.forEach(item => {
  gltfLoader.load(item.url, (gltf) => {
    item.onLoad(gltf);
    loadedCount++;
    loaderPct.textContent = String(Math.round((loadedCount / ASSET_QUEUE.length) * 100)).padStart(2, '0') + '%';
    loaderLog.textContent = 'MOUNTED IN ORBIT: ' + item.name.toUpperCase();
    if (loadedCount === ASSET_QUEUE.length) setTimeout(() => loaderEl.classList.add('done'), 350);
  }, undefined, () => {
    loadedCount++;
    if (loadedCount === ASSET_QUEUE.length) loaderEl.classList.add('done');
  });
});

const ROBOT_CYCLE = ['Dance', 'Jump', 'Punch', 'Running', 'Wave', 'ThumbsUp'];
let robotClipIdx = 0;
function playRobotAnimation(name) {
  if (!robotActions[name]) return;
  const next = robotActions[name];
  if (activeRobotClip && activeRobotClip !== next) activeRobotClip.fadeOut(0.25);
  next.reset().fadeIn(0.25).play();
  activeRobotClip = next;
}

let targetScrollProgress = 0;
let smoothScrollProgress = 0;
let activeStationIdx = 0;
let isFreeOrbit = false;

const auReadout = document.getElementById('scroll-au-readout');
const activeWorldTag = document.getElementById('active-world-tag');
const dynamicActions = document.getElementById('dynamic-actions');
const orbitLockBtn = document.getElementById('orbit-lock-btn');
const camModePill = document.getElementById('cam-mode-pill');

window.addEventListener('scroll', () => {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  targetScrollProgress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
  if (isFreeOrbit) setFreeOrbitMode(false);
}, { passive: true });

function setFreeOrbitMode(enable, focusIdx = activeStationIdx) {
  isFreeOrbit = enable;
  controls.enabled = enable;
  orbitLockBtn.classList.toggle('active', enable);
  orbitLockBtn.textContent = enable ? '360° FREE ORBIT: ON (SCROLL TO EXIT)' : '360° FREE ORBIT: OFF';
  camModePill.textContent = enable ? '360° ORBIT LOCK' : 'SCROLL FLIGHT';
  if (enable) {
    const st = STATIONS[focusIdx];
    gsap.to(controls.target, { x: st.center.x, y: st.center.y, z: st.center.z, duration: 0.9, ease: 'power3.out' });
  }
}
orbitLockBtn.addEventListener('click', () => setFreeOrbitMode(!isFreeOrbit));

const STATION_BUTTONS = {
  0: [{ label: '⚡ SOLAR OVERDRIVE PULSE', action: 'pulse-sun' }, { label: '🔄 360° INSPECT CORE', action: 'toggle-orbit' }],
  1: [{ label: '🚋 DIVE TO STREETCAR LEVEL', action: 'tokyo-street' }, { label: '🔄 360° ORBIT PLANETOID', action: 'toggle-orbit' }],
  2: [{ label: '💃 DANCE', action: 'robot-Dance' }, { label: '🚀 JUMP', action: 'robot-Jump' }, { label: '🥊 COMBAT PUNCH', action: 'robot-Punch' }, { label: '🏃 SPRINT', action: 'robot-Running' }],
  3: [{ label: '🔬 TOGGLE X-RAY HOLO SCAN', action: 'helmet-xray' }, { label: '🔄 360° INSPECT VISOR', action: 'toggle-orbit' }],
  4: [{ label: '☀ WARP TO HELIOS SUN', action: 'warp-0' }, { label: '🏙 WARP TO TERRA-TOKYO', action: 'warp-1' }, { label: '🤖 WARP TO KRONOS MOON', action: 'warp-2' }]
};

function updateStationHUD(idx) {
  if (idx === activeStationIdx && dynamicActions.children.length > 0) return;
  activeStationIdx = idx;
  document.querySelectorAll('.waypoint-btn').forEach((btn, i) => btn.classList.toggle('active', i === idx));
  activeWorldTag.textContent = STATIONS[idx].tag;
  dynamicActions.innerHTML = (STATION_BUTTONS[idx] || []).map(b => '<button class="interact-trigger" data-action="' + b.action + '">' + b.label + '</button>').join('');
  if (idx === 2) playRobotAnimation('Wave');
}

function triggerSolarPulse() {
  if (ionDriveMixer) { ionDriveMixer.timeScale = 4.0; setTimeout(() => { if (ionDriveMixer) ionDriveMixer.timeScale = 1.0; }, 2400); }
  shockwaveRing.scale.setScalar(1);
  shockwaveMat.opacity = 0.95;
  gsap.to(shockwaveRing.scale, { x: 42, y: 42, z: 42, duration: 2.2, ease: 'power2.out' });
  gsap.to(shockwaveMat, { opacity: 0, duration: 2.2, ease: 'power2.out' });
  gsap.fromTo(bloomPass, { strength: 1.45 }, { strength: 0.55, duration: 2.0 });
}

function toggleHelmetXray() {
  if (!helmetMeshRoot) return;
  helmetWireframe = !helmetWireframe;
  helmetMeshRoot.traverse(c => { if (c.isMesh && c.material) c.material.wireframe = helmetWireframe; });
}

function scrollToStation(idx) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: (idx / (STATIONS.length - 1)) * maxScroll, behavior: 'smooth' });
}

dynamicActions.addEventListener('click', (e) => {
  const btn = e.target.closest('.interact-trigger');
  if (!btn) return;
  const act = btn.dataset.action;
  if (act === 'pulse-sun') triggerSolarPulse();
  else if (act === 'toggle-orbit') setFreeOrbitMode(!isFreeOrbit);
  else if (act === 'tokyo-street') { setFreeOrbitMode(true, 1); const c = STATIONS[1].center; gsap.to(camera.position, { x: c.x + 1.8, y: c.y + 0.4, z: c.z + 2.4, duration: 1.2 }); }
  else if (act.startsWith('robot-')) playRobotAnimation(act.replace('robot-', ''));
  else if (act === 'helmet-xray') toggleHelmetXray();
  else if (act.startsWith('warp-')) scrollToStation(parseInt(act.replace('warp-', ''), 10));
});

document.querySelectorAll('.waypoint-btn').forEach(btn => btn.addEventListener('click', () => scrollToStation(parseInt(btn.dataset.stop, 10))));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const reticle = document.getElementById('cursor-reticle');
const reticleLabel = document.getElementById('reticle-label');
let hoveredStationId = null;

window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  reticle.style.left = e.clientX + 'px';
  reticle.style.top = e.clientY + 'px';
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveMeshes, false);
  if (hits.length > 0) {
    hoveredStationId = hits[0].object.userData.stationId;
    reticle.classList.add('active');
    reticleLabel.textContent = hits[0].object.userData.label || 'CLICK TO INTERACT';
    document.body.style.cursor = 'pointer';
  } else {
    hoveredStationId = null;
    reticle.classList.remove('active');
    document.body.style.cursor = 'default';
  }
});

window.addEventListener('click', (e) => {
  if (e.target.closest('header, .planet-interaction-bar, .orbital-radar, .chapter-content')) return;
  if (hoveredStationId === 0) triggerSolarPulse();
  else if (hoveredStationId === 1) setFreeOrbitMode(true, 1);
  else if (hoveredStationId === 2) { robotClipIdx = (robotClipIdx + 1) % ROBOT_CYCLE.length; playRobotAnimation(ROBOT_CYCLE[robotClipIdx]); }
  else if (hoveredStationId === 3) toggleHelmetXray();
});

const radarCanvas = document.getElementById('radar-canvas');
const rCtx = radarCanvas.getContext('2d');
function drawOrbitalRadar(elapsed) {
  const cx = 80, cy = 98, scale = 0.55;
  rCtx.clearRect(0, 0, 160, 160);
  [18, 34, 52, 68].forEach(r => { rCtx.beginPath(); rCtx.arc(cx, cy, r, 0, Math.PI * 2); rCtx.strokeStyle = 'rgba(255,255,255,0.12)'; rCtx.stroke(); });
  rCtx.beginPath(); rCtx.arc(cx, cy, 4.5, 0, Math.PI * 2); rCtx.fillStyle = '#ff5e1a'; rCtx.fill();
  STATIONS.slice(1, 4).forEach((st, i) => {
    rCtx.beginPath(); rCtx.arc(cx + st.center.x * scale, cy + st.center.z * scale, activeStationIdx === i + 1 ? 4.5 : 3, 0, Math.PI * 2);
    rCtx.fillStyle = activeStationIdx === i + 1 ? '#4af2ff' : '#f5c26b'; rCtx.fill();
  });
  rCtx.strokeStyle = '#4af2ff'; rCtx.beginPath();
  rCtx.arc(cx + camera.position.x * scale, cy + camera.position.z * scale, 4 + Math.sin(elapsed * 5) * 1.5, 0, Math.PI * 2); rCtx.stroke();
}
radarCanvas.addEventListener('click', () => scrollToStation((activeStationIdx + 1) % STATIONS.length));

let audioCtx = null, audioPlaying = false, audioNodes = [];
const audioBtn = document.getElementById('audio-btn');
audioBtn.addEventListener('click', () => {
  if (audioPlaying) {
    audioNodes.forEach(n => { try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch (_) {} });
    audioNodes = []; audioPlaying = false; audioBtn.textContent = 'SOUND: OFF'; audioBtn.classList.remove('active'); return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const master = audioCtx.createGain(); master.gain.setValueAtTime(0.12, audioCtx.currentTime); master.connect(audioCtx.destination);
  const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(480, audioCtx.currentTime); filter.connect(master);
  [65.41, 98.0, 130.81, 155.56, 196.0].forEach((freq, i) => {
    const osc = audioCtx.createOscillator(); osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.detune.setValueAtTime((i - 2) * 7, audioCtx.currentTime);
    osc.connect(filter); osc.start(); audioNodes.push(osc);
  });
  audioNodes.push(master); audioPlaying = true; audioBtn.textContent = 'SOUND: ON'; audioBtn.classList.add('active');
});

const clock = new THREE.Clock();
updateStationHUD(0);
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta(), elapsed = clock.getElapsedTime();
  mixers.forEach(m => m.update(delta));
  const vel = targetScrollProgress - smoothScrollProgress;
  smoothScrollProgress += vel * 0.065;
  updateStationHUD(Math.round(smoothScrollProgress * (STATIONS.length - 1)));
  auReadout.textContent = (smoothScrollProgress * 6.5).toFixed(2) + ' AU';
  if (!isFreeOrbit) {
    camera.position.copy(cameraSpline.getPointAt(smoothScrollProgress));
    camera.lookAt(targetSpline.getPointAt(smoothScrollProgress));
    camera.rotation.z += -vel * 1.4;
  } else {
    controls.update();
  }
  dysonRing1.rotation.z = elapsed * 0.35; dysonRing1.rotation.x = elapsed * 0.2; dysonRing2.rotation.y = -elapsed * 0.45; coronaMesh.rotation.y = elapsed * 0.15;
  birdOrbitGroup.rotation.y = elapsed * 0.45; tokyoWorldGroup.position.y = STATIONS[1].center.y + Math.sin(elapsed * 1.3) * 0.25;
  asteroidBelt.rotation.y = elapsed * 0.03;
  astrolabe1.rotation.x = elapsed * 0.4; astrolabe1.rotation.y = elapsed * 0.3; astrolabe2.rotation.z = -elapsed * 0.5;
  if (helmetMeshRoot) { helmetMeshRoot.rotation.y = pointer.x * 0.55 + Math.sin(elapsed * 0.6) * 0.2; helmetMeshRoot.rotation.x = -pointer.y * 0.35; }
  drawOrbitalRadar(elapsed);
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
