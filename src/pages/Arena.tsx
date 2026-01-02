import { useLiveQuery } from 'dexie-react-hooks';
import { db, Character, Battle, BattleStep, Challenge } from '../db';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { useAuth } from '../context/AuthContext';
import { useGamepad } from '../hooks/useGamepad';
import { GamepadIndicator } from '../components/GamepadIndicator';
import { SoundControls } from '../components/SoundControls'; // Ensure this is not imported twice if App.tsx already imports it
import { soundManager } from '../utils/SoundManager';

// Arena Backgrounds
const arenaBackgrounds = [
  { name: 'The Pit', url: 'https://i.imgur.com/vH0tZgD.jpeg' },
  { name: 'Living Forest', url: 'https://i.imgur.com/r9qX1nL.jpeg' },
  { name: 'Dead Pool', url: 'https://i.imgur.com/yF2pQ1B.jpeg' },
  { name: 'Outworld Marketplace', url: 'https://i.imgur.com/o1bX2mB.jpeg' },
  { name: 'Goro\'s Lair', url: 'https://i.imgur.com/7vY5B3x.jpeg' },
];

export default function Arena() {
  const characters = useLiveQuery(() => db.characters.toArray());
  const battles = useLiveQuery(() => db.battles.orderBy('timestamp').reverse().toArray());
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { challengeLink } = useParams<{ challengeLink?: string }>();
  const navigate = useNavigate();

  const [fighter1Id, setFighter1Id] = useState<number | null>(null);
  const [fighter2Id, setFighter2Id] = useState<number | null>(null);
  const [isFighting, setIsFighting] = useState(false);
  const [battleOutcome, setBattleOutcome] = useState<{ winnerId: number | null; outcomeText: string } | null>(null);
  const [currentHealth1, setCurrentHealth1] = useState<number | null>(null);
  const [currentHealth2, setCurrent2Health] = useState<number | null>(null);
  const [battleLogDisplay, setBattleLogDisplay] = useState<string[]>([]);
  const [showBattleHistory, setShowBattleHistory] = useState(false);
  const [selectedArenaBackground, setSelectedArenaBackground] = useState(arenaBackgrounds[0].url);

  const [fighter1Hit, setFighter1Hit] = useState(false);
  const [fighter2Hit, setFighter2Hit] = useState(false);
  const [fatalityTriggered, setFatalityTriggered] = useState(false);

  const { addNotification } = useNotification();
  const animationFrameRef = useRef<number | null>(null);
  const currentChallengeRef = useRef<Challenge | null>(null);

  // Gamepad support
  const fighter1SelectRef = useRef<HTMLSelectElement>(null);
  const fighter2SelectRef = useRef<HTMLSelectElement>(null);
  const arenaSelectRef = useRef<HTMLSelectElement>(null);
  const fightButtonRef = useRef<HTMLButtonElement>(null);
  const battleHistoryButtonRef = useRef<HTMLButtonElement>(null);

  const focusableElements = useRef<HTMLElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    // Collect all focusable elements in order
    focusableElements.current = [
      fighter1SelectRef.current!,
      fighter2SelectRef.current!,
      arenaSelectRef.current!,
      fightButtonRef.current!,
      battleHistoryButtonRef.current!,
    ].filter(Boolean); // Filter out any nulls

    // Ensure focused element is visible
    if (focusableElements.current[focusedIndex]) {
      focusableElements.current[focusedIndex].focus();
    }
  }, [characters, fighter1Id, fighter2Id, selectedArenaBackground, isFighting, focusedIndex]);


  const handleGamepadInput = useCallback((
    _gamepad: Gamepad,
    prevButtons: Record<string, boolean>,
    currentButtons: Record<string, boolean>,
    prevAxes: Record<string, number>,
    currentAxes: Record<string, number>
  ) => {
    if (!focusableElements.current || focusableElements.current.length === 0) return;

    const currentElement = focusableElements.current[focusedIndex];

    // D-Pad / Left Stick Up/Down for navigation between elements
    const axisThreshold = 0.5;
    const prevAxisY = prevAxes.axis1 || 0;
    const currentAxisY = currentAxes.axis1 || 0;

    if (currentAxisY < -axisThreshold && !(prevAxisY < -axisThreshold)) { // Up
      setFocusedIndex(prev => (prev === 0 ? focusableElements.current.length - 1 : prev - 1));
      soundManager.play('menu_click');
    } else if (currentAxisY > axisThreshold && !(prevAxisY > axisThreshold)) { // Down
      setFocusedIndex(prev => (prev === focusableElements.current.length - 1 ? 0 : prev + 1));
      soundManager.play('menu_click');
    }

    // D-Pad / Left Stick Left/Right for changing select values
    const prevAxisX = prevAxes.axis0 || 0;
    const currentAxisX = currentAxes.axis0 || 0;

    if (currentElement && currentElement.tagName === 'SELECT') {
      const selectElement = currentElement as HTMLSelectElement;
      if (currentAxisX < -axisThreshold && !(prevAxisX < -axisThreshold)) { // Left
        const currentIndex = selectElement.selectedIndex;
        if (currentIndex > 0) {
          selectElement.selectedIndex = currentIndex - 1;
          selectElement.dispatchEvent(new Event('change', { bubbles: true })); // Trigger change event
          soundManager.play('menu_click');
        }
      } else if (currentAxisX > axisThreshold && !(prevAxisX > axisThreshold)) { // Right
        const currentIndex = selectElement.selectedIndex;
        if (currentIndex < selectElement.options.length - 1) {
          selectElement.selectedIndex = currentIndex + 1;
          selectElement.dispatchEvent(new Event('change', { bubbles: true })); // Trigger change event
          soundManager.play('menu_click');
        }
      }
    }

    // A button (button 0) to "click" the focused element
    if (currentButtons.button0 && !prevButtons.button0) {
      if (currentElement) {
        currentElement.click();
        soundManager.play('menu_click');
      }
    }
  }, [focusedIndex]);

  useGamepad(handleGamepadInput);


  // Pre-select fighter from URL or accept challenge
  useEffect(() => {
    const initializeFighters = async () => {
      if (!characters) return;

      const fighterIdParam = searchParams.get('fighter');
      const battleIdParam = searchParams.get('battleId'); // New: for viewing past battles

      if (battleIdParam) {
        const battle = await db.battles.get(Number(battleIdParam));
        if (battle) {
          setFighter1Id(battle.fighter1Id);
          setFighter2Id(battle.fighter2Id);
          // Immediately animate the battle for replay
          animateBattle(battle.healthSnapshots, battle.outcomeText, battle.winnerId);
          addNotification('Replaying past battle!', 'info');
        } else {
          addNotification('Battle not found for replay.', 'error');
        }
        return;
      }

      if (fighterIdParam) {
        const id = parseInt(fighterIdParam);
        const exists = characters.some(c => c.id === id);
        if (exists) {
          setFighter1Id(id);
          setFighter2Id(null);
          currentChallengeRef.current = null;
          return;
        }
      }

      if (challengeLink) {
        if (!currentUser) {
          addNotification('Please log in to accept challenges.', 'info');
          navigate(`/login?redirect=/challenge/${challengeLink}`);
          return;
        }

        const challenge = await db.challenges.where('challengeLink').equals(challengeLink).first();
        if (challenge && challenge.status === 'pending') {
          const challengedChar = await db.characters.get(challenge.challengedCharacterId);
          if (challengedChar) {
            setFighter1Id(challengedChar.id!);
            setFighter2Id(null);
            currentChallengeRef.current = challenge;
            addNotification(`Challenge from ${challengedChar.name}! Select your fighter to accept.`, 'info');
          } else {
            addNotification('Challenged character not found.', 'error');
            navigate('/challenges');
          }
        } else if (challenge && challenge.status !== 'pending') {
          addNotification('This challenge has already been completed or accepted.', 'info');
          navigate('/challenges');
        } else {
          addNotification('Challenge not found.', 'error');
          navigate('/challenges');
        }
      } else {
        currentChallengeRef.current = null;
      }
    };

    initializeFighters();
  }, [searchParams, characters, challengeLink, currentUser, navigate, addNotification, animateBattle]);

  // Reset health and battle state when fighters change
  useEffect(() => {
    const char1 = characters?.find(c => c.id === fighter1Id);
    const char2 = characters?.find(c => c.id === fighter2Id);
    setCurrentHealth1(char1 ? char1.health : null);
    setCurrent2Health(char2 ? char2.health : null);
    setBattleOutcome(null);
    setBattleLogDisplay([]);
    setFatalityTriggered(false);
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [fighter1Id, fighter2Id, characters]);

  const getFighter = useCallback((id: number | null) => {
    return characters?.find(c => c.id === id) || null;
  }, [characters]);

  const animateBattle = useCallback((snapshots: BattleStep[], finalOutcomeText: string, finalWinnerId: number | null) => {
    if (snapshots.length === 0) {
      setBattleOutcome({ winnerId: finalWinnerId, outcomeText: finalOutcomeText });
      setIsFighting(false);
      return;
    }

    let currentIndex = 0;
    const interval = 1200;

    const step = () => {
      if (currentIndex < snapshots.length) {
        const snapshot = snapshots[currentIndex];
        setBattleLogDisplay(prev => [...prev, snapshot.logEntry]);
        setCurrentHealth1(snapshot.fighter1CurrentHealth);
        setCurrent2Health(snapshot.fighter2CurrentHealth);

        if (snapshot.effect === 'hit') {
          soundManager.playRandomHit();
          if (currentIndex % 2 === 0) {
            setFighter2Hit(true);
            setTimeout(() => setFighter2Hit(false), 300);
          } else {
            setFighter1Hit(true);
            setTimeout(() => setFighter1Hit(false), 300);
          }
        } else if (snapshot.effect === 'special') {
          // Special sound is played in simulateBattleLogic
        } else if (snapshot.effect === 'fatality') {
          soundManager.play('fatality');
          setFatalityTriggered(true);
          setTimeout(() => setFatalityTriggered(false), 2000);
        }

        if (Math.random() < 0.3) { // 30% chance for grunt/panting
          soundManager.playRandomGrunt();
        }

        currentIndex++;
        animationFrameRef.current = window.setTimeout(step, interval);
      } else {
        setBattleOutcome({ winnerId: finalWinnerId, outcomeText: finalOutcomeText });
        setIsFighting(false);
        animationFrameRef.current = null;
      }
    };

    step();
  }, []);

  const simulateBattleLogic = (char1: Character, char2: Character) => {
    let health1 = char1.health;
    let health2 = char2.health;
    const battleLog: string[] = [];
    const healthSnapshots: BattleStep[] = [];

    battleLog.push(`🔥 BATTLE BEGINS: ${char1.name} vs ${char2.name} 🔥`);
    healthSnapshots.push({
      logEntry: `🔥 BATTLE BEGINS: ${char1.name} vs ${char2.name} 🔥`,
      fighter1CurrentHealth: health1,
      fighter2CurrentHealth: health2,
    });

    let round = 1;
    let fighter1Stunned = false;
    let fighter2Stunned = false;
    let fighter1Blocked = false;
    let fighter2Blocked = false;

    while (health1 > 0 && health2 > 0 && round < 100) {
      battleLog.push(`--- ROUND ${round} ---`);

      // Fighter 1's turn
      if (!fighter1Stunned) {
        let damage1 = Math.max(1, char1.attack - char2.defense / 3 + Math.floor(Math.random() * 20));
        let effect1: BattleStep['effect'] = 'hit';

        if (Math.random() < 0.2) {
          battleLog.push(`${char1.name} uses ${char1.special.split('(')[0].trim()}!`);
          soundManager.playCharacterSpecial(char1.name); // Play special sound here
          effect1 = 'special';
          if (char1.name === 'Scorpion') {
            damage1 += 20;
            if (Math.random() < 0.5) fighter2Stunned = true;
          } else if (char1.name === 'Raiden') {
            damage1 += 25;
          } else if (char1.name === 'Liu Kang') {
            damage1 *= 1.5;
          } else if (char1.name === 'Shao Kahn') {
            damage1 += 40;
          } else if (char1.name === 'Kitana') {
            fighter1Blocked = true;
            damage1 = 0;
            battleLog.push(`${char1.name} prepares to block!`);
            effect1 = 'block';
          }
        }

        if (fighter2Blocked) {
          battleLog.push(`${char2.name} blocked ${char1.name}'s attack!`);
          damage1 = 0;
          fighter2Blocked = false;
          effect1 = 'block';
        }

        health2 = Math.max(0, health2 - damage1);
        if (damage1 > 0) battleLog.push(`${char1.name} attacks! ${char2.name} takes ${Math.round(damage1)} damage.`);
        healthSnapshots.push({
          logEntry: battleLog[battleLog.length - 1],
          fighter1CurrentHealth: health1,
          fighter2CurrentHealth: health2,
          effect: effect1,
        });
        if (health2 <= 0) { battleLog.push(`💥 ${char2.name} has been defeated!`); break; }
      } else {
        battleLog.push(`${char1.name} is stunned and skips their turn!`);
        healthSnapshots.push({
          logEntry: `${char1.name} is stunned and skips their turn!`,
          fighter1CurrentHealth: health1,
          fighter2CurrentHealth: health2,
          effect: undefined,
        });
        fighter1Stunned = false;
      }

      // Fighter 2's turn
      if (health2 > 0) {
        if (!fighter2Stunned) {
          let damage2 = Math.max(1, char2.attack - char1.defense / 3 + Math.floor(Math.random() * 20));
          let effect2: BattleStep['effect'] = 'hit';

          if (Math.random() < 0.2) {
            battleLog.push(`${char2.name} uses ${char2.special.split('(')[0].trim()}!`);
            soundManager.playCharacterSpecial(char2.name); // Play special sound here
            effect2 = 'special';
            if (char2.name === 'Sub-Zero') {
              damage2 += 15;
              if (Math.random() < 0.6) fighter1Stunned = true;
            } else if (char2.name === 'Raiden') {
              damage2 += 25;
            } else if (char2.name === 'Liu Kang') {
              damage2 *= 1.5;
            } else if (char2.name === 'Shao Kahn') {
              damage2 += 40;
            } else if (char2.name === 'Kitana') {
              fighter2Blocked = true;
              damage2 = 0;
              battleLog.push(`${char2.name} prepares to block!`);
              effect2 = 'block';
            }
          }

          if (fighter1Blocked) {
            battleLog.push(`${char1.name} blocked ${char2.name}'s attack!`);
            damage2 = 0;
            fighter1Blocked = false;
            effect2 = 'block';
          }

          health1 = Math.max(0, health1 - damage2);
          if (damage2 > 0) battleLog.push(`${char2.name} counterattacks! ${char1.name} takes ${Math.round(damage2)} damage.`);
          healthSnapshots.push({
            logEntry: battleLog[battleLog.length - 1],
            fighter1CurrentHealth: health1,
            fighter2CurrentHealth: health2,
            effect: effect2,
          });
          if (health1 <= 0) { battleLog.push(`💥 ${char1.name} has been defeated!`); break; }
        } else {
          battleLog.push(`${char2.name} is stunned and skips their turn!`);
          healthSnapshots.push({
            logEntry: `${char2.name} is stunned and skips their turn!`,
            fighter1CurrentHealth: health1,
            fighter2CurrentHealth: health2,
            effect: undefined,
          });
          fighter2Stunned = false;
        }
      }
      round++;
    }

    const winnerId = health1 > 0 ? char1.id : char2.id;
    const loserId = health1 > 0 ? char2.id : char1.id;
    const winnerChar = getFighter(winnerId!);
    const loserChar = getFighter(loserId!);

    let outcomeText = 'Victory';
    if (winnerChar && winnerChar.id === char1.id && health1 === char1.health) outcomeText = 'Flawless Victory!';
    else if (winnerChar && winnerChar.id === char2.id && health2 === char2.health) outcomeText = 'Flawless Victory!';
    else if (winnerChar && Math.random() < 0.25) outcomeText = 'Fatality!';

    if (winnerChar) {
      battleLog.push(`🏆 ${winnerChar.name} WINS! ${outcomeText.toUpperCase()} 🏆`);
    }

    if (outcomeText === 'Fatality!') {
      healthSnapshots.push({
        logEntry: `💀 ${winnerChar?.name} executes a FATALITY on ${loserChar?.name}! 💀`,
        fighter1CurrentHealth: health1,
        fighter2CurrentHealth: health2,
        effect: 'fatality',
      });
    }

    return { winnerId, loserId, outcomeText, battleLog, healthSnapshots };
  };

  const handleFight = async () => {
    if (!currentUser) {
      addNotification('You must be logged in to fight!', 'error');
      navigate('/login?redirect=/arena');
      return;
    }

    if (fighter1Id === null || fighter2Id === null || fighter1Id === fighter2Id) {
      addNotification('Please select two different fighters.', 'error');
      return;
    }

    setIsFighting(true);
    setBattleOutcome(null);
    setBattleLogDisplay([]);
    setFatalityTriggered(false);

    const char1 = getFighter(fighter1Id);
    const char2 = getFighter(fighter2Id);

    if (!char1 || !char2) {
      addNotification('Selected fighters not found.', 'error');
      setIsFighting(false);
      return;
    }

    if (currentChallengeRef.current) {
      if (char1.id !== currentChallengeRef.current.challengedCharacterId) {
        addNotification('Fighter 1 must be the challenged character for this challenge.', 'error');
        setIsFighting(false);
        return;
      }
      if (char2.ownerId !== currentUser.id) {
        addNotification('Fighter 2 must be one of your owned characters to accept this challenge.', 'error');
        setIsFighting(false);
        return;
      }
    }

    const { winnerId, loserId, outcomeText, battleLog, healthSnapshots } = simulateBattleLogic(char1, char2);

    if (winnerId) {
      await db.characters.update(winnerId, { wins: (getFighter(winnerId)!.wins || 0) + 1 });
      addNotification(`${getFighter(winnerId)!.name} won the battle! ${outcomeText}`, 'success');
    }
    if (loserId) {
      await db.characters.update(loserId, { losses: (getFighter(loserId)!.losses || 0) + 1 });
    }

    const winnerUser = await db.users.get(getFighter(winnerId!)!.ownerId!);
    if (winnerUser) {
      await db.users.update(winnerUser.id!, { wins: winnerUser.wins + 1 });
    }
    const loserUser = await db.users.get(getFighter(loserId!)!.ownerId!);
    if (loserUser) {
      await db.users.update(loserUser.id!, { losses: loserUser.losses + 1 });
    }

    const battleRecord: Omit<Battle, 'id'> = {
      fighter1Id: fighter1Id,
      fighter2Id: fighter2Id,
      winnerId: winnerId!,
      timestamp: new Date(),
      log: battleLog,
      outcomeText: outcomeText,
      healthSnapshots: healthSnapshots,
      challengeId: currentChallengeRef.current?.id,
    };
    const newBattleId = await db.battles.add(battleRecord);

    if (currentChallengeRef.current) {
      await db.challenges.update(currentChallengeRef.current.id!, {
        status: 'completed',
        acceptorId: currentUser.id,
        acceptorCharacterId: fighter2Id,
        battleId: newBattleId,
      });
      currentChallengeRef.current = null;
    }

    animateBattle(healthSnapshots, outcomeText, winnerId);
  };

  const fighter1 = getFighter(fighter1Id);
  const fighter2 = getFighter(fighter2Id);

  const availableFighter2s = currentChallengeRef.current && currentUser
    ? characters?.filter(c => c.ownerId === currentUser.id)
    : characters;

  return (
    <div
      className="relative min-h-screen bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(${selectedArenaBackground})` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="container mx-auto px-4 py-12 relative z-10">
        <h1 className="font-bebas text-5xl text-red-500 text-center mb-12 neon-glow">BATTLE ARENA</h1>

        <div className="text-center mb-8">
          <label htmlFor="arena-bg" className="font-bebas text-lg text-gray-300 mr-4">Select Arena:</label>
          <select
            id="arena-bg"
            ref={arenaSelectRef}
            value={selectedArenaBackground}
            onChange={(e) => setSelectedArenaBackground(e.target.value)}
            className="p-2 bg-black/50 border border-red-800 rounded-lg text-white"
          >
            {arenaBackgrounds.map(bg => (
              <option key={bg.name} value={bg.url}>{bg.name}</option>
            ))}
          </select>
        </div>

        {currentChallengeRef.current && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphic p-4 rounded-lg border border-blue-800/50 mb-8 text-center"
          >
            <p className="font-bebas text-2xl text-blue-400">
              CHALLENGE ACCEPTED! Fight {getFighter(currentChallengeRef.current.challengedCharacterId)?.name}
            </p>
            <p className="text-sm text-gray-300">Select your fighter to begin.</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glassmorphic p-6 rounded-lg border border-red-800/50">
            <h2 className="font-bebas text-2xl mb-4">FIGHTER 1</h2>
            <select
              value={fighter1Id || ''}
              ref={fighter1SelectRef}
              onChange={(e) => setFighter1Id(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 bg-black/50 border border-red-800 rounded-lg text-white mb-4"
              disabled={!!currentChallengeRef.current}
            >
              <option value="">Select Fighter</option>
              {characters?.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} ({char.faction})
                </option>
              ))}
            </select>
            {fighter1 && (
              <FighterArenaCard
                character={fighter1}
                currentHealth={currentHealth1}
                maxHealth={fighter1.health}
                isHit={fighter1Hit}
                isFatality={fatalityTriggered && battleOutcome?.winnerId === fighter1.id}
              />
            )}
          </div>

          <div className="glassmorphic p-6 rounded-lg border border-red-800/50">
            <h2 className="font-bebas text-2xl mb-4">FIGHTER 2</h2>
            <select
              value={fighter2Id || ''}
              ref={fighter2SelectRef}
              onChange={(e) => setFighter2Id(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 bg-black/50 border border-red-800 rounded-lg text-white mb-4"
            >
              <option value="">Select Fighter</option>
              {availableFighter2s?.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} ({char.faction})
                </option>
              ))}
            </select>
            {fighter2 && (
              <FighterArenaCard
                character={fighter2}
                currentHealth={currentHealth2}
                maxHealth={fighter2.health}
                isHit={fighter2Hit}
                isFatality={fatalityTriggered && battleOutcome?.winnerId === fighter2.id}
              />
            )}
          </div>
        </div>

        <div className="text-center mb-12 flex flex-col sm:flex-row justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFight}
            ref={fightButtonRef}
            disabled={fighter1Id === null || fighter2Id === null || fighter1Id === fighter2Id || isFighting}
            className={`px-12 py-4 bg-red-800/50 border border-red-500 rounded-lg text-2xl font-bebas tracking-wider glassmorphic ${(fighter1Id === null || fighter2Id === null || fighter1Id === fighter2Id || isFighting) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isFighting ? 'FIGHTING...' : 'FIGHT!'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { soundManager.play('menu_click'); setShowBattleHistory(true); }}
            ref={battleHistoryButtonRef}
            className="px-8 py-4 bg-blue-800/50 border border-blue-500 rounded-lg text-xl font-bebas tracking-wider glassmorphic"
          >
            BATTLE HISTORY
          </motion.button>
        </div>

        <AnimatePresence>
          {(isFighting || battleOutcome) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glassmorphic p-6 rounded-lg border border-red-800/50 mb-8"
            >
              <h2 className="font-bebas text-2xl mb-4">BATTLE LOG</h2>
              <div className="space-y-2 text-sm font-mono max-h-96 overflow-y-auto custom-scrollbar">
                {battleLogDisplay.map((log, i) => (
                  <div key={i} className={log.includes('💥') ? 'text-red-400' : log.includes('🔥') ? 'text-red-500' : log.includes('💀') ? 'text-yellow-400' : ''}>
                    {log}
                  </div>
                ))}
              </div>
              {battleOutcome && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="mt-6 text-center"
                >
                  <h3 className="font-bebas text-3xl text-red-400">🏆 WINNER: {getFighter(battleOutcome.winnerId)?.name || 'Unknown'} 🏆</h3>
                  <p className={`font-bebas text-2xl mt-2 ${battleOutcome.outcomeText === 'Fatality!' ? 'text-yellow-400' : 'text-green-400'}`}>{battleOutcome.outcomeText.toUpperCase()}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBattleHistory && (
            <BattleHistoryModal
              battles={battles || []}
              getFighterName={(id) => getFighter(id)?.name || 'Unknown'}
              getFighter={(id) => getFighter(id)}
              onClose={() => setShowBattleHistory(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FighterArenaCardProps {
  character: Character;
  currentHealth: number | null;
  maxHealth: number;
  isHit: boolean;
  isFatality: boolean;
}

function FighterArenaCard({ character, currentHealth, maxHealth, isHit, isFatality }: FighterArenaCardProps) {
  const healthPercentage = currentHealth !== null ? (currentHealth / maxHealth) * 100 : 100;

  return (
    <motion.div
      className={`flex flex-col items-center relative transition-transform duration-100 ${isHit ? 'animate-shake' : ''} ${isFatality ? 'animate-fatality' : ''}`}
      animate={{
        x: isHit ? [-5, 5, -5, 5, 0] : 0,
        scale: isFatality ? [1, 1.2, 1] : 1,
      }}
      transition={{
        duration: isFatality ? 0.5 : 0.2,
        type: isFatality ? "spring" : "tween",
        stiffness: isFatality ? 200 : undefined,
      }}
    >
      <img
        src={character.imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
        alt={character.name}
        className="w-32 h-32 object-contain mb-4"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
        }}
      />
      <h3 className="font-bebas text-xl text-red-400">{character.name}</h3>
      <p className="text-sm text-gray-300">{character.faction}</p>
      <div className="mt-2 w-full text-xs">
        <div className="flex justify-between">
          <span>Health:</span>
          <span>{currentHealth !== null ? currentHealth : maxHealth}/{maxHealth}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
          <motion.div
            className="bg-red-600 h-2.5 rounded-full"
            initial={{ width: `${healthPercentage}%` }}
            animate={{ width: `${healthPercentage}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
        <div className="flex justify-between mt-2">
          <span>Attack:</span>
          <span>{character.attack}</span>
        </div>
        <div className="flex justify-between">
          <span>Defense:</span>
          <span>{character.defense}</span>
        </div>
        <div className="flex justify-between">
          <span>Special:</span>
          <span className="text-red-400">{character.special.split('(')[0].trim()}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface BattleHistoryModalProps {
  battles: Battle[];
  getFighterName: (id: number | null) => string;
  getFighter: (id: number | null) => Character | null;
  onClose: () => void;
}

function BattleHistoryModal({ battles, getFighterName, getFighter, onClose }: BattleHistoryModalProps) {
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [replayStepIndex, setReplayStepIndex] = useState(0);
  const replayIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
    };
  }, [selectedBattle]);

  const startReplay = (battle: Battle) => {
    setSelectedBattle(battle);
    setReplayStepIndex(0);

    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }

    let currentStep = 0;
    replayIntervalRef.current = window.setInterval(() => {
      currentStep++;
      if (currentStep >= battle.healthSnapshots.length) {
        clearInterval(replayIntervalRef.current!);
        replayIntervalRef.current = null;
        setReplayStepIndex(battle.healthSnapshots.length - 1);
      } else {
        setReplayStepIndex(currentStep);
      }
    }, 1000);
  };

  const stopReplay = () => {
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
  };

  const resetReplay = () => {
    stopReplay();
    setReplayStepIndex(0);
  };

  const fighter1 = selectedBattle ? getFighter(selectedBattle.fighter1Id) : null;
  const fighter2 = selectedBattle ? getFighter(selectedBattle.fighter2Id) : null;
  const currentSnapshot = selectedBattle && selectedBattle.healthSnapshots.length > 0
    ? selectedBattle.healthSnapshots[replayStepIndex]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000]"
      onClick={() => { stopReplay(); onClose(); }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="glassmorphic p-8 rounded-lg border border-red-800/50 w-11/12 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bebas text-3xl text-red-500">BATTLE HISTORY</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { stopReplay(); onClose(); }}
            className="text-gray-400 hover:text-red-400 text-2xl"
          >
            &times;
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
          <div className="overflow-y-auto custom-scrollbar pr-4">
            {battles.length === 0 ? (
              <p className="text-gray-400">No battles recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {battles.map((battle) => (
                  <motion.li
                    key={battle.id}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,0,0,0.1)' }}
                    className={`p-4 rounded-lg border border-red-900/50 cursor-pointer transition-all ${selectedBattle?.id === battle.id ? 'bg-red-900/30' : 'bg-black/30'}`}
                    onClick={() => { soundManager.play('menu_click'); stopReplay(); setSelectedBattle(battle); setReplayStepIndex(0); }}
                  >
                    <p className="font-bebas text-lg">
                      {getFighterName(battle.fighter1Id)} <span className="text-gray-400">vs</span> {getFighterName(battle.fighter2Id)}
                    </p>
                    <p className="text-sm text-gray-400">Winner: <span className="text-green-400">{getFighterName(battle.winnerId)}</span></p>
                    <p className="text-xs text-gray-500">{new Date(battle.timestamp).toLocaleString()}</p>
                    <p className={`font-bebas text-yellow-400 text-sm ${battle.outcomeText === 'Fatality!' ? 'text-yellow-400' : 'text-green-400'}`}>{battle.outcomeText.toUpperCase()}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <div className="glassmorphic p-4 rounded-lg border border-red-800/50 flex flex-col">
            <h3 className="font-bebas text-xl mb-3 text-red-400">Battle Replay</h3>
            {selectedBattle ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="font-bebas text-lg">
                    {getFighterName(selectedBattle.fighter1Id)} vs {getFighterName(selectedBattle.fighter2Id)}
                  </p>
                  <p className={`font-bebas text-xl ${selectedBattle.outcomeText === 'Fatality!' ? 'text-yellow-400' : 'text-green-400'}`}>{selectedBattle.outcomeText.toUpperCase()}</p>
                </div>
                <div className="flex justify-center gap-4 mb-4">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.play('menu_click'); startReplay(selectedBattle); }} className="px-4 py-2 bg-green-700/50 rounded-lg font-bebas">REPLAY</motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.play('menu_click'); stopReplay(); }} className="px-4 py-2 bg-red-700/50 rounded-lg font-bebas">STOP</motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { soundManager.play('menu_click'); resetReplay(); }} className="px-4 py-2 bg-gray-700/50 rounded-lg font-bebas">RESET</motion.button>
                </div>

                {fighter1 && fighter2 && currentSnapshot && (
                  <div className="flex justify-around items-center mb-4">
                    <div className="flex flex-col items-center">
                      <img src={fighter1.imageUrl} alt={fighter1.name} className="w-20 h-20 object-contain" />
                      <p className="text-sm">{fighter1.name}</p>
                      <div className="w-24 bg-gray-700 rounded-full h-2.5 mt-1">
                        <motion.div
                          className="bg-red-600 h-2.5 rounded-full"
                          initial={{ width: `${(currentSnapshot.fighter1CurrentHealth / fighter1.health) * 100}%` }}
                          animate={{ width: `${(currentSnapshot.fighter1CurrentHealth / fighter1.health) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        ></motion.div>
                      </div>
                      <span className="text-xs">{currentSnapshot.fighter1CurrentHealth}/{fighter1.health}</span>
                    </div>
                    <span className="font-bebas text-3xl text-red-500">VS</span>
                    <div className="flex flex-col items-center">
                      <img src={fighter2.imageUrl} alt={fighter2.name} className="w-20 h-20 object-contain" />
                      <p className="text-sm">{fighter2.name}</p>
                      <div className="w-24 bg-gray-700 rounded-full h-2.5 mt-1">
                        <motion.div
                          className="bg-red-600 h-2.5 rounded-full"
                          initial={{ width: `${(currentSnapshot.fighter2CurrentHealth / fighter2.health) * 100}%` }}
                          animate={{ width: `${(currentSnapshot.fighter2CurrentHealth / fighter2.health) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        ></motion.div>
                      </div>
                      <span className="text-xs">{currentSnapshot.fighter2CurrentHealth}/{fighter2.health}</span>
                    </div>
                  </div>
                )}

                <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 text-xs font-mono">
                  {selectedBattle.healthSnapshots.slice(0, replayStepIndex + 1).map((snapshot, i) => (
                    <div
                      key={i}
                      className={`${snapshot.logEntry.includes('💥') ? 'text-red-300' : snapshot.logEntry.includes('🔥') ? 'text-red-400' : snapshot.logEntry.includes('💀') ? 'text-yellow-400' : 'text-gray-300'} ${i === replayStepIndex ? 'font-bold text-white' : ''}`}
                    >
                      {snapshot.logEntry}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400">Select a battle from the list to view its detailed log and replay.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}