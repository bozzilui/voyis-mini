import React from "react";
import { Sidebar } from "react-pro-sidebar";
import { Typography, useTheme, Box } from "@mui/material";
import { tokens } from "../theme";

const SideMenu = ({ onUpload, guiContainer }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) onUpload(file);
  };

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Sidebar
      backgroundColor={colors.primary[400]}
      style={{
        borderRightStyle: "none",
        backgroundColor: "transparent",
        width: "250px", // Increased width to accommodate GUI
        height: "100%",
        top: "auto",
        position: "sticky",
        padding: "0rem",
        margin: "0rem",
      }}
    >
      <Box marginTop="20px">
        <Typography
          color={colors.grey[300]}
          fontWeight="bold"
          variant="h3"
          m="10px"
          gutterBottom
        >
          File Upload
        </Typography>
        <Box m="10px">
          <input
            type="file"
            accept=".json,.geojson,.xyz,.pcd"
            onChange={handleFileChange}
          />
        </Box>

        {/* GUI Container */}
        <Box
          id="gui-container"
          m="10px"
          sx={{
            "& .lil-gui": {
              height: "calc(100% - 20px)",
              width: "100%",
              position: "flex !important",
              left: "0 !important",
            },
          }}
        />
      </Box>
    </Sidebar>
  );
};

export default SideMenu;
