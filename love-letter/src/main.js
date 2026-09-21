import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import lowPolyHeart from "./assets/Low_poly_heart.glb?url";

const VS = `
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vPosition = position;
  vNormal = normal;
  vUV = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FS = `
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = 1./(dot(viewDirection, vNormal) + 0.5);
  vec3 directionalTint = vec3(fresnel * vNormal * sin(dot(vPosition, vNormal)));
  vec3 colorPalette = vec3(1.0, 0.0, 0.2);
  gl_FragColor = vec4(directionalTint * colorPalette, 1.0);
}
`;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer(
  { canvas: document.getElementById("bg") }
);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
let cameraAngleOffset = -0.5;
let cameraAngle = cameraAngleOffset;
const initialCameraY = -5;
let cameraY = initialCameraY;
const minCameraDistance = 10;
const maxCameraDistance = 25;
let cameraDistance = maxCameraDistance;
const scrollSensitivity = 0.008;

renderer.render(scene, camera);

const loader = new GLTFLoader();
let heartModel;

loader.load(lowPolyHeart, function (gltf) {
  heartModel = gltf.scene;
  heartModel.scale.set(5, 5, 5);
  //heartModel.material = new THREE.MeshStandardMaterial({ color: 0xFF0000});
  heartModel.traverse((child) => {
  if (child.isMesh) {
    child.material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: VS,
      fragmentShader: FS
    });
  }
});
  scene.add(heartModel);
}, undefined, function (error) {
  console.error(error);
})
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.set(0, 0, 0)

const ambientLight = new THREE.AmbientLight(0xffffff);
const lightHelper = new THREE.PointLightHelper(pointLight);

scene.add(pointLight, ambientLight, lightHelper);

function moveCamera() {
  const t = document.body.getBoundingClientRect().top * 0.1;
  const scrollAmount = t;
  
  // Smooth rotation to the right
  cameraAngle = -t * scrollSensitivity + cameraAngleOffset;
  
  // Gradually decrease distance (get closer to heart)
  cameraDistance = Math.max(minCameraDistance, maxCameraDistance + (scrollAmount * 0.04));
  
  // Gradually increase height for cinematic upward angle
  cameraY = initialCameraY - (scrollAmount * 0.04);
}

document.body.onscroll = moveCamera

function animate() {
  requestAnimationFrame(animate);

  // Position camera in orbit around the heart
  if (heartModel) {
    const x = Math.sin(cameraAngle) * cameraDistance;
    const z = Math.cos(cameraAngle) * cameraDistance;
    camera.position.set(x, cameraY, z);
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();