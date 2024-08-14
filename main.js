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

var makeCool,
    timeout = 1.25,
    i,
    rules = '',
    frames,
    style,
    steps = 10,
    gForce = 80,
    pX, pY,
    totalParticles = 0,
    particlesDiv = document.querySelector('.particles b'),
    fpsDiv = document.querySelector('.fps b'),
    prevTime = performance.now(),
    lastTimes = [],
    randomAnis = 111,
    particles = [];

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
}

function addParticles(count) {
    var fragment = document.createDocumentFragment(),
        part;
    for (var i = count; i--;) {
        part = document.createElement('part');
        particles.push(part)
        fragment.appendChild(part);
    }
    document.body.appendChild(fragment);
}

function jsonToCss(json) {
    var result = '{ ';
    Object.keys(json).forEach(function (key) {
        result += key + ': ' + json[key] + '; ';
    });
    result += '}';
    return result
}

var s = 2, a, x, y, ys;

for (i = randomAnis; i--;) {
    a = 2 * Math.PI * Math.random();
    x = Math.cos(a) * s;
    y = Math.sin(a) * s;

    rules += '@keyframes drop' + i + ' { \r\n';

    frames = {};

    ys = y * gForce / steps;

    for (var t = 0; t <= 100; t += 100 / steps) {
        frames[t + '%'] = {
            opacity: (Math.pow(Math.max(0, 1 - t / 100 + (t < 30 ? 0 : 1) * (Math.random() - 0.5)), 0.7)).toFixed(2),
            transform: 'translate(' + (x * t | 0) + 'px, ' + (y | 0) + 'px) scale(' + (.9 - t / 200).toFixed(1) + ')'
        }
        y += ys;
        ys += gForce / steps;
    }

    frames['100%'].opacity = '0';

    Object.keys(frames).forEach(function (val) {
        rules += '\t' + val + '  \t' + jsonToCss(frames[val]) + '\r\n';
    });
    rules += '}\r\n\r\n';
}

style = document.createElement('style');
style.innerHTML = rules;
document.head.appendChild(style);
addParticles(500);

makeCool = function (event) {
    var start = Date.now(),
        slice,
        part,
        i,
        // Adjusting for scroll offset
        x = event.clientX + window.scrollX,
        y = event.clientY + window.scrollY,
        dX = pX - x,
        dY = pY - y,
        length = Math.pow(Math.pow(dX, 2) + Math.pow(dY, 2), 0.25) | 0;

    if (particles.length < length) {
        addParticles(Math.max(length, 100) * 1.5);
    }

    slice = particles.splice(0, length);

    for (i = length; i--;) {
        part = slice[i];
        part.style.left = x + 'px';  // Aligns the particle with cursor X position
        part.style.top = y + 'px';   // Aligns the particle with cursor Y position
        part.style.webkitAnimation = 'drop' + (Math.random() * randomAnis | 0) + ' ' + timeout + 's linear';
        part.style.animation = part.style.webkitAnimation;
    }

    pX = x;
    pY = y;

    totalParticles += length;

    setTimeout(function () {
        for (i = length; i--;) {
            part = slice[i];
            part.style.webkitAnimation = '';
            part.style.animation = part.style.webkitAnimation;
        }
        particles.push.apply(particles, slice);
        slice = null;
        totalParticles -= length;
        particlesDiv.textContent = totalParticles + ',' + particles.length;
    }, timeout * 1000);
    particlesDiv.textContent = totalParticles + ',' + particles.length;
};

document.addEventListener('mouseover', function (event) {
    pX = event.clientX + window.scrollX;
    pY = event.clientY + window.scrollY;
});
document.addEventListener('mousemove', makeCool, true);

function storeFPS(ts) {
    lastTimes.push(Math.max(1, -prevTime + (prevTime = performance.now())));
    requestAnimationFrame(storeFPS);
}
requestAnimationFrame(storeFPS);

setInterval(function () {
    fpsDiv.textContent = (1000 * lastTimes.length / lastTimes.reduce(function (a, b) {
        return a + b
    })).toFixed(1);
    lastTimes = [];
}, 250);

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

// Avatar

const jeffTexture = new THREE.TextureLoader().load('/whereismyfun42/jeff.png');

const jeff = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ map: jeffTexture }));

scene.add(jeff);

// swiborg

const swiborgTexture = new THREE.TextureLoader().load('/whereismyfun42/swiborg.jpg');

const swiborg = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshStandardMaterial({
        map: swiborgTexture,
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

    renderer.render(scene, camera);
}

animate();
