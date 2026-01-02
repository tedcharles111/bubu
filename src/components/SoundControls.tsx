import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../utils/SoundManager';

export const SoundControls: React.FC = () => {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [isMusicPlaying, setIsMusicPlaying] = useState(soundManager.getIsBackgroundMusicPlaying());

  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  // Update local state if sound manager state changes externally (e.g., another component mutes)
  useEffect(() => {
    setIsMuted(soundManager.getIsMuted());
    setIsMusicPlaying(soundManager.getIsBackgroundMusicPlaying());
    setVolume(soundManager.getVolume());
  }, []);

  const handleMuteToggle = () => {
    soundManager.toggleMute();
    setIsMuted(soundManager.getIsMuted());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleMusicToggle = () => {
    soundManager.toggleBackgroundMusic();
    setIsMusicPlaying(soundManager.getIsBackgroundMusicPlaying());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-50 glassmorphic p-3 rounded-lg border border-red-800/50 flex items-center gap-3"
    >
      <button
        onClick={handleMuteToggle}
        className="text-red-400 hover:text-red-300 transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          disabled={isMuted}
        />
        <span className="text-xs text-gray-300">{Math.round(volume * 100)}%</span>
      </div>

      <button
        onClick={handleMusicToggle}
        className="text-red-400 hover:text-red-300 transition-colors"
        title={isMusicPlaying ? "Stop Music" : "Play Music"}
      >
        {isMusicPlaying ? '🎵' : '🎶'}
      </button>
    </motion.div>
  );
};