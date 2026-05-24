import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563EB" },
    secondary: { main: "#111111" },
    background: { default: "#F9FAFB", paper: "#FFFFFF" },
    text: { primary: "#1E293B", secondary: "#64748B" },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#F3F4F6",
          borderRadius: "8px",
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#D1D5DB" },
            "&:hover fieldset": { borderColor: "#1E3A8A" },
            "&.Mui-focused fieldset": { borderColor: "#1E3A8A" },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: "#1E293B" },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4F75C2" }, 
    secondary: { main: "#EAB308" },
    background: { default: "#0A0F1E", paper: "#111827" },
    text: { primary: "#E5E7EB", secondary: "#9CA3AF" },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0F172A",
          borderBottom: "1px solid #333",
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#1F2937",
          borderRadius: "8px",
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#374151" },
            "&:hover fieldset": { borderColor: "#EAB308" },
            "&.Mui-focused fieldset": { borderColor: "#EAB308" },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: "#E5E7EB" },
      },
    },
  },
});
