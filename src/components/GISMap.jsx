import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const GISMap = ({ geoJsonData, addLog, isActive }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [timeRange, setTimeRange] = useState({ min: null, max: null });
  const [currentTime, setCurrentTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  // Extract all unique tags and temporal data from GeoJSON
  useEffect(() => {
    if (geoJsonData) {
      const tags = new Set();
      let minTime = Infinity;
      let maxTime = -Infinity;

      geoJsonData.features.forEach((feature) => {
        if (feature.properties.tags) {
          const featureTags = Array.isArray(feature.properties.tags)
            ? feature.properties.tags
            : [feature.properties.tags];
          featureTags.forEach((tag) => tags.add(tag));
        }

        if (feature.properties.timestamp) {
          const time = new Date(feature.properties.timestamp).getTime();
          minTime = Math.min(minTime, time);
          maxTime = Math.max(maxTime, time);
        }
      });

      setAvailableTags(Array.from(tags));
      if (minTime !== Infinity) {
        setTimeRange({ min: minTime, max: maxTime });
        setCurrentTime(minTime);
      }
    }
  }, [geoJsonData]);

  // Filter features based on selected tags and current time
  const filterFeatures = (feature) => {
    // Check tags first
    if (selectedTags.length > 0) {
      const featureTags = Array.isArray(feature.properties.tags)
        ? feature.properties.tags
        : [feature.properties.tags];
      if (!selectedTags.some((tag) => featureTags.includes(tag))) {
        return false;
      }
    }

    // Check timestamp only if animation is playing
    if (isPlaying && currentTime && feature.properties.timestamp) {
      const featureTime = new Date(feature.properties.timestamp).getTime();
      if (featureTime > currentTime) {
        return false;
      }
    }

    return true;
  };

  // Update map when filters change
  useEffect(() => {
    if (mapRef.current && geoJsonData) {
      if (geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }

      geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
        filter: filterFeatures,
        pointToLayer: (feature, latlng) => {
          return L.marker(latlng);
        },
        onEachFeature: (feature, layer) => {
          let popupContent = `<div class="popup-content">`;
          popupContent += `<p><strong>Coordinates:</strong> ${feature.geometry.coordinates.join(
            ", "
          )}</p>`;

          if (feature.properties.tags) {
            const tags = Array.isArray(feature.properties.tags)
              ? feature.properties.tags.join(", ")
              : feature.properties.tags;
            popupContent += `<p><strong>Tags:</strong> ${tags}</p>`;
          }

          if (feature.properties.description) {
            popupContent += `<p><strong>Description:</strong> ${feature.properties.description}</p>`;
          }

          if (feature.properties.timestamp) {
            popupContent += `<p><strong>Time:</strong> ${new Date(
              feature.properties.timestamp
            ).toLocaleString()}</p>`;
          }

          Object.entries(feature.properties).forEach(([key, value]) => {
            if (!["tags", "description", "timestamp"].includes(key)) {
              popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
            }
          });

          popupContent += `</div>`;
          layer.bindPopup(popupContent);
        },
      }).addTo(mapRef.current);
    }
  }, [geoJsonData, selectedTags, currentTime]);

  // Animation control
  useEffect(() => {
    if (isPlaying && timeRange.max) {
      const animate = () => {
        setCurrentTime((time) => {
          const nextTime = time + 86400000; // Add one day
          if (nextTime >= timeRange.max) {
            setIsPlaying(false);
            return timeRange.min;
          }
          return nextTime;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timeRange]);

  // Main map initialization
  useEffect(() => {
    if (isActive && !mapRef.current && containerRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [0, 0],
        zoom: 2,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Update the controlsContainer creation in the main map initialization
      const controlsContainer = L.control({ position: "topright" });
      controlsContainer.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-control leaflet-bar");
        div.style.backgroundColor = "white";
        div.style.padding = "10px";
        div.style.minWidth = "250px";
        div.style.maxHeight = "80vh"; // Limit height
        div.style.overflowY = "auto"; // Make scrollable
        div.style.color = "black";
        div.innerHTML = `
          <div>
            <h4 style="margin: 0 0 10px 0; color: black;">Time Control</h4>
            <div id="time-control" style="display: flex; flex-direction: column; gap: 10px">
              <div style="display: flex; align-items: center; gap: 10px">
                <button id="play-button" style="width: 30px; height: 30px;">▶</button>
                <span id="current-date" style="color: black;"></span>
              </div>
              <input 
                type="range" 
                id="time-slider" 
                style="width: 100%;"
              />
            </div>
            
            <details style="margin-top: 15px;">
              <summary style="color: black; cursor: pointer; margin-bottom: 10px;">
                <strong>Filters</strong>
              </summary>
              <div id="tag-filters" style="max-height: 200px; overflow-y: auto;"></div>
              <button id="clear-filters" style="margin: 10px 0">Clear Filters</button>
            </details>
          </div>
        `;
        return div;
      };
      controlsContainer.addTo(mapRef.current);

      // Render tag filters
      const tagFiltersContainer = document.getElementById("tag-filters");
      if (tagFiltersContainer) {
        availableTags.forEach((tag) => {
          const container = document.createElement("div");
          container.style.marginBottom = "2px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = `tag-${tag}`;
          checkbox.checked = selectedTags.includes(tag);
          checkbox.style.marginRight = "5px";
          checkbox.onchange = () => {
            setSelectedTags((prev) =>
              checkbox.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
            );
          };

          const label = document.createElement("label");
          label.htmlFor = `tag-${tag}`;
          label.textContent = tag;
          label.style.cursor = "pointer";
          label.style.color = "black"; // Add this line

          container.appendChild(checkbox);
          container.appendChild(label);
          tagFiltersContainer.appendChild(container);
        });

        // Add clear filters button functionality
        const clearButton = document.getElementById("clear-filters");
        if (clearButton) {
          clearButton.onclick = () => {
            setSelectedTags([]);
            const checkboxes = tagFiltersContainer.querySelectorAll(
              'input[type="checkbox"]'
            );
            checkboxes.forEach((cb) => (cb.checked = false));
          };
        }
      }

      // Render time control if temporal data exists
      if (timeRange.min) {
        const timeControlContainer = document.getElementById("time-control");
        const currentDateDisplay = document.getElementById("current-date");
        if (timeControlContainer && currentDateDisplay) {
          const playButton = document.createElement("button");
          playButton.textContent = isPlaying ? "⏸" : "▶";
          playButton.style.width = "30px";
          playButton.style.height = "30px";
          playButton.onclick = () => setIsPlaying(!isPlaying);

          const dateDisplay = document.createElement("span");
          dateDisplay.textContent = new Date(currentTime).toLocaleDateString();

          timeControlContainer.appendChild(playButton);
          currentDateDisplay.textContent = `Current: ${new Date(
            currentTime
          ).toLocaleDateString()}`;
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, availableTags, selectedTags, isPlaying, currentTime]);

  // Add this effect after the main map initialization effect
  useEffect(() => {
    // Only proceed if map is initialized and we have tags
    if (!mapRef.current || !availableTags.length) return;

    // Clear existing filters
    const tagFiltersContainer = document.getElementById("tag-filters");
    if (tagFiltersContainer) {
      tagFiltersContainer.innerHTML = ""; // Clear existing content

      // Create filter elements
      availableTags.forEach((tag) => {
        const container = document.createElement("div");
        container.style.marginBottom = "5px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `tag-${tag}`;
        checkbox.checked = selectedTags.includes(tag);
        checkbox.style.marginRight = "5px";
        checkbox.onchange = () => {
          setSelectedTags((prev) =>
            checkbox.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
          );
        };

        const label = document.createElement("label");
        label.htmlFor = `tag-${tag}`;
        label.textContent = tag;
        label.style.cursor = "pointer";
        label.style.color = "black"; // Add this line

        container.appendChild(checkbox);
        container.appendChild(label);
        tagFiltersContainer.appendChild(container);
      });

      // Debug log
      console.log("Available tags:", availableTags);
      console.log("Selected tags:", selectedTags);
    }
  }, [availableTags, selectedTags, mapRef.current]);

  // Replace all time control related effects with this single effect:
  useEffect(() => {
    if (!mapRef.current || !timeRange.min || !timeRange.max) return;

    const timeControlContainer = document.getElementById("time-control");
    if (!timeControlContainer) return;

    timeControlContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px">
          <button id="play-button" style="width: 30px; height: 30px; cursor: pointer;">
            ${isPlaying ? "⏸" : "▶"}
          </button>
          <span id="current-date" style="color: black;"></span>
        </div>
        <div style="width: 100%;">
          <input 
            type="range" 
            id="time-slider" 
            style="width: 100%; cursor: pointer;"
            min="${timeRange.min}"
            max="${timeRange.max}"
            value="${currentTime || timeRange.min}"
            step="86400000"
          />
        </div>
      </div>
    `;

    const playButton = document.getElementById("play-button");
    const timeSlider = document.getElementById("time-slider");
    const currentDateDisplay = document.getElementById("current-date");

    if (playButton && timeSlider && currentDateDisplay) {
      // Play button handler
      playButton.onclick = () => {
        setIsPlaying(!isPlaying);
        // When starting playback, use current slider position
        if (!isPlaying) {
          setCurrentTime(Number(timeSlider.value));
        }
      };

      // Slider handler
      timeSlider.oninput = (e) => {
        const newTime = Number(e.target.value);
        setCurrentTime(newTime);
        currentDateDisplay.textContent = new Date(newTime).toLocaleDateString();
      };

      // Keep slider and date display in sync with currentTime
      if (currentTime) {
        timeSlider.value = currentTime;
        currentDateDisplay.textContent = new Date(
          currentTime
        ).toLocaleDateString();
      }
    }
  }, [timeRange, currentTime, isPlaying, mapRef.current]);

  return (
    <div
      ref={containerRef}
      id="map"
      className="map-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default GISMap;
