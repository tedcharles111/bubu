import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/Notification';
import React from 'react';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const charId = Number(id);
  const character = useLiveQuery(() => db.characters.get(charId), [charId]);
  const user = useLiveQuery(() => character?.ownerId ? db.users.get(character.ownerId) : undefined, [character]);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();

  const handleCreateChallenge = async () => {
    soundManager.play('menu_click');
    if (!currentUser || !character || !character.id) {
      addNotification('You must be logged in and select a valid character to create a challenge.', 'error');
      return;
    }
    if (character.ownerId !== currentUser.id) {
      addNotification('You can only challenge with your own characters!', 'error');
      return;
    }

    try {
      const challengeLink = `${currentUser.id}-${character.id}-${Date.now()}`;
      await db.challenges.add({
        challengerId: currentUser.id,
        challengedCharacterId: character.id,
        status: 'pending',
        challengeLink: challengeLink,
        timestamp: new Date(),
      });
      addNotification(`Challenge created! Share this link: ${window.location.origin}/challenge/${challengeLink}`, 'success');
      navigate('/challenges');
    } catch (error) {
      console.error('Failed to create challenge:', error);
      addNotification('Failed to create challenge. Please try again.', 'error');
    }
  };

  if (!character) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-bebas text-5xl text-red-500">CHARACTER NOT FOUND</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { soundManager.play('menu_click'); navigate('/roster'); }}
          className="mt-8 px-6 py-3 bg-red-800/50 border border-red-500 rounded-lg font-bebas tracking-wider glassmorphic"
        >
          BACK TO ROSTER
        </motion.button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphic p-8 rounded-lg border border-red-800/50 max-w-3xl mx-auto"
      >
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          <img
            src={character.imageUrl || 'https://via.placeholder.com/200?text=No+Image'}
            alt={character.name}
            className="w-48 h-48 object-contain mb-6 md:mb-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
            }}
          />
          <div className="text-center md:text-left flex-1">
            <h1 className="font-bebas text-5xl text-red-400 mb-2">{character.name}</h1>
            <p className="text-lg text-gray-300 mb-4">{character.faction}</p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="flex justify-between">
                <span>Health:</span>
                <span className="text-red-300">{character.health}</span>
              </div>
              <div className="flex justify-between">
                <span>Attack:</span>
                <span className="text-red-300">{character.attack}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense:</span>
                <span className="text-red-300">{character.defense}</span>
              </div>
              <div className="flex justify-between">
                <span>Special Move:</span>
                <span className="text-yellow-400">{character.special}</span>
              </div>
              <div className="flex justify-between">
                <span>Wins:</span>
                <span className="text-green-400">{character.wins}</span>
              </div>
              <div className="flex justify-between">
                <span>Losses:</span>
                <span className="text-red-400">{character.losses}</span>
              </div>
            </div>

            {user && (
              <p className="text-sm text-gray-400 mb-4">
                Owned by: <span className="font-bold text-red-300">{user.username}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { soundManager.play('menu_click'); navigate(`/arena?fighter=${character.id}`); }}
                className="px-6 py-3 bg-red-800/50 border border-red-500 rounded-lg font-bebas tracking-wider glassmorphic"
              >
                SOLO FIGHT
              </motion.button>
              {currentUser && character.ownerId === currentUser.id && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateChallenge}
                  className="px-6 py-3 bg-blue-800/50 border border-blue-500 rounded-lg font-bebas tracking-wider glassmorphic"
                >
                  CREATE CHALLENGE
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}