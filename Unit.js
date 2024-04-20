// @ts-check

import Tile from './Tile.js'

export default class Unit {
  /** @type {number} */
  team

  /** @type {number} */
  attack

  /** @type {number} */
  defense

  /** @type {number} */
  movement

  /** @type {number} */
  range

  /**
   * creates a military unit
   * @param {number} team
   * @param {number} attack
   * @param {number} defense
   * @param {number} movement
   * @param {number} range
   */
  constructor(team, attack, defense, movement, range) {
    this.team = team
    this.attack = attack
    this.defense = defense
    this.movement = movement
    this.range = range
  }

  /**
   * gets tiles that can be moved to
   * @param {Tile[][]} tiles the board
   * @param {number} x
   * @param {number} z
   * @param {Map<[number, number], Tile>} memo
   * @returns {Map<[number, number], Tile>} the memo
   */
  getAvailableTiles(tiles, x, z, memo = new Map(), distance = this.movement) {
    // index out of bounds
    if (x >= tiles.length) return memo
    if (x < 0) return memo
    if (z >= tiles[0].length) return memo
    if (z < 0) return memo

    if (distance === 0) {
      if (tiles[x][z].terrain === 'land') memo.set([x, z], tiles[x][z])
      return memo
    }

    // TODO: do not decrease distance for roads

    // adjacents
    this.getAvailableTiles(tiles, x + 1, z, memo, distance - 1)
    this.getAvailableTiles(tiles, x - 1, z, memo, distance - 1)
    this.getAvailableTiles(tiles, x, z + 1, memo, distance - 1)
    this.getAvailableTiles(tiles, x, z - 1, memo, distance - 1)
    
    // diagonals
    this.getAvailableTiles(tiles, x + 1, z + 1, memo, distance - 1)
    this.getAvailableTiles(tiles, x + 1, z - 1, memo, distance - 1)
    this.getAvailableTiles(tiles, x - 1, z + 1, memo, distance - 1)
    this.getAvailableTiles(tiles, x - 1, z - 1, memo, distance - 1)

    return memo
  }
}

export class Warrior extends Unit {
  /**
   * creates a warrior class unit
   * @param {number} team
   */
  constructor(team) {
    super(team, 1, 1, 1, 1)
  }
}