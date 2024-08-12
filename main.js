import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Setup

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

renderer.render(scene, camera);

// Pentagram Shader

const pentagramFragmentShader = `
  const float M_PI = 3.141592;

  // Signed distance functions
  float Box(in vec3 p, in vec3 b) {
      vec3 d = abs(p) - b;
      return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
  }

  float Cylinder(in vec3 p, in float r, in float h) {
      return max(length(p.xz) - r, abs(p.y) - h);
  }

  float Subtract(in float a, in float b) {
      return max(a, -b);
  }

  float Union(in float d1, in float d2) {
      return min(d1, d2);
  }

  float Intersect(in float d1, in float d2) {
      return max(d1, d2);
  }

  // Rotation matrices
  mat3 rotX(in float a) {
      return mat3(1.0, 0.0, 0.0,
                  0.0, cos(a), -sin(a),
                  0.0, sin(a),  cos(a));
  }

  mat3 rotY(in float a) {
      return mat3(cos(a), 0.0, sin(a),
                     0.0, 1.0, 0.0,
                 -sin(a), 0.0, cos(a));
  }

  mat3 rotZ(in float a) {
      return mat3(cos(a), -sin(a), 0.0,
                  sin(a),  cos(a), 0.0,
                     0.0,     0.0, 1.0);      
  }

  // SDF pentagram composition
  float Pentagram(in vec3 p) {
      // pentagram octagonal frame
      mat3 r1 = rotZ(0.12 * M_PI);
      mat3 r2 = rotZ(0.38 * M_PI);
      float a = Box(p * r1, vec3(0.6, 0.6, 0.15));
      float b = Box(p * r2, vec3(0.6, 0.6, 0.15));
      float c = Box(p * r1, vec3(0.7, 0.7, 0.05));
      float d = Box(p * r2, vec3(0.7, 0.7, 0.05));

      float frame = Subtract(Intersect(c, d), Intersect(a, b));

      // inside of the pentagram
      vec3 offset = vec3(0.22, 0.0, 0.0);
      float star  = Cylinder(p * rotZ(-0.5 * M_PI) + vec3(0.17, 0.0, 0.0), 0.04, 0.61);
      star = Union(star, Cylinder(p * rotZ(0.115 * M_PI) - offset, 0.04, 0.61 ));
      star = Union(star, Cylinder(p * rotZ(-.115 * M_PI) + offset, 0.04, 0.61 ));
      star = Union(star, Cylinder(p * rotZ(-0.68 * M_PI) - offset, 0.04, 0.61 ));
      star = Union(star, Cylinder(p * rotZ(-0.32 * M_PI) - offset, 0.04, 0.61 ));

      return Union(frame, star);
  }

  // Surface normal
  vec3 SurfaceNormal(in vec3 pos, in mat3 matrix) {
      vec3 eps = vec3( 0.001, 0.0, 0.0 );
      return normalize(-vec3(Pentagram((pos + eps.xyy) * matrix) - Pentagram((pos - eps.xyy) * matrix),
                             Pentagram((pos + eps.yxy) * matrix) - Pentagram((pos - eps.yxy) * matrix),
                             Pentagram((pos + eps.yyx) * matrix) - Pentagram((pos - eps.yyx) * matrix)));
  }

  // Raymarching function
  float Raymarch(in vec3 from, in vec3 to, in mat3 matrix) {
      const float MIN_DIST = 0.001;
      const float MAX_DIST = 3.0;
      const int NUM_STEPS = 50;
      float dist = MIN_DIST;
      float depth = 0.0;

      for(int i = 0; i < NUM_STEPS; ++i) {
          if(dist < MIN_DIST || depth > MAX_DIST) 
              break;

          dist  = Pentagram((from + to * depth) * matrix);
          depth += dist;

          if(depth > MAX_DIST)
              return 0.0;
      }

      return depth;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      float ratio = iResolution.x / iResolution.y;
      vec2 uv  = fragCoord.xy / iResolution.xy;
      vec2 pos = 2.0 * uv - 1.0;
      pos.x   *= ratio;

      vec3 from  = vec3(0.0, 0.0, -1.666);
      vec3 to    = normalize(vec3(pos.xy, 1.666));
      vec3 color = vec3(0.0);

      mat3 transform = rotY(iTime);

      float t = Raymarch(from, to, transform);

      if(t > 0.0) {
          vec3 p = from + t * to;
          vec3 n = SurfaceNormal(p, transform);

          vec3 tx = texture(iChannel0, p.yz + 0.1666 * iTime).xyz * n.x * 4.666;
          vec3 ty = texture(iChannel0, p.xz + 0.2666 * iTime).xyz * n.y * 3.666;
          vec3 tz = texture(iChannel0, p.xy + 0.3666 * iTime).xyz * n.z * 2.666;

          color.r  = clamp((tx + ty + tz) * 0.333, 0.0, 1.0).r;
          color.gb = vec2(0.0);
      }

      fragColor = vec4(color, 1.0);
  }
`;

const pentagramMaterial = new THREE.ShaderMaterial({
  fragmentShader: pentagramFragmentShader,
  uniforms: {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
  },
});

const pentagramGeometry = new THREE.PlaneGeometry(5, 5);

const pentagramMesh = new THREE.Mesh(pentagramGeometry, pentagramMaterial);
scene.add(pentagramMesh);

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

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

// Background

// Reference the textures with import.meta.url
//const spaceTexture = new THREE.TextureLoader().load('/whereismyfun42/space.jpg');
//scene.background = spaceTexture;

// Avatar

const jeffTexture = new THREE.TextureLoader().load('/whereismyfun42/jeff.png');

const jeff = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ map: jeffTexture }));

scene.add(jeff);

// Moon

const moonTexture = new THREE.TextureLoader().load('/whereismyfun42/moon.jpg');
const normalTexture = new THREE.TextureLoader().load('/whereismyfun42/normal.jpg');

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

scene.add(moon);

moon.position.z = 30;
moon.position.setX(-10);

jeff.position.z = -5;
jeff.position.x = 2;

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  moon.rotation.x += 0.05;
  moon.rotation.y += 0.075;
  moon.rotation.z += 0.05;

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

  // Update pentagram uniform
  pentagramMaterial.uniforms.iTime.value += 0.05;
  pentagramMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);

  moon.rotation.x += 0.005;

  // controls.update();

  renderer.render(scene, camera);
}

animate();
