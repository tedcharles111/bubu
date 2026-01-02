import { useLiveQuery } from 'dexie-react-hooks';
import { db, Character, Challenge, User } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/Notification';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { soundManager } from '../utils/SoundManager'; // Import soundManager

export default function Challenges() {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const allCharacters = useLiveQuery(() => db.characters.toArray());
  const allUsers = useLiveQuery(() => db.users.toArray());

  const pendingChallenges = useLiveQuery(() =>
    db.challenges.where('status').equals('pending').toArray(), []
  );
  const completedChallenges = useLiveQuery(() =>
    db.challenges.where('status').equals('completed').toArray(), []
  );

  const getCharacter = (id: number | undefined) => allCharacters?.find(c => c.id === id);
  const getUser = (id: number | undefined) => allUsers?.find(u => u.id === id);

  const handleCopyLink = (challengeLink: string) => {
    soundManager.play('menu_click');
    const fullLink = `${window.location.origin}/challenge/${challengeLink}`;
    navigator.clipboard.writeText(fullLink);
    addNotification('Challenge link copied to clipboard!', 'info');
  };

  const handleDeleteChallenge = async (id: number) => {
    soundManager.play('menu_click');
    if (window.confirm('Are you sure you want to delete this challenge?')) {
      await db.challenges.delete(id);
      addNotification('Challenge deleted.', 'info');
    }
  };

  const handleAcceptChallenge = (challengeLink: string) => {
    soundManager.play('menu_click');
    navigate(`/challenge/${challengeLink}`);
  };

  const handleViewBattle = (battleId: number | undefined) => {
    soundManager.play('menu_click');
    if (battleId) {
      navigate(`/arena?battleId=${battleId}`);
    } else {
      addNotification('Battle ID not found for this challenge.', 'error');
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-bebas text-5xl text-red-500">ACCESS DENIED</h1>
        <p className="text-lg text-gray-300 mt-4">Please log in to view challenges.</p>
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
      <h1 className="font-bebas text-5xl text-red-500 text-center mb-12">CHALLENGES</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphic p-6 rounded-lg border border-red-800/50"
        >
          <h2 className="font-bebas text-3xl text-yellow-400 mb-6">PENDING CHALLENGES</h2>
          {pendingChallenges && pendingChallenges.length === 0 ? (
            <p className="text-gray-400">No pending challenges. Create one from a character's detail page!</p>
          ) : (
            <ul className="space-y-4">
              {pendingChallenges?.map((challenge) => {
                const challenger = getUser(challenge.challengerId);
                const challengedChar = getCharacter(challenge.challengedCharacterId);

                if (!challenger || !challengedChar) return null;

                const isMyChallenge = currentUser.id === challenge.challengerId;

                return (
                  <motion.li
                    key={challenge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-black/30 rounded-lg border border-red-900/50 flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex-1 text-center md:text-left">
                      <p className="font-bebas text-xl text-red-400">
                        {challenger.username}'s {challengedChar.name}
                      </p>
                      <p className="text-sm text-gray-400">Created: {new Date(challenge.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {isMyChallenge ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopyLink(challenge.challengeLink)}
                            className="px-4 py-2 bg-blue-700/50 rounded-lg font-bebas text-sm"
                          >
                            COPY LINK
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteChallenge(challenge.id!)}
                            className="px-4 py-2 bg-gray-700/50 rounded-lg font-bebas text-sm"
                          >
                            DELETE
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAcceptChallenge(challenge.challengeLink)}
                          className="px-4 py-2 bg-green-700/50 rounded-lg font-bebas text-sm"
                        >
                          ACCEPT CHALLENGE
                        </motion.button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Completed Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glassmorphic p-6 rounded-lg border border-red-800/50"
        >
          <h2 className="font-bebas text-3xl text-green-400 mb-6">COMPLETED CHALLENGES</h2>
          {completedChallenges && completedChallenges.length === 0 ? (
            <p className="text-gray-400">No challenges have been completed yet.</p>
          ) : (
            <ul className="space-y-4">
              {completedChallenges?.map((challenge) => {
                const challenger = getUser(challenge.challengerId);
                const challengedChar = getCharacter(challenge.challengedCharacterId);
                const acceptor = getUser(challenge.acceptorId);
                const acceptorChar = getCharacter(challenge.acceptorCharacterId);

                if (!challenger || !challengedChar || !acceptor || !acceptorChar) return null;

                return (
                  <motion.li
                    key={challenge.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-black/30 rounded-lg border border-green-900/50"
                  >
                    <p className="font-bebas text-xl text-green-400">
                      {challenger.username}'s {challengedChar.name} vs {acceptor.username}'s {acceptorChar.name}
                    </p>
                    <p className="text-sm text-gray-400">Completed: {new Date(challenge.timestamp).toLocaleString()}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewBattle(challenge.battleId)}
                      className="mt-2 px-4 py-2 bg-blue-700/50 rounded-lg font-bebas text-sm"
                    >
                      VIEW BATTLE
                    </motion.button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}