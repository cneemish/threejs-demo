//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for unrestricted camera rotation around the scene
import { TrackballControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/TrackballControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const container = document.getElementById("container3D");

//Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

//Keep the 3D object on a global variable so we can access it later
let object;

//TrackballControls allow the camera to move around the scene
let controls;

//Set which object to render
let objToRender = 'cycle';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//Load the file
loader.load(
  `./public/${objToRender}/scene.gltf`,
  function (gltf) {
    //If the file is loaded, add it to the scene
    object = gltf.scene;
    prepareModelMaterials(object);
    scene.add(object);

    frameObjectInView(object);
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} else {
  renderer.outputEncoding = THREE.sRGBEncoding;
}

//Add the renderer to the DOM
container.appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.set(0, 2.5, objToRender === "cycle" ? 25 : 500);

//Add lights to the scene, so we can actually see the 3D model
const topLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
topLight.position.set(500, 500, 500) //top-left-ish
topLight.castShadow = true;
scene.add(topLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
frontLight.position.set(-300, 250, 500);
scene.add(frontLight);

const ambientLight = new THREE.AmbientLight(0xffffff, objToRender === "cycle" ? 1.8 : 1);
scene.add(ambientLight);

//This adds controls to the camera, so we can rotate / zoom it with the mouse
controls = new TrackballControls(camera, renderer.domElement);
controls.noPan = true;
controls.noRotate = false;
controls.noZoom = false;
controls.minDistance = 8;
controls.maxDistance = 60;
controls.rotateSpeed = 2;
controls.zoomSpeed = 1.2;
controls.dynamicDampingFactor = 0.08;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};

function prepareModelMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) {
        return;
      }

      material.side = THREE.DoubleSide;

      if (material.map && THREE.sRGBEncoding) {
        material.map.encoding = THREE.sRGBEncoding;
      }

      material.needsUpdate = true;
    });
  });
}

function frameObjectInView(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 10;
  const fitDistance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  const viewDirection = new THREE.Vector3(0.35, 0.2, 1).normalize();

  camera.position.copy(center).addScaledVector(viewDirection, fitDistance * 1.35);
  camera.near = Math.max(fitDistance / 100, 0.01);
  camera.far = fitDistance * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = fitDistance * 0.3;
  controls.maxDistance = fitDistance * 5;
  controls.handleResize();
  controls.update();
}

function resizeRendererToContainer() {
  const { clientWidth, clientHeight } = container;

  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  controls.handleResize();
}

resizeRendererToContainer();

//Render the scene
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", resizeRendererToContainer);

//Start the 3D rendering
animate();
