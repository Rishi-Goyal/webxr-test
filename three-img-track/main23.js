import './style.css';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import * as THREE from 'three';
// import {ARButton} from 'three/addons/jsm/webxr/ARButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let hiroMarkerMesh, earthNFTMesh;

init();

async function init() {
  // Set up the scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setAnimationLoop(render);
  renderer.xr.enabled = true;
  
  const container = document.querySelector("#scene-container");
  container.appendChild(renderer.domElement);

  // Fixing the typo in HemisphereLight
  const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  ambient.position.set(0.5, 1, 0.25);
  scene.add(ambient);

  // Load image markers asynchronously
  const imgMarkerHiro = document.getElementById("imgMarkerHiro");
  const imgMarkerHiroBitmap = await createImageBitmap(imgMarkerHiro);

  const imgNFTEarth = document.getElementById("imgNFTEarth");
  const imgNFTEarthBitmap = await createImageBitmap(imgNFTEarth);
  

  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["image-tracking"],
    trackedImages: [
      {
        image: imgMarkerHiroBitmap, // reference to the bitmap image used for tracking
        widthInMeters: 0.2
      },
      {
        image: imgNFTEarthBitmap, // reference to the bitmap image used for tracking
        widthInMeters: 0.2
      }
    ],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body }

    
  });

  document.body.appendChild(button);

  // Hiro Marker Mesh
  const hiroMarkerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  hiroMarkerGeometry.translate(0, 0.1, 0);

  const hiroMarkerMaterial = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  hiroMarkerMesh = new THREE.Mesh(hiroMarkerGeometry, hiroMarkerMaterial);
  hiroMarkerMesh.name = "HiroMarkerCube";
  hiroMarkerMesh.matrixAutoUpdate = false;
  hiroMarkerMesh.visible = false;
  scene.add(hiroMarkerMesh);

  // Earth NFT Mesh
  const earthNFTGeometry = new THREE.SphereGeometry(0.2);
  earthNFTGeometry.translate(0, 0.2, 0);

  const earthNFTMaterial = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  earthNFTMesh = new THREE.Mesh(earthNFTGeometry, earthNFTMaterial);
  earthNFTMesh.name = "earthNFTSphere";
  earthNFTMesh.matrixAutoUpdate = false;
  earthNFTMesh.visible = false;
  scene.add(earthNFTMesh);
}

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getImageTrackingResults();
    for (const result of results) {
      const imageIndex = result.index;
      const referenceSpace = renderer.xr.getReferenceSpace();
      const pose = frame.getPose(result.imageSpace, referenceSpace);

      const state = result.trackingState;
      if (state == "tracked") {
        if (imageIndex == 0) {
          hiroMarkerMesh.visible = true;
          hiroMarkerMesh.matrix.fromArray(pose.transform.matrix);
        }
        if (imageIndex == 1) {
          earthNFTMesh.visible = true;
          earthNFTMesh.matrix.fromArray(pose.transform.matrix);
        }
      } else {
        hiroMarkerMesh.visible = false;
        earthNFTMesh.visible = false;
      }
    }
  }
  renderer.render(scene, camera);
}

// Handle resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);});