import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

export default class SceneInit {
  constructor(canvasId) {
    this.canvasId = canvasId; // The ID of the canvas container
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.gui = undefined;

    // Camera parameters
    this.fov = 45;
    this.nearPlane = 1;
    this.farPlane = 1000;

    // Additional components
    this.clock = undefined;
    this.stats = undefined;
    this.controls = undefined;

    // Lighting
    this.spotLight = undefined;
    this.ambientLight = undefined;
  }

  initialize(parentElement) {
    // Prevent multiple renderers by checking if already initialized
    if (this.renderer) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      parentElement.offsetWidth / parentElement.offsetHeight,
      this.nearPlane,
      this.farPlane
    );
    this.camera.position.z = 5;

    // Create renderer only if it doesn't already exist
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      parentElement.offsetWidth,
      parentElement.offsetHeight
    );

    // Clear any existing elements before appending
    parentElement.innerHTML = "";
    parentElement.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = Stats();

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xffffff, 1);
    this.spotLight.position.set(0, 64, 32);
    this.scene.add(this.spotLight);

    window.addEventListener(
      "resize",
      () => this.onWindowResize(parentElement),
      false
    );
  }

  onWindowResize(parentElement) {
    this.camera.aspect = parentElement.offsetWidth / parentElement.offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      parentElement.offsetWidth,
      parentElement.offsetHeight
    );
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    this.stats.update();
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
