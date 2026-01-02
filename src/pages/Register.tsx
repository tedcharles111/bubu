import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      // Notification handled by AuthContext (or could add local here)
      return;
    }
    if (password !== confirmPassword) {
      // addNotification('Passwords do not match.', 'error'); // If NotificationContext were imported here
      alert('Passwords do not match.'); // Simple alert for now
      return;
    }
    const success = await register(username, password);
    if (success) {
      navigate('/profile'); // Redirect to profile on successful registration
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-900/20 to-black">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glassmorphic p-8 rounded-lg shadow-xl border border-red-800/50 w-full max-w-md"
      >
        <h1 className="font-bebas text-4xl text-red-500 text-center mb-6 neon-glow">REGISTER</</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <</div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">
              Username
            </</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-red-800 rounded w-full py-3 px-4 bg-black/50 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Choose a username"
              required
            />
          </</div>
          <</div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Password
            </</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border border-red-800 rounded w-full py-3 px-4 bg-black/50 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Choose a password"
              required
            />
          </</div>
          <</div>
            <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">
              Confirm Password
            </</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border border-red-800 rounded w-full py-3 px-4 bg-black/50 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Confirm your password"
              required
            />
          </</div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bebas tracking-wider py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors text-lg"
          >
            {loading ? 'REGISTERING...' : 'REGISTER'}
          </motion.</button>
        </</form>
        <p className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-red-400 hover:text-red-300 font-bold">
            Login
          </</Link>
        </</p>
      </motion.</div>
    </</div>
  );
}