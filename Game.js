// @ts-check

import * as THREE from 'three'

import Tile from './Tile.js'
import Random from './Random.js'
import Unit from './Unit.js'

export default class Game {
  /** @type {number} */
  boardSize

  /** @type {number} */
  width

  /** @type {number} */
  height

  /** @type {Tile[][]} */
  board = []

  /** @type {THREE.Group} */
  map = new THREE.Group()

  /** @type {THREE.WebGLRenderer} */
  renderer

  /** @type {THREE.Scene} */
  scene = new THREE.Scene()

  /** @type {THREE.PerspectiveCamera} */
  camera

  /** @type {THREE.Vector3} */
  pointer = new THREE.Vector3()

  constructor() {
    this.boardSize = 16

    this.width = window.innerWidth
    this.height = window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    document.getElementById('canvas')?.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    this.camera.position.set(0, 8, 12)
    this.camera.rotation.set(0, 0, 0)
    this.scene.add(this.camera)

    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(8, 8, 0)
    light.target.position.set(0, 0, 0)
    light.castShadow = true
    this.scene.add(light)

    const ambientLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambientLight)

    this.generateMap()

    this.mapTiles((tile, x, z) => {
      switch (tile.terrain) {
        case 'land': {
          const object = new THREE.Object3D()
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), new THREE.MeshPhongMaterial({ color: 0xffbb80, vertexColors: true }))
          const colors = []
          let color = new THREE.Color();
          color.set(0xffffff)
          const positionAttribute = mesh.geometry.getAttribute('position')
          for (let i = 0; i < positionAttribute.count; i += 3) {
            if (i === 4 * 3 || i === 5 * 3) {
              color.set(0x40ff40)
            } else {
              color.set(0xffbb80)
            }
            colors.push(color.r, color.g, color.b)
            colors.push(color.r, color.g, color.b)
            colors.push(color.r, color.g, color.b)
          }
          mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
          mesh.receiveShadow = true
          mesh.castShadow = true
          if (tile.unit) {
            const height = 1
            const unit = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, 0.5), new THREE.MeshPhongMaterial({ color: 0x0000ff }))
            unit.position.y = (height + 1) / 2
            unit.castShadow = true
            object.add(unit)
          }
          object.add(mesh)
          object.position.x = x - this.boardSize / 2
          object.position.z = z - this.boardSize / 2
          object.castShadow = true
          this.map.add(object)
          break;
        }
        case 'sea': {
          const object = new THREE.Object3D()
          const geometry = new THREE.BoxGeometry(1, 0, 1)
          const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            opacity: 0.5,
            transparent: true,
          })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.y = 3 / 8
          const sand = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), new THREE.MeshPhongMaterial({ color: 0xffff80 }))
          sand.position.y = - 1 / 4
          sand.receiveShadow = true
          sand.castShadow = true
          object.add(mesh)
          object.add(sand)
          object.position.x = x - this.boardSize / 2
          object.position.z = z - this.boardSize / 2
          object.receiveShadow = true
          // object.castShadow = true
          this.map.add(object)
          break;
        }
        case 'ocean': {
          const object = new THREE.Object3D()
          const geometry = new THREE.BoxGeometry(1, 0, 1)
          const material = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            opacity: 0.5,
            transparent: true,
          })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.y = 3 / 8
          object.add(mesh)
          object.position.x = x - this.boardSize / 2
          object.position.z = z - this.boardSize / 2
          this.map.add(object)
          break;
        }
        default:
          break;
      }
      return tile
    })

    this.map.position.set(0, 0, 0)
    this.scene.add(this.map)

    // const n = 5000
    // this.renderTicks(n, tick => this.camera.rotateX(-Math.PI / (4 * n)))
    this.camera.rotateX(-Math.PI / 4)

    this.update()
  }

  /**
   * keeps the main game loop alive
   */
  update() {
    requestAnimationFrame(() => this.update())
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * renders scene for a set amount of ticks with delays
   * @param {number} n the number of ticks to render
   * @param {(tick: number) => void} callback the function for updating the scene
   */
  renderTicks(n, callback) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        callback(i)
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()
        this.renderer.render(this.scene, this.camera)
      }, i / 10);
    }
  }

  /**
   * returns adjacent tiles (not diagonal)
   * @param {number} x
   * @param {number} z
   * @returns {Tile[]} the adjacent tiles
   */
  getAdjacentTiles(x, z) {
    const adjacentTiles = []
    if (x + 1 < this.boardSize) {
      adjacentTiles.push(this.board[x + 1][z])
    }
    if (x - 1 >= 0) {
      adjacentTiles.push(this.board[x - 1][z])
    }
    if (z + 1 < this.boardSize) {
      adjacentTiles.push(this.board[x][z + 1])
    }
    if (z - 1 >= 0) {
      adjacentTiles.push(this.board[x][z - 1])
    }
    return adjacentTiles
  }

  initMap() {
    const r = new Random(0, 2)
    for (let x = 0; x < this.boardSize; x++) {
      this.board[x] = []
      for (let z = 0; z < this.boardSize; z++) {
        let tile
        if (r.int() === 0) {
          tile = new Tile('land')
        } else {
          tile = new Tile('ocean')
        }
        this.board[x][z] = tile
      }
    }
  }

  /**
   * generates a tile map
   */
  generateMap() {
    this.initMap()
    let unitCount = 0
    for (let x = 0; x < this.boardSize; x++) {
      for (let z = 0; z < this.boardSize; z++) {
        if (this.board[x][z].terrain === 'ocean') {
          if (this.getAdjacentTiles(x, z).map(tile => tile.terrain).includes('land')) {
            this.board[x][z] = new Tile('sea')
          }
        } else {
          if (unitCount === 0) {
            const unit = new Unit(0, 1, 1, 1, 1)
            this.board[x][z].unit = unit
            unitCount++
          }
        }
      }
    }
  }

  /**
   * iterate and modify each tile
   * @param {(tile: Tile, x: number, y: number) => Tile} callback the function used to process tile data
   */
  mapTiles(callback) {
    for (let x = 0; x < this.boardSize; x++) {
      for (let z = 0; z < this.boardSize; z++) {
        this.board[x][z] = callback(this.board[x][z], x, z)
      }
    }
  }

  /**
   * limits the game cursor within board bounds
   */
  adjustPointer() {
    this.pointer.x = Math.max(0, Math.min(this.boardSize - 1, this.pointer.x))
    this.pointer.z = Math.max(0, Math.min(this.boardSize - 1, this.pointer.z))
  }
  
  selectTile() {
    const tile = game.board[game.pointer.x][game.pointer.z]
    console.log(tile)

    console.log(this.map.children)
  }
}

const game = new Game()
window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowRight':
      game.pointer.x++
      game.adjustPointer()
      break;
    case 'ArrowLeft':
      game.pointer.x--
      game.adjustPointer()
      break;
    case 'ArrowUp':
      game.pointer.z--
      game.adjustPointer()
      break;
    case 'ArrowDown':
      game.pointer.z++
      game.adjustPointer()
      break;
    default:
      break;
  }

  game.selectTile()
})