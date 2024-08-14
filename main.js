import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {convertAniBinaryToCSS} from 'ani-cursor';

// Setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
});


async function applyCursor(selector, aniPath) {
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
  // Apply default cursor to the whole page
  applyCursor("body", "/whereismyfun42/eyered.ani");

  // Apply text select cursor to text elements
  applyCursor("body, p, h1, h2, h3, blockquote", "/whereismyfun42/text65.ani");
  
  // Apply button click cursor to interactive elements
  applyCursor("button, a, input, textarea", "/whereismyfun42/eyeblue.ani");

  // Add hover effect for button and link cursors directly in CSS for better control
  const style = document.createElement('style');
  style.innerHTML = `
    button, a, input, textarea {
      cursor: url('/whereismyfun42/eyeblue.ani'), auto;
    }
    body, p, h1, h2, h3, blockquote {
      cursor: url('/whereismyfun42/text65.ani'), auto;
    }
  `;
  document.head.appendChild(style);
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
camera.position.setX(-3);

renderer.render(scene, camera);

// Torus

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

// Lights

const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// Helpers

// const lightHelper = new THREE.PointLightHelper(pointLight)
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper)

// const controls = new OrbitControls(camera, renderer.domElement);

const transparentVideo = document.createElement('video');
transparentVideo.src = '/whereismyfun42/cacodemontransparent.webm'; // Path to your WebM video
transparentVideo.loop = true;
transparentVideo.muted = true;

function addTransparentCaco() {
  // Clone the video element for each sprite to allow independent control
  const videoClone = transparentVideo.cloneNode();
  videoClone.loop = true;
  videoClone.muted = true;
  
  // Delay the start of each video to desynchronize animations
  const randomDelay = Math.random() * 2000; // Delay between 0 and 2000 milliseconds
  
  setTimeout(() => {
    videoClone.play();
  }, randomDelay);

  const videoTexture = new THREE.VideoTexture(videoClone);

  const spriteMaterial = new THREE.SpriteMaterial({ map: videoTexture });
  const caco = new THREE.Sprite(spriteMaterial);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  caco.position.set(x, y, z);
  caco.scale.set(2, 2, 1); // Adjust the size of the stars
  scene.add(caco);
}

// Generate Multiple Transparent Stars
Array(200).fill().forEach(addTransparentCaco);




// Background

// Reference the textures with import.meta.url
//const spaceTexture = new THREE.TextureLoader().load('/whereismyfun42/space.jpg');
//scene.background = spaceTexture;

// Avatar

const jeffTexture = new THREE.TextureLoader().load('/whereismyfun42/jeff.png');

const jeff = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ map: jeffTexture }));

scene.add(jeff);

// swiborg

const swiborgTexture = new THREE.TextureLoader().load('/whereismyfun42/swiborg.jpg');
//const normalTexture = new THREE.TextureLoader().load('/whereismyfun42/normal.jpg');

const swiborg = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: swiborgTexture,
    //normalMap: normalTexture,
  })
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

  // controls.update();

  renderer.render(scene, camera);
}

animate();
