import './style.css';
import * as THREE from 'three';
import { convertAniBinaryToCSS } from 'ani-cursor';

// Setup Scene, Camera, and Renderer

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
camera.position.setX(-3);

// Add Transparent Cacodemon

const transparentVideo = document.createElement('video');
transparentVideo.src = '/whereismyfun42/cacodemontransparent.webm'; // Path to your WebM video
transparentVideo.loop = true;
transparentVideo.muted = true;

function addTransparentCaco() {
  const videoClone = transparentVideo.cloneNode();
  videoClone.loop = true;
  videoClone.muted = true;

  const randomDelay = Math.random() * 2000; // Delay between 0 and 2000 milliseconds

  setTimeout(() => {
    videoClone.play();
  }, randomDelay);

  const videoTexture = new THREE.VideoTexture(videoClone);
  const spriteMaterial = new THREE.SpriteMaterial({ map: videoTexture });
  const caco = new THREE.Sprite(spriteMaterial);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  caco.position.set(x, y, z);
  caco.scale.set(2, 2, 1); // Adjust the size of the stars
  scene.add(caco);
}

// Generate Multiple Transparent Stars
Array(200).fill().forEach(addTransparentCaco);

// Particle Effects Setup

let particles = [];

function createParticles(count) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particles.push(particle);
    fragment.appendChild(particle);
  }
  document.body.appendChild(fragment);
}

function generateParticleAnimations() {
  let animationRules = '';
  const steps = 10;
  const gravity = 80;
  const numAnimations = 111;
  const size = 2;

  function jsonToCss(json) {
    return `{ ${Object.entries(json).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
  }

  for (let i = 0; i < numAnimations; i++) {
    let angle = 2 * Math.PI * Math.random();
    let x = Math.cos(angle) * size;
    let y = Math.sin(angle) * size;

    animationRules += `@keyframes drop${i} { \r\n`;

    let frames = {};
    let velocityY = y * gravity / steps;

    for (let t = 0; t <= 100; t += 100 / steps) {
      frames[`${t}%`] = {
        opacity: Math.pow(Math.max(0, 1 - t / 100 + (t < 30 ? 0 : 1) * (Math.random() - 0.5)), 0.7).toFixed(2),
        transform: `translate(${x * t}px, ${y}px) scale(${(0.9 - t / 200).toFixed(1)})`,
      };
      y += velocityY;
      velocityY += gravity / steps;
    }

    frames['100%'].opacity = '0';

    animationRules += Object.keys(frames).map(val => `\t${val}  \t${jsonToCss(frames[val])}`).join('\r\n') + '\r\n';
    animationRules += '}\r\n\r\n';
  }

  const style = document.createElement('style');
  style.innerHTML = animationRules;
  document.head.appendChild(style);
  createParticles(500);
}

// Initialize particle animations
generateParticleAnimations();

// Handle Mouse Movement and Particles

let previousX, previousY, totalParticles = 0;

function handleMouseMovement(event) {
  const x = event.clientX + window.scrollX;
  const y = event.clientY + window.scrollY;
  const deltaX = previousX - x;
  const deltaY = previousY - y;
  const distance = Math.pow(deltaX ** 2 + deltaY ** 2, 0.25) || 0;

  if (particles.length < distance) {
    createParticles(Math.max(distance, 100) * 1.5);
  }

  const slice = particles.splice(0, distance);
  slice.forEach(particle => {
    if (particle) {
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.animation = `drop${Math.floor(Math.random() * 111)} 1.25s linear`;
    }
  });

  previousX = x;
  previousY = y;
  totalParticles += distance;

  setTimeout(() => {
    slice.forEach(particle => {
      if (particle) {
        particle.style.animation = '';
      }
    });
    particles.push(...slice);
    totalParticles -= distance;
    document.querySelector('.particles b').textContent = `${totalParticles}, ${particles.length}`;
  }, 1250);

  document.querySelector('.particles b').textContent = `${totalParticles}, ${particles.length}`;
}

document.addEventListener('mouseover', event => {
  previousX = event.clientX + window.scrollX;
  previousY = event.clientY + window.scrollY;
});
document.addEventListener('mousemove', handleMouseMovement, true);

// Custom Cursors

async function applyCustomCursor(selector, aniPath) {
  try {
    const response = await fetch(aniPath);
    if (!response.ok) throw new Error('Failed to fetch cursor file');

    const data = new Uint8Array(await response.arrayBuffer());

    const style = document.createElement('style');
    style.innerText = convertAniBinaryToCSS(selector, data);

    document.head.appendChild(style);
  } catch (error) {
    console.error('Error applying cursor:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const particlesDiv = document.querySelector('.particles b');
  const fpsDiv = document.querySelector('.fps b');

  if (!particlesDiv || !fpsDiv) {
    console.error('Required DOM elements are missing');
    return;
  }

  applyCustomCursor('body', '/whereismyfun42/eyered.ani');
  applyCustomCursor('body, p, h1, h2, h3, blockquote', '/whereismyfun42/text65.ani');
  applyCustomCursor('button, a, input, textarea', '/whereismyfun42/eyeblue.ani');

  const cursorStyle = document.createElement('style');
  cursorStyle.innerHTML = `
    button, a, input, textarea {
      cursor: url('/whereismyfun42/eyeblue.ani'), auto;
    }
    body, p, h1, h2, h3, blockquote {
      cursor: url('/whereismyfun42/text65.ani'), auto;
    }
  `;
  document.head.appendChild(cursorStyle);
});

// Torus and Scene Objects

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

// Lights
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Avatar
const jeffTexture = new THREE.TextureLoader().load('/whereismyfun42/jeff.png');
const jeff = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ map: jeffTexture }));
scene.add(jeff);

// Swiborg
const swiborgTexture = new THREE.TextureLoader().load('/whereismyfun42/swiborg.jpg');
const swiborg = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({ map: swiborgTexture })
);
scene.add(swiborg);

swiborg.position.z = 30;
swiborg.position.setX(-10);

jeff.position.z = -5;
jeff.position.x = 2;

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  swiborg.rotation.x += 0.05;
  swiborg.rotation.y += 0.075;
  swiborg.rotation.z += 0.05;

  jeff.rotation.y += 0.01;
  jeff.rotation.z += 0.01;

  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

document.body.onscroll = moveCamera;
moveCamera();

// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  swiborg.rotation.x += 0.005;

  renderer.render(scene, camera);
}

animate();
