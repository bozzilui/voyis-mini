// src/components/LogPanel.jsx
import React from "react";
import { Typography, useTheme, Box } from "@mui/material";
import { tokens } from "../theme";

const LogPanel = ({ logs }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      height="200px"
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "5px",
        margin: "10px",
      }}
    >
      <Typography
        color={colors.grey[300]}
        fontWeight="bold"
        variant="h3"
        p="10px"
        gutterBottom
      >
        System Logs
      </Typography>

      <Box
        sx={{
          height: "calc(100% - 60px)", // Subtract header height
          overflowY: "auto",
          padding: "0 10px",
        }}
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {logs.map((log, index) => (
            <li
              key={index}
              style={{
                padding: "4px 0",
                color: colors.grey[100],
              }}
            >
              {log}
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  );
};

export default LogPanel;
