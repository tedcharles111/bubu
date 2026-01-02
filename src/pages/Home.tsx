import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function Home() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    soundManager.play('menu_click');
    navigate(path);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-900/20 to-black opacity-80"></div>
      <div className="absolute inset-0 blood-smear opacity-30"></div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        <h1 className="font-bebas text-7xl md:text-9xl text-red-600 neon-glow tracking-widest">
          WEB ARENA
        </h1>
        <p className="mt-4 text-lg text-gray-300">Choose your fighter. Finish them.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-12 flex flex-col sm:flex-row gap-4 z-10"
      >
        <button
          onClick={() => handleNavigation('/roster')}
          className="px-8 py-4 bg-red-800/50 border border-red-500 rounded-lg text-xl font-bebas tracking-wider hover:bg-red-700/50 transition-all glassmorphic"
        >
          VIEW ROSTER
        </button>
        <button
          onClick={() => handleNavigation('/arena')}
          className="px-8 py-4 bg-black/50 border border-red-500 rounded-lg text-xl font-bebas tracking-wider hover:bg-gray-900/50 transition-all glassmorphic"
        >
          ENTER ARENA
        </button>
      </motion.div>

      <motion.div
        animate={{ x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute bottom-20 left-10 opacity-20"
      >
        <img src="https://i.imgur.com/3Y1fJ3a.png" alt="Scorpion" className="w-32 h-32 object-contain filter grayscale" />
      </motion.div>
      <motion.div
        animate={{ x: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        className="absolute bottom-20 right-10 opacity-20"
      >
        <img src="https://i.imgur.com/8Q2gJ3E.png" alt="Sub-Zero" className="w-32 h-32 object-contain filter grayscale" />
      </motion.div>
    </div>
  );
}