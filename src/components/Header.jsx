import { Typography, Box, useTheme } from "@mui/material";
import logo from "../assets/images/logo.png";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
      width="100%"
      ml="20px"
      mr="20px"
      color="black"
    >
      <Box flexGrow={1}>
        <Typography
          variant="h5"
          color={colors.grey[100]}
          fontWeight="bold"
          sx={{ mb: "3px" }}
        >
          {title}
        </Typography>
        <Typography variant="h6" color={colors.grey[100]}>
          {subtitle}
        </Typography>
      </Box>

      <Box component="img" src={logo} alt="Logo" sx={{ height: 40 }} />
    </Box>
  );
};

export default Header;
