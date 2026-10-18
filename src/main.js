// Phaser game config and scene list.

import Phaser from 'phaser';
import assetFiles from 'virtual:asset-files';
import { BALANCE } from './config/balance.js';
import { BOOT, COLORS } from './config/constants.js';
import { FONT_FILES } from './data/assets.js';
import { BootScene } from './scenes/BootScene.js';
import { HeadphoneGateScene } from './scenes/HeadphoneGateScene.js';
import { HowToPlayScene } from './scenes/HowToPlayScene.js';
import { RoomScene } from './scenes/RoomScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { UIScene } from './scenes/UIScene.js';
import { MemoryScene } from './scenes/MemoryScene.js';
import { PrologueScene } from './scenes/PrologueScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { AudioDirector } from './audio/AudioDirector.js';
import { bus } from './systems/eventBus.js';
import { loadFonts } from './utils/fonts.js';
import { watchOrientation } from './utils/orientation.js';
import { DEVICE } from './utils/device.js';
import { hasSavedSettings, loadSettings } from './utils/storage.js';

async function start() {
  await loadFonts(FONT_FILES, assetFiles, BOOT.fontsTimeoutMs);

  const settings = loadSettings();
  // Phones start with large subtitles until the player chooses otherwise.
  if (DEVICE.touch && !hasSavedSettings()) settings.subtitleSize = 'L';

  const scenes = [BootScene, TitleScene, HowToPlayScene, HeadphoneGateScene, RoomScene, UIScene,
    MemoryScene, PrologueScene, EndingScene];
  // Dynamic import keeps the debug panel out of production bundles.
  if (import.meta.env.DEV) {
    const { DebugScene } = await import('./scenes/DebugScene.js');
    scenes.push(DebugScene);
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: BALANCE.world.width,
    height: BALANCE.world.height,
    backgroundColor: COLORS.void,
    banner: false,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: { activePointers: 2 },
    callbacks: {
      // Runs before any scene, so BootScene can read these.
      preBoot: (g) => {
        g.registry.set('assetFiles', assetFiles);
        g.registry.set('settings', settings);
      }
    },
    scene: scenes
  });

  // Dev only: lets the debug tools and smoke tests reach the game.
  if (import.meta.env.DEV) window.__game = game;

  // Offline cache for the deployed game (docs/09: works offline after load).
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  game.events.once('ready', () => {
    game.sound.volume = settings.volMaster;
    game.registry.set('audio', new AudioDirector(game, bus));
    watchOrientation(game, document.getElementById('rotate'));
  });
}

start();
