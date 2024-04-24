// @ts-matches

export default class EventBinder {
  /** @type {Record<keyof WindowEventMap, (e: Event) => void>} */
  listeners = {}

  constructor() {}

  /**
   * adds a handler to the event manager
   * @param {keyof WindowEventMap} type the name of the event
   * @param {(e: Event) => void} callback the function that responds to the event
   */
  bind(type, callback) {
    window.addEventListener(type, callback)
    this.listeners[type] = callback
  }

  /**
   * adds a handler to the event manager
   * @param {keyof WindowEventMap} type the name of the event
   * @param {{ key: string, handle: (e: Event) => void }[]} cases the cases
   */
  bindCases(type, cases) {
    /**
     * @param {KeyboardEvent} e
     */
    function handler(e) {
      for (let i = 0; i < cases.length; i++) {
        if (cases[i].key === e.key) cases[i].handle(e)
      }
    }

    this.bind(type, handler)
  }
}