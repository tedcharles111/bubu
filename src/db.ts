import Dexie, { Table } from 'dexie';

export interface Character {
  id?: number;
  name: string;
  faction: 'Earthrealm' | 'Outworld' | 'Netherrealm' | 'Edenia';
  health: number;
  attack: number;
  defense: number;
  special: string;
  imageUrl: string;
  wins: number;
  losses: number;
  ownerId?: number;
}

export interface BattleStep {
  logEntry: string;
  fighter1CurrentHealth: number;
  fighter2CurrentHealth: number;
  effect?: 'hit' | 'special' | 'block' | 'fatality';
}

export interface Battle {
  id?: number;
  fighter1Id: number;
  fighter2Id: number;
  winnerId: number;
  timestamp: Date;
  log: string[];
  outcomeText: string;
  healthSnapshots: BattleStep[];
  challengeId?: number;
}

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  avatar: string;
  wins: number;
  losses: number;
}

export interface Challenge {
  id?: number;
  challengerId: number;
  challengedCharacterId: number;
  status: 'pending' | 'accepted' | 'completed';
  acceptorId?: number;
  acceptorCharacterId?: number;
  battleId?: number;
  challengeLink: string;
  timestamp: Date;
}

export class MortalKombatDB extends Dexie {
  characters!: Table<Character>;
  battles!: Table<Battle>;
  users!: Table<User>;
  challenges!: Table<Challenge>;

  constructor() {
    super('MortalKombatDB');
    this.version(1).stores({
      characters: '++id, name, faction, wins, losses',
      battles: '++id, fighter1Id, fighter2Id, winnerId, timestamp',
      users: '++id, username',
    });
    this.version(2).stores({
      characters: '++id, name, faction, wins, losses',
      battles: '++id, fighter1Id, fighter2Id, winnerId, timestamp, log',
      users: '++id, username',
    }).upgrade(async tx => {
      await tx.table('battles').toCollection().modify(battle => {
        if (!('log' in battle)) {
          (battle as Battle).log = [];
        }
      });
    });
    this.version(3).stores({
      characters: '++id, name, faction, wins, losses',
      battles: '++id, fighter1Id, fighter2Id, winnerId, timestamp, log, healthSnapshots, outcomeText',
      users: '++id, username',
    }).upgrade(async tx => {
      await tx.table('battles').toCollection().modify(battle => {
        if (!('healthSnapshots' in battle)) {
          (battle as Battle).healthSnapshots = [];
        }
        if (!('outcomeText' in battle)) {
          (battle as Battle).outcomeText = 'Victory';
        }
      });
    });
    this.version(4).stores({
      characters: '++id, name, faction, wins, losses, ownerId',
      battles: '++id, fighter1Id, fighter2Id, winnerId, timestamp, log, healthSnapshots, outcomeText, challengeId',
      users: '++id, username, passwordHash, avatar, wins, losses',
      challenges: '++id, challengerId, challengedCharacterId, status, acceptorId, acceptorCharacterId, battleId, timestamp',
    }).upgrade(async tx => {
      const defaultUser = await tx.table('users').toCollection().first();
      if (defaultUser) {
        await tx.table('characters').toCollection().modify(char => {
          if (!('ownerId' in char)) {
            (char as Character).ownerId = defaultUser.id;
          }
        });
        await tx.table('users').toCollection().modify(user => {
          if (!('passwordHash' in user)) {
            (user as User).passwordHash = 'default_hashed_password';
          }
          if (!('avatar' in user)) {
            (user as User).avatar = 'https://i.imgur.com/avatar-default.png';
          }
          if (!('wins' in user)) {
            (user as User).wins = 0;
          }
          if (!('losses' in user)) {
            (user as User).losses = 0;
          }
        });
      }
      await tx.table('battles').toCollection().modify(battle => {
        if (!('challengeId' in battle)) {
          (battle as Battle).challengeId = undefined;
        }
      });
    });
  }
}

export const db = new MortalKombatDB();

export const initDB = async () => {
  try {
    await db.open();
    console.log('Database opened successfully');

    const userCount = await db.users.count();
    if (userCount === 0) {
      const defaultPasswordHash = btoa('password');
      await db.users.add({
        username: 'PlayerOne',
        passwordHash: defaultPasswordHash,
        avatar: 'https://i.imgur.com/avatar-default.png',
        wins: 0,
        losses: 0,
      });
      console.log('Default user "PlayerOne" created.');
    }

    const characterCount = await db.characters.count();
    if (characterCount === 0) {
      const firstUser = await db.users.toCollection().first();
      if (firstUser) {
        await db.characters.bulkAdd([
          {
            name: 'Scorpion',
            faction: 'Netherrealm',
            health: 100,
            attack: 85,
            defense: 70,
            special: 'Get Over Here! (Extra damage + stun chance)',
            imageUrl: 'https://i.imgur.com/3Y1fJ3a.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
          {
            name: 'Sub-Zero',
            faction: 'Earthrealm',
            health: 100,
            attack: 80,
            defense: 75,
            special: 'Ice Clone (Freeze opponent, skip their next turn)',
            imageUrl: 'https://i.imgur.com/8Q2gJ3E.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
          {
            name: 'Raiden',
            faction: 'Earthrealm',
            health: 100,
            attack: 90,
            defense: 65,
            special: 'Lightning Strike (High damage, ignores some defense)',
            imageUrl: 'https://i.imgur.com/9v8fK3L.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
          {
            name: 'Liu Kang',
            faction: 'Earthrealm',
            health: 100,
            attack: 88,
            defense: 72,
            special: 'Flying Dragon Kick (Fast attack, high crit chance)',
            imageUrl: 'https://i.imgur.com/4gH5t7P.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
          {
            name: 'Kitana',
            faction: 'Edenia',
            health: 100,
            attack: 82,
            defense: 78,
            special: 'Fan Swipe (Blocks next attack, then counter-attacks)',
            imageUrl: 'https://i.imgur.com/5hJ6u8Q.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
          {
            name: 'Shao Kahn',
            faction: 'Outworld',
            health: 120,
            attack: 95,
            defense: 80,
            special: 'It\'s Official! (Massive damage, but slow)',
            imageUrl: 'https://i.imgur.com/6kL7v9R.png',
            wins: 0,
            losses: 0,
            ownerId: firstUser.id,
          },
        ]);
        console.log('Default characters created and assigned to PlayerOne.');
      } else {
        console.warn('No user found to assign default characters to.');
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};