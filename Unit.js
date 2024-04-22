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

  /** @type {number} */
  x

  /** @type {number} */
  z

  /**
   * creates a military unit
   * @param {number} x
   * @param {number} z
   * @param {number} team tribe id
   * @param {number} attack damage
   * @param {number} defense retaliation and absorption
   * @param {number} movement distance
   * @param {number} range attack distance
   */
  constructor(x, z, team, attack, defense, movement, range) {
    this.x = x
    this.z = z
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
   * @param {Tile[]} memo
   * @returns {Tile[]} the memo of tiles
   */
  getAvailableTiles(tiles, x, z, memo = [], distance = this.movement) {
    // index out of bounds
    if (x >= tiles.length) return memo
    if (x < 0) return memo
    if (z >= tiles[0].length) return memo
    if (z < 0) return memo

    if (tiles[x][z].terrain !== 'land') return memo
    else if (!memo.includes(tiles[x][z]) && (this.x !== x || this.z !== z)) memo.push(tiles[x][z])

    if (distance === 0) return memo

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
   * @param {number} x
   * @param {number} z
   * @param {number} team
   */
  constructor(x, z, team) {
    super(x, z, team, 1, 1, 1, 1)
  }
}