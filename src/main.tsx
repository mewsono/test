import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayerProvider } from './state/player';
import App from './App';

import './styles/fonts.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/screens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayerProvider>
      <App />
    </PlayerProvider>
  </StrictMode>,
);
