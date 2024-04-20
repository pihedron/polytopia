// @ts-check

import Unit from './Unit.js'

/** @typedef {'land' | 'mountain' | 'sea' | 'ocean'} Terrain */

export default class Tile {
  /** @type {Terrain} */
  terrain

  /** @type {string | null} */
  building = null
  
  /** @type {Unit | null} */
  unit = null

  /**
   * creates a game tile
   * @param {Terrain} terrain the type of terrain
   */
  constructor(terrain) {
    this.terrain = terrain
  }
}