type SoundName =
  | 'punch1' | 'punch2' | 'kick1' | 'kick2' | 'sword1' | 'sword2'
  | 'hit1' | 'hit2' | 'special1' | 'special2' | 'fatality'
  | 'scorpion_special' | 'subzero_special' | 'raiden_special' | 'liukang_special' | 'kitana_special' | 'shaokahn_special'
  | 'grunt1' | 'grunt2' | 'panting1' | 'panting2'
  | 'background_music' | 'menu_click'; // Added menu_click

class SoundManager {
  private static instance: SoundManager;
  private sounds: Record<SoundName, HTMLAudioElement> = {} as Record<SoundName, HTMLAudioElement>;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private backgroundMusic: HTMLAudioElement | null = null;
  private isBackgroundMusicPlaying: boolean = false;

  private constructor() {
    this.sounds = {
      punch1: new Audio('/sounds/punch1.mp3'),
      punch2: new Audio('/sounds/punch2.mp3'),
      kick1: new Audio('/sounds/kick1.mp3'),
      kick2: new Audio('/sounds/kick2.mp3'),
      sword1: new Audio('/sounds/sword1.mp3'),
      sword2: new Audio('/sounds/sword2.mp3'),
      hit1: new Audio('/sounds/hit1.mp3'),
      hit2: new Audio('/sounds/hit2.mp3'),
      special1: new Audio('/sounds/special1.mp3'), // Generic special fallback
      special2: new Audio('/sounds/special2.mp3'), // Generic special fallback
      fatality: new Audio('/sounds/fatality.mp3'),
      scorpion_special: new Audio('/sounds/scorpion_special.mp3'),
      subzero_special: new Audio('/sounds/subzero_special.mp3'),
      raiden_special: new Audio('/sounds/raiden_special.mp3'),
      liukang_special: new Audio('/sounds/liukang_special.mp3'),
      kitana_special: new Audio('/sounds/kitana_special.mp3'),
      shaokahn_special: new Audio('/sounds/shaokahn_special.mp3'),
      grunt1: new Audio('/sounds/grunt1.mp3'),
      grunt2: new Audio('/sounds/grunt2.mp3'),
      panting1: new Audio('/sounds/panting1.mp3'),
      panting2: new Audio('/sounds/panting2.mp3'),
      background_music: new Audio('/sounds/background_music.mp3'),
      menu_click: new Audio('/sounds/menu_click.mp3'), // New menu click sound
    };

    this.backgroundMusic = this.sounds.background_music;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = this.volume * 0.3;

    Object.values(this.sounds).forEach(sound => {
      sound.preload = 'auto';
      sound.volume = this.volume;
    });
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
    Object.values(this.sounds).forEach(sound => {
      if (sound !== this.backgroundMusic) { // Don't adjust background music here
        sound.volume = this.volume;
      }
    });
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume * 0.3;
    }
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    Object.values(this.sounds).forEach(sound => {
      sound.muted = this.isMuted;
    });
  }

  public play(soundName: SoundName): void {
    if (this.isMuted) return;
    const sound = this.sounds[soundName];
    if (sound) {
      const clonedSound = sound.cloneNode() as HTMLAudioElement; // Clone to allow overlapping playback
      clonedSound.volume = sound.volume;
      clonedSound.play().catch(e => console.error(`Error playing sound ${soundName}:`, e));
    }
  }

  public playRandomHit(): void {
    const sounds = ['hit1', 'hit2', 'punch1', 'punch2', 'kick1', 'kick2'] as SoundName[];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.play(randomSound);
  }

  public playRandomGrunt(): void {
    const sounds = ['grunt1', 'grunt2', 'panting1', 'panting2'] as SoundName[];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.play(randomSound);
  }

  public playCharacterSpecial(characterName: string): void {
    const normalizedName = characterName.toLowerCase().replace(/\s+/g, '');
    const soundName = `${normalizedName}_special` as SoundName;
    if (this.sounds[soundName]) {
      this.play(soundName);
    } else {
      this.play('special1'); // Fallback to a generic special sound
    }
  }

  public playBackgroundMusic(): void {
    if (this.isMuted || !this.backgroundMusic || this.isBackgroundMusicPlaying) return;
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic.play().catch(e => console.error('Error playing background music:', e));
    this.isBackgroundMusicPlaying = true;
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    this.isBackgroundMusicPlaying = false;
  }

  public toggleBackgroundMusic(): void {
    if (this.isBackgroundMusicPlaying) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsBackgroundMusicPlaying(): boolean {
    return this.isBackgroundMusicPlaying;
  }
}

export const soundManager = SoundManager.getInstance();