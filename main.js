import './style.css';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let hiroMarkerMesh, earthNFTMesh;
const loader = new GLTFLoader();

// UNcomment these pictures so that u can detect them in the AR (ankit)
const imageUrls = {
  hiro: [
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/conv1-bg.jpg?v=1731596970568',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/conv2-bg.jpg?v=1731596980526',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/conv3-bg.jpg?v=1731596977081',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/img4.jpg?v=1731596974043',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/conv2.jpg?v=1731597160532',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/test_img1.jpg?v=1731598220945',
    // 'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/testimg1.jpg?v=1731598475983',
    'https://cdn.glitch.global/65ebd92e-0f4c-42b3-a401-58e7acf16854/WhatsApp%20Image%202024-11-14%20at%2021.08.30_f95562cc.jpg?v=1731598775823'
  ],
  earth: ['https://th.bing.com/th/id/OIP.gmQ9F9uQzQrQbQBstNQHDAHaFj?w=800&h=600&rs=1&pid=ImgDetMain']
};

init();

async function init() {
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

  const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  ambient.position.set(0.5, 1, 0.25);
  scene.add(ambient);

  try {
    // Load and preprocess images for the Hiro marker
    const hiroImages = [];
    for (const url of imageUrls.hiro) {
      const img = document.createElement('img');
      img.src = url;
      img.crossOrigin = 'anonymous';
      await img.decode();
      const imgBitmap = await createImageBitmap(img);
      
      // Adjust `widthInMeters` for better detection
      hiroImages.push({ image: imgBitmap, widthInMeters: 0.15 });
    }

    // Load the Earth image
    const earthImg = document.createElement('img');
    earthImg.src = imageUrls.earth[0];
    earthImg.crossOrigin = 'anonymous';
    await earthImg.decode();
    const earthImageBitmap = await createImageBitmap(earthImg);

    // Create AR button with modified image tracking settings
    const button = ARButton.createButton(renderer, {
      requiredFeatures: ["image-tracking"],
      trackedImages: [
        ...hiroImages,
        { image: earthImageBitmap, widthInMeters: 0.15 }
      ],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body }
    });

    document.body.appendChild(button);

    // Create Hiro Marker Mesh (cube)
    const hiroMarkerGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    hiroMarkerGeometry.translate(0, 0.1, 0);
    const hiroMarkerMaterial = new THREE.MeshNormalMaterial({ 
      transparent: true, 
      opacity: 0.7, 
      side: THREE.DoubleSide 
    });
    hiroMarkerMesh = new THREE.Mesh(hiroMarkerGeometry, hiroMarkerMaterial);
    hiroMarkerMesh.name = "HiroMarkerCube";
    hiroMarkerMesh.matrixAutoUpdate = false;
    hiroMarkerMesh.visible = false;
    scene.add(hiroMarkerMesh);

    // Create Earth NFT Mesh (sphere)
    const earthNFTGeometry = new THREE.SphereGeometry(0.2);
    earthNFTGeometry.translate(0, 0.2, 0);
    const earthNFTMaterial = new THREE.MeshNormalMaterial({ 
      transparent: true, 
      opacity: 0.7, 
      side: THREE.DoubleSide 
    });
    earthNFTMesh = new THREE.Mesh(earthNFTGeometry, earthNFTMaterial);
    earthNFTMesh.name = "earthNFTSphere";
    earthNFTMesh.matrixAutoUpdate = false;
    earthNFTMesh.visible = false;
    scene.add(earthNFTMesh);

  } catch (error) {
    console.error('Error setting up AR:', error);
  }
}

let currentModel = null;

window.loadModel = function(modelName) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    const modelPath = `/models/cute_astronaut.glb`;

    loader.load(modelPath, (gltf) => {
        currentModel = gltf.scene;
        currentModel.visible = false;  // Start hidden
        currentModel.scale.set(0.2, 0.2, 0.2);
        currentModel.position.set(0, 0, -0.5);
        scene.add(currentModel);
        console.log("Model loaded and added to scene");
    }, undefined, (error) => {
        console.error("Error loading model:", error);
    });
};

   

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getImageTrackingResults();
    
    // Hide all meshes by default
    hiroMarkerMesh.visible = false;
    earthNFTMesh.visible = false;
    if (currentModel) currentModel.visible = false;
    
    for (const result of results) {
      const imageIndex = result.index;
      const referenceSpace = renderer.xr.getReferenceSpace();
      const pose = frame.getPose(result.imageSpace, referenceSpace);

      if (result.trackingState === "tracked" && pose) {
        // Update the appropriate mesh based on which image was tracked
        if (imageIndex < imageUrls.hiro.length) {  // Hiro marker images
          hiroMarkerMesh.visible = true;
          hiroMarkerMesh.matrix.fromArray(pose.transform.matrix);
          
          if (currentModel) {
            currentModel.visible = true;
            currentModel.matrix.fromArray(pose.transform.matrix);
            currentModel.lookAt(camera.position);
          }
        } else if (imageIndex === imageUrls.hiro.length) {  // Earth NFT
          earthNFTMesh.visible = true;
          earthNFTMesh.matrix.fromArray(pose.transform.matrix);
          
          if (currentModel) {
            currentModel.visible = true;
            currentModel.matrix.fromArray(pose.transform.matrix);
            currentModel.lookAt(camera.position);
          }
        }
      }
    }
  }
  
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
