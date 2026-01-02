import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Layout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 w-full z-50 glassmorphic border-b border-red-900/30">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="font-bebas text-3xl tracking-wider text-red-500 neon-glow"
            >
              MORTAL KOMBAT
            </motion.</div>
          </</Link>
          <div className="hidden md:flex items-center gap-6 font-bebas text-lg">
            <Link to="/roster" className="hover:text-red-400 transition-colors">ROSTER</</Link>
            <Link to="/arena" className="hover:text-red-400 transition-colors">ARENA</</Link>
            <Link to="/leaderboard" className="hover:text-red-400 transition-colors">LEADERBOARD</</Link>
            <Link to="/profile" className="hover:text-red-400 transition-colors">PROFILE</</Link>
          </</div>
        </</nav>
      </</header>

      <main className="pt-20">
        <Outlet />
      </</main>

      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2025 Mortal Kombat: Web Arena. All rights reserved.</</p>
      </</footer>
    </</div>
  );
}