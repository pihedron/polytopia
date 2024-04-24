// @ts-check

export default class Random {
  /** @type {number} */
  min

  /** @type {number} */
  max

  /**
   * creates a new random number generator
   * @param {number} min inclusive lower bound
   * @param {number} max exclusive upper bound
   */
  constructor(min, max) {
    this.min = min
    this.max = max
  }

  int() {
    return this.min + Math.floor(Math.random() * (this.max - this.min))
  }
}