# Voyis Mini - 3D Point Cloud & GIS Data Visualizer

A React-based web application for visualizing and analyzing 3D point cloud data and GIS information.

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/bozzilui/voyis-mini.git
cd voyis-mini
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will open in your default browser at http://localhost:3000

## Features

- 3D Point Cloud Visualization

Upload and view .xyz and .pcd files
Adjust point size and colors
Filter by altitude range
Real-time point cloud manipulation

- GIS Data Visualization

Support for GeoJSON files
Time-based animation
Tag-based filtering
Interactive markers with metadata

## Usage

1. Point Cloud Viewer

Click "3D Viewer" tab
Upload .xyz or .pcd files
Use GUI controls to adjust visualization
View point statistics in log panel

2. GIS Map

Click "GIS Map" tab
Upload GeoJSON files
Use filters to show/hide markers
Click markers for metadata
Use time slider for temporal data
