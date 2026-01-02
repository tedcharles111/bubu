import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Character } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Roster() {
  const { user } = useAuth(); // Get current user
  const characters = useLiveQuery(() => db.characters.toArray());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCharId, setEditingCharId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Character, 'id' | 'wins' | 'losses' | 'ownerId'>>({ // Exclude ownerId from form
    name: '',
    faction: 'Earthrealm',
    health: 100,
    attack: 80,
    defense: 70,
    special: '',
    imageUrl: '',
  });
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Effect to populate form when editingCharId changes
  useEffect(() => {
    if (editingCharId !== null && characters) {
      const charToEdit = characters.find(c => c.id === editingCharId);
      if (charToEdit) {
        setFormData({
          name: charToEdit.name,
          faction: charToEdit.faction,
          health: charToEdit.health,
          attack: charToEdit.attack,
          defense: charToEdit.defense,
          special: charToEdit.special,
          imageUrl: charToEdit.imageUrl,
        });
        setIsFormOpen(true);
      }
    } else if (editingCharId === null && !isFormOpen) {
      resetFormData();
    }
  }, [editingCharId, characters, isFormOpen]);

  const resetFormData = () => {
    setFormData({
      name: '',
      faction: 'Earthrealm',
      health: 100,
      attack: 80,
      defense: 70,
      special: '',
      imageUrl: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'health' || name === 'attack' || name === 'defense') ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!user) {
      addNotification('You must be logged in to add or edit characters.', 'error');
      return;
    }
    if (!formData.name.trim()) {
      addNotification('Character name cannot be empty!', 'error');
      return;
    }
    if (editingCharId) {
      // Update existing character
      const charToUpdate = characters?.find(c => c.id === editingCharId);
      if (charToUpdate && charToUpdate.ownerId !== user.id) {
        addNotification('You can only edit your own characters!', 'error');
        return;
      }
      await db.characters.update(editingCharId, formData);
      addNotification(`${formData.name} updated successfully!`, 'success');
    } else {
      // Add new character
      await db.characters.add({
        ...formData,
        wins: 0,
        losses: 0,
        ownerId: user.id, // Assign to current user
      });
      addNotification(`${formData.name} added to roster!`, 'success');
    }
    setIsFormOpen(false);
    setEditingCharId(null);
    resetFormData();
  };

  const handleDelete = async (id: number, name: string, ownerId?: number) => {
    if (!user) {
      addNotification('You must be logged in to delete characters.', 'error');
      return;
    }
    if (ownerId !== user.id) {
      addNotification('You can only delete your own characters!', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      await db.characters.delete(id);
      addNotification(`${name} removed from roster.`, 'info');
    }
  };

  const openAddForm = () => {
    if (!user) {
      addNotification('Please log in to add a new fighter.', 'info');
      navigate('/login');
      return;
    }
    setEditingCharId(null);
    resetFormData();
    setIsFormOpen(true);
  };

  const openEditForm = (id: number) => {
    if (!user) {
      addNotification('Please log in to edit fighters.', 'info');
      navigate('/login');
      return;
    }
    const char = characters?.find(c => c.id === id);
    if (char && char.ownerId !== user.id) {
      addNotification('You can only edit your own characters!', 'error');
      return;
    }
    setEditingCharId(id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCharId(null);
    resetFormData();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-bebas text-5xl text-red-500">CHARACTER ROSTER</</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isFormOpen ? closeForm : openAddForm}
          className="px-6 py-3 bg-red-800/50 border border-red-500 rounded-lg font-bebas tracking-wider glassmorphic"
        >
          {isFormOpen ? 'CLOSE FORM' : 'ADD FIGHTER'}
        </motion.</button>
      </</div>

      {/* Add/Edit Form */}
      <</AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12 p-6 glassmorphic rounded-lg border border-red-800/50 overflow-hidden"
          >
            <h2 className="font-bebas text-2xl mb-4">{editingCharId ? 'EDIT FIGHTER' : 'ADD NEW FIGHTER'}</</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white placeholder-gray-400"
              />
              <select
                name="faction"
                value={formData.faction}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white"
              >
                <option value="Earthrealm">Earthrealm</</option>
                <option value="Outworld">Outworld</</option>
                <option value="Netherrealm">Netherrealm</</option>
                <option value="Edenia">Edenia</</option>
              </</select>
              <input
                type="number"
                name="health"
                placeholder="Health"
                value={formData.health}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white"
              />
              <input
                type="number"
                name="attack"
                placeholder="Attack"
                value={formData.attack}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white"
              />
              <input
                type="number"
                name="defense"
                placeholder="Defense"
                value={formData.defense}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white"
              />
              <input
                type="text"
                name="special"
                placeholder="Special Move"
                value={formData.special}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white"
              />
              <input
                type="text"
                name="imageUrl"
                placeholder="Image URL"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="p-3 bg-black/50 border border-red-800 rounded-lg text-white md:col-span-2"
              />
            </</div>
            <div className="mt-4 flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-6 py-2 bg-red-600 rounded-lg font-bebas"
              >
                {editingCharId ? 'SAVE CHANGES' : 'ADD FIGHTER'}
              </motion.</button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeForm}
                className="px-6 py-2 bg-gray-700 rounded-lg font-bebas"
              >
                CANCEL
              </motion.</button>
            </</div>
          </motion.</div>
        )}
      </</AnimatePresence>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {characters?.map((char) => (
          <motion.div
            key={char.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            className="glassmorphic rounded-xl p-4 border border-red-800/50 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => navigate(`/arena?fighter=${char.id}`)}
                className="text-xs bg-red-600/50 px-2 py-1 rounded font-bebas"
              >
                BATTLE
              </</button>
              {user && char.ownerId === user.id && ( // Only show edit/delete for owned characters
                <>
                  <button
                    onClick={() => openEditForm(char.id!)}
                    className="text-xs bg-blue-600/50 px-2 py-1 rounded font-bebas"
                  >
                    EDIT
                  </</button>
                  <button
                    onClick={() => handleDelete(char.id!, char.name, char.ownerId)}
                    className="text-xs bg-black/50 px-2 py-1 rounded font-bebas"
                  >
                    DELETE
                  </</button>
                </>
              )}
            </</div>
            <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate(`/character/${char.id}`)}>
              <img
                src={char.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                alt={char.name}
                className="w-32 h-32 object-contain mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
              <h3 className="font-bebas text-2xl text-red-400">{char.name}</</h3>
              <p className="text-sm text-gray-300">{char.faction}</</p>
              <div className="mt-2 w-full text-xs">
                <div className="flex justify-between">
                  <span>Health:</</span>
                  <span>{char.health}</</span>
                </</div>
                <div className="flex justify-between">
                  <span>Attack:</</span>
                  <span>{char.attack}</</span>
                </</div>
                <div className="flex justify-between">
                  <span>Defense:</</span>
                  <span>{char.defense}</</span>
                </</div>
                <div className="flex justify-between">
                  <span>Special:</</span>
                  <span className="text-red-400">{char.special.split('(')[0].trim()}</span> {/* Show only name of special */}
                </</div>
                <div className="flex justify-between mt-2">
                  <span>Wins:</</span>
                  <span className="text-green-400">{char.wins}</</span>
                </</div>
                <div className="flex justify-between">
                  <span>Losses:</</span>
                  <span className="text-red-400">{char.losses}</</span>
                </</div>
              </</div>
            </</div>
          </motion.</div>
        ))}
      </</div>
    </</div>
  );
}