import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../components/Notification';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user: currentUser } = useAuth(); // Get current logged-in user
  const navigate = useNavigate();
  const userCharacters = useLiveQuery(() => currentUser ? db.characters.where('ownerId').equals(currentUser.id!).toArray() : [], [currentUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    avatar: '',
  });
  const { addNotification } = useNotification();

  useState(() => {
    if (currentUser) {
      setEditData({
        username: currentUser.username,
        avatar: currentUser.avatar,
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    if (!currentUser) return;
    setEditData({
      username: currentUser.username,
      avatar: currentUser.avatar,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!editData.username.trim()) {
      addNotification('Username cannot be empty!', 'error');
      return;
    }
    await db.users.update(currentUser.id!, {
      username: editData.username,
      avatar: editData.avatar,
    });
    addNotification('Profile updated successfully!', 'success');
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-bebas text-5xl text-red-500">ACCESS DENIED</</h1>
        <p className="text-lg text-gray-300 mt-4">Please log in to view your profile.</</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="mt-8 px-6 py-3 bg-red-800/50 border border-red-500 rounded-lg font-bebas tracking-wider glassmorphic"
        >
          LOGIN
        </motion.</button>
      </</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-bebas text-5xl text-red-500 text-center mb-12">YOUR PROFILE</</h1>

      <div className="max-w-md mx-auto glassmorphic p-8 rounded-lg border border-red-800/50">
        <div className="flex flex-col items-center">
          <motion.img
            whileHover={{ scale: 1.05 }}
            src={currentUser.avatar || 'https://via.placeholder.com/150?text=Avatar'}
            alt="Avatar"
            className="w-32 h-32 object-cover rounded-full mb-6 border-2 border-red-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Avatar';
            }}
          />
          {isEditing ? (
            <>
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                className="w-full p-3 bg-black/50 border border-red-800 rounded-lg text-white text-center mb-4"
              />
              <input
                type="text"
                value={editData.avatar}
                onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
                className="w-full p-3 bg-black/50 border border-red-800 rounded-lg text-white text-center mb-6"
                placeholder="Avatar URL"
              />
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="px-6 py-2 bg-red-600 rounded-lg font-bebas"
                >
                  SAVE
                </motion.</button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-700 rounded-lg font-bebas"
                >
                  CANCEL
                </motion.</button>
              </</div>
            </>
          ) : (
            <>
              <h2 className="font-bebas text-3xl text-red-400">{currentUser.username}</</h2>
              <div className="mt-6 w-full text-center">
                <div className="font-bebas text-xl text-green-400">⚔️ {currentUser.wins} Wins</</div>
                <div className="text-lg text-red-400">💀 {currentUser.losses} Losses</</div>
              </</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="mt-8 px-6 py-2 bg-red-800/50 border border-red-500 rounded-lg font-bebas glassmorphic"
              >
                EDIT PROFILE
              </motion.</button>
            </>
          )}
        </</div>

        {/* Owned Characters */}
        <div className="mt-12">
          <h3 className="font-bebas text-3xl text-red-500 mb-6 text-center">YOUR FIGHTERS</</h3>
          {userCharacters && userCharacters.length === 0 ? (
            <p className="text-center text-gray-400">You don't own any fighters yet. Go to the Roster to add some!</</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userCharacters?.map(char => (
                <motion.div
                  key={char.id}
                  whileHover={{ y: -3 }}
                  className="glassmorphic p-4 rounded-lg border border-red-800/50 flex items-center gap-4 cursor-pointer"
                  onClick={() => navigate(`/character/${char.id}`)}
                >
                  <img src={char.imageUrl} alt={char.name} className="w-16 h-16 object-contain rounded-full" />
                  <</div>
                    <h4 className="font-bebas text-xl text-red-400">{char.name}</</h4>
                    <p className="text-sm text-gray-400">Wins: {char.wins} / Losses: {char.losses}</</p>
                  </</div>
                </motion.</div>
              ))}
            </</div>
          )}
        </</div>
      </</div>
    </</div>
  );
}