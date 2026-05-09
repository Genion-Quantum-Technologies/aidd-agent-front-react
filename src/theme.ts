import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // HSL(217, 91%, 60%) approx
    },
    background: {
      default: '#0a0d14', // HSL(224, 20%, 8%) approx
      paper: '#12151f',   // HSL(224, 20%, 10%) approx
    },
    text: {
      primary: '#ebebeb', // HSL(0, 0%, 92%)
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
