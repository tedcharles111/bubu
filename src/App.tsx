import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Roster from './pages/Roster';
import Arena from './pages/Arena';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import CharacterDetail from './pages/CharacterDetail';
import Challenges from './pages/Challenges';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';
import { initDB } from './db';
import { GamepadIndicator } from './components/GamepadIndicator';
import { useGamepad } from './hooks/useGamepad';
import { SoundControls } from './components/SoundControls'; // Import SoundControls

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  const { gamepad, buttons } = useGamepad();
  const pressedButton = Object.keys(buttons).find(key => buttons[key]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="roster" element={<Roster />} />
            <Route path="character/:id" element={<CharacterDetail />} />
            <Route path="arena" element={<Arena />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="challenge/:challengeLink" element={<Arena />} />
          </Route>
        </Route>
      </Routes>
      <GamepadIndicator isConnected={!!gamepad} buttonPressed={pressedButton} />
      <SoundControls /> {/* Global sound controls */}
    </>
  );
}