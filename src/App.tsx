import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './component/auth/AuthGuard';
import { ReportViewerProvider } from './context/ReportViewerContext';
import { ReportViewerPanel } from './component/research/ReportViewerPanel';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // 30s内数据不重新请求
      refetchOnWindowFocus: false, // 切换窗口不触发轮询
      retry: 1,
    },
  },
});

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
          <ReportViewerProvider>
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
            {/* Side panel that renders the currently-open report file. */}
            <ReportViewerPanel />
          </ReportViewerProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
