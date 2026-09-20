/* =========================================================
   1. AWWWARDS SYSTEM BOOT PRELOADER
   ========================================================= */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const numElem = document.getElementById('loader-num');
  const fillElem = document.getElementById('loader-fill');
  const logElem = document.getElementById('loader-log');

  const logs = [
    "INITIALIZING KINEMATIC SOLVER...",
    "CALIBRATING 6-AXIS INDUSTRIAL ROBOT...",
    "MOUNTING END-EFFECTOR SPOT WELD GUN...",
    "SYNCING BECKHOFF TWINCAT 3 I/O RACK...",
    "CHECKING CLASH DETECTION ENVELOPE...",
    "SYSTEM CALIBRATION COMPLETE // 100%"
  ];

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 3;
    if (progress > 100) progress = 100;

    numElem.innerText = progress.toString().padStart(3, '0') + '%';
    fillElem.style.width = progress + '%';

    const logIndex = Math.min(Math.floor((progress / 100) * logs.length), logs.length - 1);
    logElem.innerText = logs[logIndex];

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('loaded');
      }, 350);
    }
  }, 45);
}

/* =========================================================
   2. CONTEXTUAL MAGNETIC PHYSICS CURSOR
   ========================================================= */
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

function initMagneticCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  // Lerp Physics Loop (60-120fps)
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Contextual Hover Interactions
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    const type = el.getAttribute('data-cursor');
    el.addEventListener('mouseenter', () => {
      ring.className = '';
      if (type === 'drag') {
        ring.classList.add('cursor-drag');
        label.innerText = 'DRAG // ORBIT';
      } else if (type === 'toggle') {
        ring.classList.add('cursor-toggle');
      } else if (type === 'hover') {
        ring.classList.add('cursor-hover');
      }
    });

    el.addEventListener('mouseleave', () => {
      ring.className = '';
      label.innerText = '';
    });
  });
}

/* =========================================================
   3. LIVE BENGALURU IST CLOCK
   ========================================================= */
function initLiveClock() {
  const clockEl = document.getElementById('live-clock');
  function tick() {
    const now = new Date();
    // Indian Standard Time
    const istTime = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    if (clockEl) clockEl.innerText = `${istTime} IST`;
  }
  setInterval(tick, 1000);
  tick();
}

/* =========================================================
   4. THREE.JS 3D INDUSTRIAL ROBOT ENGINE
   ========================================================= */
let scene, camera, renderer;
let baseGroup, j1Group, j2Group, j3Group, weldGun;
let sparksArray = [];
let isWelding = false;
let weldTimer = 0;

function initThreeScene() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050811, 0.035);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 3.5, 7.5);
  camera.lookAt(0, 1.5, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.3);
  keyLight.position.set(5, 8, 5);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x2563eb, 1.5, 20);
  fillLight.position.set(-4, 3, -2);
  scene.add(fillLight);

  // Industrial Grid Floor
  const gridHelper = new THREE.GridHelper(18, 24, 0x00f0ff, 0x1e294b);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // Robot Material Definitions
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.8
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    roughness: 0.2,
    metalness: 0.9
  });

  // Base Pedestal
  baseGroup = new THREE.Group();
  scene.add(baseGroup);

  const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 32);
  const pedestal = new THREE.Mesh(pedestalGeo, metalMaterial);
  pedestal.position.y = 0.2;
  baseGroup.add(pedestal);

  // J1 Turntable (Yaw)
  j1Group = new THREE.Group();
  j1Group.position.y = 0.4;
  baseGroup.add(j1Group);

  const j1BodyGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.6, 32);
  const j1Body = new THREE.Mesh(j1BodyGeo, accentMaterial);
  j1Body.position.y = 0.3;
  j1Group.add(j1Body);

  // J2 Shoulder (Pitch)
  j2Group = new THREE.Group();
  j2Group.position.set(0, 0.6, 0);
  j1Group.add(j2Group);

  const j2ArmGeo = new THREE.BoxGeometry(0.4, 1.8, 0.45);
  const j2Arm = new THREE.Mesh(j2ArmGeo, metalMaterial);
  j2Arm.position.y = 0.9;
  j2Group.add(j2Arm);

  // J3 Elbow (Pitch)
  j3Group = new THREE.Group();
  j3Group.position.set(0, 1.8, 0);
  j2Group.add(j3Group);

  const j3ArmGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.4, 24);
  const j3Arm = new THREE.Mesh(j3ArmGeo, metalMaterial);
  j3Arm.rotation.z = Math.PI / 2;
  j3Arm.position.x = 0.7;
  j3Group.add(j3Arm);

  // Weld Gun End-Effector
  weldGun = new THREE.Group();
  weldGun.position.set(1.4, 0, 0);
  j3Group.add(weldGun);

  const gunBodyGeo = new THREE.BoxGeometry(0.25, 0.3, 0.4);
  const gunBody = new THREE.Mesh(gunBodyGeo, accentMaterial);
  weldGun.add(gunBody);

  const electrodeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 16);
  const electrode = new THREE.Mesh(electrodeGeo, new THREE.MeshBasicMaterial({ color: 0xfff000 }));
  electrode.position.y = -0.3;
  weldGun.add(electrode);

  // BIW Sheet Panel Fixture Target
  const panelGeo = new THREE.BoxGeometry(1.6, 0.05, 1.4);
  const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
  panel.position.set(1.8, 0.8, 0);
  scene.add(panel);

  // Orbit Mouse Dragging
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => (isDragging = false));

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    scene.rotation.y += deltaX * 0.007;
    camera.position.y = Math.max(1, Math.min(6, camera.position.y - deltaY * 0.01));
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Sparks particle effect for spot weld
function triggerSparks(x, y, z) {
  const pCount = 12;
  for (let i = 0; i < pCount; i++) {
    const geo = new THREE.SphereGeometry(0.03, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const spark = new THREE.Mesh(geo, mat);
    spark.position.set(x, y, z);
    spark.userData = {
      vx: (Math.random() - 0.5) * 0.15,
      vy: Math.random() * 0.12,
      vz: (Math.random() - 0.5) * 0.15,
      life: 25
    };
    scene.add(spark);
    sparksArray.push(spark);
  }
}

function updateSparks() {
  for (let i = sparksArray.length - 1; i >= 0; i--) {
    const s = sparksArray[i];
    s.position.x += s.userData.vx;
    s.position.y += s.userData.vy;
    s.position.z += s.userData.vz;
    s.userData.vy -= 0.006;
    s.userData.life--;
    if (s.userData.life <= 0) {
      scene.remove(s);
      sparksArray.splice(i, 1);
    }
  }
}

// Main Render Loop
function animate() {
  requestAnimationFrame(animate);

  if (isWelding) {
    weldTimer += 0.016;
    document.getElementById('cycle-display').innerText = weldTimer.toFixed(2) + ' s';

    if (weldTimer < 1.0) {
      document.getElementById('stage-display').innerText = 'APPROACH SPOT #1';
      j1Group.rotation.y = THREE.MathUtils.lerp(j1Group.rotation.y, 0.4, 0.05);
      j2Group.rotation.z = THREE.MathUtils.lerp(j2Group.rotation.z, -0.3, 0.05);
      j3Group.rotation.z = THREE.MathUtils.lerp(j3Group.rotation.z, 0.5, 0.05);
    } else if (weldTimer < 2.0) {
      document.getElementById('stage-display').innerText = 'GUN CLAMP & 1.2kA CURRENT';
      if (Math.random() > 0.4) triggerSparks(1.8, 0.85, 0.2);
    } else if (weldTimer < 3.2) {
      document.getElementById('stage-display').innerText = 'INDEXING TO SPOT #2';
      j1Group.rotation.y = THREE.MathUtils.lerp(j1Group.rotation.y, 0.1, 0.05);
      j2Group.rotation.z = THREE.MathUtils.lerp(j2Group.rotation.z, -0.1, 0.05);
      if (Math.random() > 0.4) triggerSparks(1.8, 0.85, -0.2);
    } else {
      isWelding = false;
      document.getElementById('stage-display').innerText = 'CYCLE COMPLETE [PASSED]';
    }
  }

  updateSparks();
  renderer.render(scene, camera);
}

/* =========================================================
   5. INTERACTIVE JOG CONTROLS & EVENT LISTENERS
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initMagneticCursor();
  initLiveClock();
  initThreeScene();

  // Jog sliders
  const sJ1 = document.getElementById('slider-j1');
  const sJ2 = document.getElementById('slider-j2');
  const sJ3 = document.getElementById('slider-j3');

  if (sJ1) sJ1.addEventListener('input', (e) => {
    if (j1Group) j1Group.rotation.y = THREE.MathUtils.degToRad(e.target.value);
  });
  if (sJ2) sJ2.addEventListener('input', (e) => {
    if (j2Group) j2Group.rotation.z = THREE.MathUtils.degToRad(e.target.value);
  });
  if (sJ3) sJ3.addEventListener('input', (e) => {
    if (j3Group) j3Group.rotation.z = THREE.MathUtils.degToRad(e.target.value);
  });

  // Action Buttons
  const weldBtn = document.getElementById('btn-weld-cycle');
  if (weldBtn) weldBtn.addEventListener('click', () => {
    isWelding = true;
    weldTimer = 0;
  });

  const resetBtn = document.getElementById('btn-reset-robot');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    isWelding = false;
    weldTimer = 0;
    document.getElementById('cycle-display').innerText = '0.00 s';
    document.getElementById('stage-display').innerText = 'HOME READY';
    if (j1Group) j1Group.rotation.y = 0;
    if (j2Group) j2Group.rotation.z = THREE.MathUtils.degToRad(15);
    if (j3Group) j3Group.rotation.z = THREE.MathUtils.degToRad(-20);
    sJ1.value = 0;
    sJ2.value = 15;
    sJ3.value = -20;
  });

  // Modal Resume
  const modal = document.getElementById('resume-modal');
  const openModal = document.getElementById('resume-open-btn');
  const closeModal = document.getElementById('resume-close-btn');

  if (openModal) openModal.addEventListener('click', () => modal.classList.add('open'));
  if (closeModal) closeModal.addEventListener('click', () => modal.classList.remove('open'));

  // Initialize Journey & PLC logic
  showJourney(0);
  updatePlcSimulation();
});

/* =========================================================
   6. TWINCAT PLC SIMULATION ENGINE
   ========================================================= */
function updatePlcSimulation() {
  const inPart = document.getElementById('plc-in-0').checked;
  const inSafety = document.getElementById('plc-in-1').checked;
  const inStart = document.getElementById('plc-in-2').checked;

  const outInterlock = inPart && inSafety;
  const outWeld = outInterlock && inStart;
  const outHorn = outInterlock && inStart;

  // Toggle Output LEDs
  document.getElementById('led-out-0').classList.toggle('active', outInterlock);
  document.getElementById('led-out-1').classList.toggle('active', outWeld);
  document.getElementById('led-out-2').classList.toggle('active', outHorn);

  // Highlight active variables in Structured Text
  document.getElementById('st-part').classList.toggle('active-var', inPart);
  document.getElementById('st-safety').classList.toggle('active-var', inSafety);
  document.getElementById('st-start').classList.toggle('active-var', inStart);
  document.getElementById('st-interlock').classList.toggle('active-var', outInterlock);
  document.getElementById('st-weld').classList.toggle('active-var', outWeld);
}

/* =========================================================
   7. INTERACTIVE JOURNEY DATA
   ========================================================= */
const journeyData = [
  {
    title: "Trainee Engineer",
    company: "Creative Synergies Group",
    period: "Jan 2026 – Present (Current)",
    details: "Performing 3D robotic cell layout simulation for Automotive Body-in-White (BIW) production lines. Conducting robot reachability analysis, weld gun posture validation, collision clearance checks, and cycle time reduction using Siemens Process Simulate and DELMIA. Developing PLC control logic and signal mapping using Beckhoff TwinCAT."
  },
  {
    title: "Operations Intern (Robotics Data & QA)",
    company: "Instawork Services India Pvt Ltd",
    period: "Aug 2025 – Jan 2026",
    details: "Promoted across 3 operational tiers: Data Operations Associate in Robotics → Quality Analyst (QA) → Operations Intern. Managed spatial & robotic data collection pipelines, enforced quality compliance, and tracked daily SLA targets."
  },
  {
    title: "Design Engineer Intern",
    company: "Access Automation Pvt Ltd",
    period: "Apr 2025 – Jun 2025",
    details: "Engineered General Arrangement (GA) and fabrication drawings for high-precision Toshiba project test benches using AutoCAD and SolidWorks. Modeled piping and electrical layouts for the YME automation test bench."
  },
  {
    title: "Robotics & Automation Intern [AWARDED BEST INTERN]",
    company: "AB Plastomech Pvt Ltd",
    period: "Sep 2024 – Dec 2024",
    details: "Awarded 'BEST INTERN' title for exemplary engineering contributions. Designed 3D CAD models and fabrication drawings for Automated Guided Vehicles (AGVs), customized anti-static workbenches, and assembly line inspection tables in SolidWorks."
  },
  {
    title: "B.E. in Mechatronics Engineering",
    company: "AMC Engineering College (Aggregate: 80%)",
    period: "2021 – 2025",
    details: "Graduated with 80% aggregate. Built an Autonomous Aerial Ornithopter (<900g biomimetic mechanism) and an Autonomous Metal-Detecting Mobile Rover. Completed simulated EV battery engineering with Ford."
  }
];

function showJourney(idx) {
  const data = journeyData[idx];
  const card = document.getElementById('journey-card');
  if (!card) return;

  card.innerHTML = `
    <span class="rail-year">${data.period}</span>
    <h3 style="font-size: 1.8rem; margin: 6px 0;">${data.title}</h3>
    <h4 style="color: var(--cyan-primary); font-family: var(--font-mono); margin-bottom: 16px;">${data.company}</h4>
    <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6;">${data.details}</p>
  `;

  document.querySelectorAll('.rail-item').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
}