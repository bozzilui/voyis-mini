import { useEffect, useRef } from "react";
import SceneInit from "../utils/SceneInit";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three";

const PointCloudViewer = ({ pointCloudData, addLog }) => {
  const containerRef = useRef();
  const guiRef = useRef();

  // Helper function to convert XYZ array to THREE.Points
  const createPointCloudFromXYZ = (points) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.flat());
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
      size: 0.005,
      vertexColors: true,
    });
    return new THREE.Points(geometry, material);
  };

  useEffect(() => {
    if (!containerRef.current || !pointCloudData) return;

    const test = new SceneInit("myThreeJsCanvas");
    test.initialize(containerRef.current);
    test.animate();

    // Convert XYZ array to THREE.Points if needed
    const pointCloud = Array.isArray(pointCloudData)
      ? createPointCloudFromXYZ(pointCloudData)
      : pointCloudData;

    // Center and scale the point cloud
    pointCloud.geometry.center();
    const box = new THREE.Box3().setFromObject(pointCloud);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5.0 / maxDim;
    pointCloud.scale.set(scale, scale, scale);

    // Get Y (height) values for color mapping
    const positions = pointCloud.geometry.attributes.position.array;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 1; i < positions.length; i += 3) {
      minY = Math.min(minY, positions[i]);
      maxY = Math.max(maxY, positions[i]);
    }

    // Create color array for vertices
    const colors = new Float32Array(positions.length);
    const colorAttribute = new THREE.BufferAttribute(colors, 3);

    // Color mapping function
    const updateColors = (lowColor, highColor) => {
      for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        const t = (y - minY) / (maxY - minY);

        const color = new THREE.Color();
        color.lerpColors(
          new THREE.Color(lowColor),
          new THREE.Color(highColor),
          t
        );

        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      colorAttribute.needsUpdate = true;
    };

    // Add colors to geometry
    pointCloud.geometry.setAttribute("color", colorAttribute);
    pointCloud.material.vertexColors = true;

    // Initial color settings
    const colorSettings = {
      lowColor: "#0000ff",
      highColor: "#ff0000",
      useAltitudeColors: true,
    };

    // Update initial colors
    updateColors(colorSettings.lowColor, colorSettings.highColor);

    test.scene.add(pointCloud);

    // GUI setup
    if (!guiRef.current) {
      const gui = new GUI({
        container: document.getElementById("gui-container"),
      });
      guiRef.current = gui;

      const colorFolder = gui.addFolder("Altitude Colors");

      colorFolder
        .add(colorSettings, "useAltitudeColors")
        .name("Color by Altitude")
        .onChange((value) => {
          pointCloud.material.vertexColors = value;
          if (!value) {
            pointCloud.material.color.set(0xffffff);
          }
          test.renderer.render(test.scene, test.camera);
        });

      colorFolder
        .addColor(colorSettings, "lowColor")
        .name("Low Altitude")
        .onChange((value) => {
          updateColors(value, colorSettings.highColor);
          test.renderer.render(test.scene, test.camera);
        });

      colorFolder
        .addColor(colorSettings, "highColor")
        .name("High Altitude")
        .onChange((value) => {
          updateColors(colorSettings.lowColor, value);
          test.renderer.render(test.scene, test.camera);
        });

      gui.add(pointCloud.material, "size", 0.001, 0.02).name("Point Size");

      const scaleControl = { scale };
      gui
        .add(scaleControl, "scale", 0.1, 10)
        .name("Model Scale")
        .onChange((value) => {
          pointCloud.scale.set(value, value, value);
          test.renderer.render(test.scene, test.camera);
        });

      // Add after existing color settings
      const filterSettings = {
        minAltitude: 0,
        maxAltitude: 0,
        // Add reset function
        resetFilters: () => {
          filterSettings.minAltitude = originalMinY;
          filterSettings.maxAltitude = originalMaxY;
          updatePointVisibility();
          // Update GUI controllers
          minAltitudeController.setValue(originalMinY);
          maxAltitudeController.setValue(originalMaxY);
        },
      };

      // Store original Y range
      const originalMinY = minY;
      const originalMaxY = maxY;

      // Initialize filter settings
      filterSettings.minAltitude = minY;
      filterSettings.maxAltitude = maxY;

      // Add function to update point visibility based on altitude
      const updatePointVisibility = () => {
        const positions = pointCloud.geometry.attributes.position.array;
        const visibility = new Float32Array(positions.length / 3);

        for (let i = 0; i < positions.length; i += 3) {
          const y = positions[i + 1];
          const visible =
            y >= filterSettings.minAltitude && y <= filterSettings.maxAltitude;
          visibility[i / 3] = visible ? 1 : 0;
        }

        pointCloud.geometry.setAttribute(
          "visible",
          new THREE.BufferAttribute(visibility, 1)
        );

        // Update shader to handle visibility
        pointCloud.material.onBeforeCompile = (shader) => {
          shader.vertexShader = `
            attribute float visible;
            ${shader.vertexShader.replace(
              "void main() {",
              `void main() {
                if (visible < 0.5) {
                  gl_Position = vec4(0.0);
                  return;
                }`
            )}
          `;
        };

        test.renderer.render(test.scene, test.camera);
      };

      // In GUI setup, add altitude filter controls
      const filterFolder = gui.addFolder("Altitude Filter");

      const minAltitudeController = filterFolder
        .add(filterSettings, "minAltitude", minY, maxY)
        .name("Min Altitude")
        .onChange(updatePointVisibility);

      const maxAltitudeController = filterFolder
        .add(filterSettings, "maxAltitude", minY, maxY)
        .name("Max Altitude")
        .onChange(updatePointVisibility);

      filterFolder.add(filterSettings, "resetFilters").name("Reset Filters");

      filterFolder.open();

      // Initialize visibility
      updatePointVisibility();

      gui.open();
      colorFolder.open();
    }

    const handleResize = () => test.onWindowResize(containerRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
    };
  }, [pointCloudData]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <canvas id="myThreeJsCanvas" style={{ display: "block" }} />
    </div>
  );
};

export default PointCloudViewer;
