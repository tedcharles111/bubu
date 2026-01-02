import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from './components/Notification';
import { AuthProvider } from './context/AuthContext';
import { soundManager } from './utils/SoundManager'; // Import soundManager

// Preload sounds immediately when the app starts
// This is important for mobile browsers that require a user interaction to play audio.
// The Welcome page will trigger the first interaction.
soundManager.playBackgroundMusic(); // Attempt to play background music early

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);