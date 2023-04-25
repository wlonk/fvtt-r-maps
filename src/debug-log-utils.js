/*
 * game is global from Foundry
 */

import { RMaps } from './core.js';

export function log(...args) {
  try {
    const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(RMaps.ID);

    if (isDebugging) {
      console.log(RMaps.ID, '|', ...args);
    }
  } catch (e) {
  }
}
