import React, { useState } from "react";
import SideMenu from "../../components/Sidebar";
import PointCloudViewer from "../../components/PointCloudViewer";
import GISMap from "../../components/GISMap";
import * as THREE from "three";
import LogPanel from "../../components/LogPanel";
import { Box, Button, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [activeTab, setActiveTab] = useState("3D Viewer");
  const [logs, setLogs] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [pointCloudData, setPointCloudData] = useState(null);

  const addLog = (message) => setLogs((prevLogs) => [...prevLogs, message]);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    const loader = new PCDLoader();

    // Calculate file size in MB or KB
    const fileSizeInMB = file.size / (1024 * 1024);
    const fileSizeString =
      fileSizeInMB < 1
        ? `${(file.size / 1024).toFixed(2)} KB`
        : `${fileSizeInMB.toFixed(2)} MB`;

    if (file.name.endsWith(".xyz") || file.name.endsWith(".pcd")) {
      reader.onload = () => {
        if (file.name.endsWith(".pcd")) {
          loader.load(reader.result, (pointCloud) => {
            const numPoints = pointCloud.geometry.attributes.position.count;
            const boundingBox = new THREE.Box3().setFromObject(pointCloud);
            const dimensions = boundingBox.getSize(new THREE.Vector3());

            setPointCloudData(pointCloud);
            addLog(`File uploaded: ${file.name}`);
            addLog(`Number of points: ${numPoints.toLocaleString()}`);
            addLog(`File size: ${fileSizeString}`);
            addLog(`Bounding box dimensions:`);
            addLog(`  Width: ${dimensions.x.toFixed(2)} units`);
            addLog(`  Height: ${dimensions.y.toFixed(2)} units`);
            addLog(`  Depth: ${dimensions.z.toFixed(2)} units`);
          });
        } else {
          // Handle .xyz files
          const text = reader.result.trim();
          const points = text
            .split("\n")
            .map((line) => line.split(/\s+/).map(parseFloat))
            .filter(
              (point) =>
                point.length === 3 &&
                point.every((value) => isFinite(value) && !isNaN(value))
            );

          // Calculate bounding box for XYZ data
          let minX = Infinity,
            minY = Infinity,
            minZ = Infinity;
          let maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;

          points.forEach((point) => {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            minZ = Math.min(minZ, point[2]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
            maxZ = Math.max(maxZ, point[2]);
          });

          setPointCloudData(points);
          addLog(`File uploaded: ${file.name}`);
          addLog(`Number of points: ${points.length.toLocaleString()}`);
          addLog(`File size: ${fileSizeString}`);
          addLog(`Bounding box dimensions:`);
          addLog(`  Width: ${(maxX - minX).toFixed(2)} units`);
          addLog(`  Height: ${(maxY - minY).toFixed(2)} units`);
          addLog(`  Depth: ${(maxZ - minZ).toFixed(2)} units`);
        }
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith(".json")) {
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        setGeoJsonData(data);
        addLog(`GeoJSON file uploaded: ${file.name}`);
        addLog(`File size: ${fileSizeString}`);
      };
      reader.readAsText(file);
    } else {
      addLog(`Unsupported file type: ${file.name}`);
    }
  };

  return (
    <Box height="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Data Visualization" subtitle="Explore 3D and GIS data" />
      </Box>
      <Box m="20px" display="flex" flexDirection="row" height="100%">
        {/* SideMenu */}

        <SideMenu onUpload={handleFileUpload} />

        {/* Main Content */}
        <Box flex={1} display="flex" flexDirection="column">
          {/* Tabs */}
          <Box display="flex" m="5px">
            <Button
              className={`tab-button ${
                activeTab === "3D Viewer" ? "active" : ""
              }`}
              onClick={() => setActiveTab("3D Viewer")}
              sx={{
                backgroundColor:
                  activeTab === "3D Viewer" ? colors.primary : colors.secondary,
                color: "white",
                "&:hover": {
                  backgroundColor:
                    activeTab === "GIS Map" ? "#1f2937" : "#4b5563",
                },
              }}
            >
              3D Viewer
            </Button>
            <Button
              className={`tab-button ${
                activeTab === "GIS Map" ? "active" : ""
              }`}
              onClick={() => setActiveTab("GIS Map")}
              sx={{
                backgroundColor:
                  activeTab === "GIS Map" ? colors.primary : colors.secondary,
                color: "white",
                "&:hover": {
                  backgroundColor:
                    activeTab === "GIS Map" ? "#4b5563" : "#1f2937",
                },
              }}
            >
              GIS Map
            </Button>
          </Box>

          {/* Viewer Area */}
          <Box flex={1} display="flex" flexDirection="column" m="5px">
            {activeTab === "3D Viewer" && (
              <Box flex={1} display="flex" flexDirection="column">
                <PointCloudViewer
                  pointCloudData={pointCloudData}
                  addLog={addLog}
                />
              </Box>
            )}
            {activeTab === "GIS Map" && (
              <Box flex={1} display="flex" flexDirection="column">
                <GISMap
                  geoJsonData={geoJsonData}
                  addLog={addLog}
                  isActive={activeTab === "GIS Map"}
                />
              </Box>
            )}
          </Box>

          {/* Bottom Row: Logs */}

          <LogPanel logs={logs} />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
