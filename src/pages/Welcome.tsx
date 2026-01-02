import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepad } from '../hooks/useGamepad';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function Welcome() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // To track first user interaction

  // Gamepad handler for the Welcome page
  const handleGamepadInput = useCallback((
    _gamepad: Gamepad,
    prevButtons: Record<string, boolean>,
    currentButtons: Record<string, boolean>
  ) => {
    if (currentButtons.button0 && !prevButtons.button0) { // A button - Select
      if (buttonRef.current) {
        buttonRef.current.click();
      }
    }
  }, []);

  useGamepad(handleGamepadInput);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
    // Autoplay background music here. Modern browsers require user interaction.
    // The onClick for the button will serve as this interaction.
    // For now, let's ensure it attempts to play.
    soundManager.playBackgroundMusic();

    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        soundManager.playBackgroundMusic(); // Ensure music plays on first interaction
        setHasInteracted(true);
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    // For gamepad, the button click will also trigger it.

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted]);

  const handleEnter = () => {
    soundManager.play('menu_click'); // Play click sound
    soundManager.playBackgroundMusic(); // Ensure music is playing
    navigate('/home');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
  };

  const titleVariants = {
    hidden: { y: -100, opacity: 0, scale: 0.8 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 50, damping: 10, delay: 0.5, duration: 1.5 },
    },
  };

  const buttonVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 50, damping: 10, delay: 1.5, duration: 1 },
    },
    hover: {
      scale: 1.1,
      boxShadow: '0 0 25px rgba(255,0,0,0.8)',
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-black via-red-900/10 to-black"
    >
      {/* Background visual effects */}
      <div className="absolute inset-0 bg-pattern-blood opacity-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-900/10 to-black/80"></div>
      <div className="absolute inset-0 blood-smear opacity-20"></div>

      {/* Main Content */}
      <motion.div className="z-10 text-center">
        <motion.h1
          variants={titleVariants}
          className="font-bebas text-8xl md:text-9xl lg:text-[10rem] text-red-600 neon-glow tracking-widest leading-none mb-10"
        >
          MORTAL KOMBAT
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-2xl md:text-3xl text-gray-300 font-rajdhani mb-12"
        >
          THE WEB ARENA
        </motion.p>
        <motion.button
          ref={buttonRef}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleEnter}
          className={`px-12 py-5 bg-red-800/60 border-2 border-red-500 rounded-xl text-3xl font-bebas tracking-wider text-white transition-all duration-300 ${isHovered ? 'neon-glow-red' : ''} focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-75`}
        >
          ENTER THE ARENA
        </motion.button>
      </motion.div>

      {/* Subtle character silhouettes */}
      <motion.img
        initial={{ x: -200, opacity: 0.1 }}
        animate={{ x: 0, opacity: 0.2 }}
        transition={{ delay: 1, duration: 2, type: 'spring', stiffness: 50 }}
        src="https://i.imgur.com/3Y1fJ3a.png" // Scorpion
        alt="Scorpion Silhouette"
        className="absolute bottom-0 left-0 w-64 md:w-96 h-auto object-contain filter grayscale hue-rotate-30 brightness-50 contrast-150"
        style={{ transform: 'translateX(-50%) rotateY(180deg)' }}
      />
      <motion.img
        initial={{ x: 200, opacity: 0.1 }}
        animate={{ x: 0, opacity: 0.2 }}
        transition={{ delay: 1.2, duration: 2, type: 'spring', stiffness: 50 }}
        src="https://i.imgur.com/8Q2gJ3E.png" // Sub-Zero
        alt="Sub-Zero Silhouette"
        className="absolute bottom-0 right-0 w-64 md:w-96 h-auto object-contain filter grayscale hue-rotate-270 brightness-50 contrast-150"
        style={{ transform: 'translateX(50%)' }}
      />
    </motion.div>
  );
}