import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAppTheme } from './hooks/useTheme';
import { getSettings } from './services/localStorageService';
import EditorPage from './pages/EditorPage';
import LandingPage from './pages/LandingPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '257847266541-iaqa70vcvoo61fbuk2aontn2edrpcagb.apps.googleusercontent.com';
const VISITED_KEY = 'notepad_visited';

function App() {
  const savedTheme = getSettings().theme;
  const theme = useAppTheme(savedTheme);

  // Show landing page only for brand-new visitors.
  // Returning users (who have already clicked "Start") go straight to the editor.
  const [showEditor, setShowEditor] = useState<boolean>(
    () => localStorage.getItem(VISITED_KEY) === 'true'
  );

  const handleStart = () => {
    localStorage.setItem(VISITED_KEY, 'true');
    setShowEditor(true);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {showEditor ? (
          <EditorPage />
        ) : (
          <LandingPage onStart={handleStart} />
        )}
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

