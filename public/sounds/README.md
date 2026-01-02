# Sound Effects for Mortal Kombat Web Arena

This directory contains all sound effects used in the application.

## Sound Files (Place your MP3 files here)

### General Fight Sounds
- `punch1.mp3`, `punch2.mp3`: Punch sounds.
- `kick1.mp3`, `kick2.mp3`: Kick sounds.
- `sword1.mp3`, `sword2.mp3`: Sword clash sounds.
- `hit1.mp3`, `hit2.mp3`: Generic hit sounds.
- `menu_click.mp3`: Sound for UI interactions (e.g., button clicks).

### Special Moves
- `scorpion_special.mp3`: "Get Over Here!" shout.
- `subzero_special.mp3`: Ice freeze sound.
- `raiden_special.mp3`: Lightning strike sound.
- `liukang_special.mp3`: Flying Dragon Kick sound.
- `kitana_special.mp3`: Fan swipe sound.
- `shaokahn_special.mp3`: "It's Official!" shout.
- `special1.mp3`, `special2.mp3`: Generic special move sounds (fallbacks).

### Other Sounds
- `fatality.mp3`: Fatality sound effect.
- `grunt1.mp3`, `grunt2.mp3`: Grunt sounds.
- `panting1.mp3`, `panting2.mp3`: Panting sounds.
- `background_music.mp3`: Background music (loopable).

## How to Add New Sounds
1.  Add the `.mp3` file to this directory.
2.  Update the `SoundName` type and `sounds` object in `src/utils/SoundManager.ts`.
3.  Ensure the `preload` attribute is set to 'auto' for new sounds if you want them to load upfront.
4.  Use `soundManager.play('new_sound')` to play the sound.