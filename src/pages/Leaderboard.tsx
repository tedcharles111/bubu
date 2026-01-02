import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const characters = useLiveQuery(() =>
    db.characters.orderBy('wins').reverse().toArray()
  );

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-bebas text-5xl text-red-500">ACCESS DENIED</h1>
        <p className="text-lg text-gray-300 mt-4">Please log in to view the leaderboard.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { soundManager.play('menu_click'); navigate('/login'); }}
          className="mt-8 px-6 py-3 bg-red-800/50 border border-red-500 rounded-lg font-bebas tracking-wider glassmorphic"
        >
          LOGIN
        </motion.button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-bebas text-5xl text-red-500 text-center mb-12">LEADERBOARD</h1>

      <div className="glassmorphic p-6 rounded-lg border border-red-800/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters?.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 border-b border-red-800/50 last:border-b-0"
            >
              <div className="font-bebas text-4xl text-red-600">{index + 1}</div>
              <img
                src={char.imageUrl || 'https://via.placeholder.com/60?text=No+Image'}
                alt={char.name}
                className="w-16 h-16 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=No+Image';
                }}
              />
              <div className="flex-1">
                <h3 className="font-bebas text-xl text-red-400">{char.name}</h3>
                <p className="text-sm text-gray-400">{char.faction}</p>
              </div>
              <div className="text-right">
                <div className="font-bebas text-lg text-green-400">⚔️ {char.wins} Wins</div>
                <div className="text-sm text-red-400">💀 {char.losses} Losses</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}