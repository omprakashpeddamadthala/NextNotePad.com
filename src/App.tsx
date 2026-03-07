import { ThemeProvider, CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppTheme } from './hooks/useTheme';
import { getSettings } from './services/localStorageService';
import EditorPage from './pages/EditorPage';

// Replace with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

function App() {
  const savedTheme = getSettings().theme;
  const theme = useAppTheme(savedTheme);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <EditorPage />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
