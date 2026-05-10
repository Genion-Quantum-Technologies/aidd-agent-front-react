import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './component/auth/AuthGuard';

// Create a client
const queryClient = new QueryClient();

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import MainChatPage from './pages/MainChatPage';

import HelpPage from './pages/HelpPage';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route element={<AuthGuard />}>
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/projects" element={<MainChatPage />} />
                <Route path="/projects/:projectId" element={<MainChatPage />} />
                <Route path="/projects/:projectId/sessions/:sessionId" element={<MainChatPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
