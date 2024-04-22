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

  /** @type {number} */
  x

  /** @type {number} */
  z

  /**
   * creates a game tile
   * @param {Terrain} terrain the type of terrain
   * @param {number } x
   * @param {number } z
   */
  constructor(terrain, x, z) {
    this.terrain = terrain
    this.x = x
    this.z = z
  }
}