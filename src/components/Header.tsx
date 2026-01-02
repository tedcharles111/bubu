import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function Layout() {
  const { user, logout } = useAuth();

  const handleLinkClick = () => {
    soundManager.play('menu_click'); // Play click sound on navigation
  };

  const handleLogout = () => {
    soundManager.play('menu_click'); // Play click sound on logout
    logout();
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 glassmorphic border-b border-red-900/30">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/home" className="flex items-center gap-2" onClick={handleLinkClick}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="font-bebas text-3xl tracking-wider text-red-500 neon-glow"
            >
              MORTAL KOMBAT
            </motion.div>
          </Link>
          <div className="hidden md:flex items-center gap-6 font-bebas text-lg">
            <Link to="/roster" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>ROSTER</Link>
            <Link to="/arena" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>ARENA</Link>
            <Link to="/leaderboard" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>LEADERBOARD</Link>
            <Link to="/challenges" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>CHALLENGES</Link>
            {user ? (
              <>
                <Link to="/profile" className="hover:text-red-400 transition-colors flex items-center gap-2" onClick={handleLinkClick}>
                  <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-red-500" />
                  {user.username}
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-800/50 border border-red-500 rounded-lg text-sm font-bebas tracking-wider glassmorphic"
                >
                  LOGOUT
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>LOGIN</Link>
                <Link to="/register" className="hover:text-red-400 transition-colors" onClick={handleLinkClick}>REGISTER</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-20">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Mortal Kombat: Web Arena. All rights reserved.</p>
      </footer>
    </>
  );
}