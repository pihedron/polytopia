// @ts-check

import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

import Tile from './Tile.js'
import Random from './Random.js'
import Unit from './Unit.js'
import EventBinder from './EventBinder.js'

export default class Game {
  /** @type {number} */
  boardSize = 16
  offset = (this.boardSize - 1) / 2

  /** @type {number} */
  width

  /** @type {number} */
  height

  /** @type {Tile[][]} */
  board = []

  /** @type {THREE.Group} */
  group = new THREE.Group()

  /** @type {THREE.Object3D[][]} */
  map = []

  /** @type {THREE.WebGLRenderer} */
  renderer

  /** @type {THREE.Scene} */
  scene = new THREE.Scene()

  /** @type {THREE.PerspectiveCamera} */
  camera

  /** @type {THREE.Vector3} */
  pointer = new THREE.Vector3()

  /** @type {THREE.Object3D} */
  cursor = new THREE.Object3D()

  /** @type {THREE.Object3D[]} */
  indicators = []

  /** @type {Tile} */
  tile

  /** @type {THREE.Object3D} */
  object

  /** @type {PointerLockControls} */
  controls

  /** @type {THREE.Raycaster} */
  raycaster = new THREE.Raycaster()

  /** @type {THREE.Vector2} */
  mouse

  /** @type {THREE.Object3D | null} */
  selected

  /** @type {THREE.Vector3} */
  direction = new THREE.Vector3()

  velocity = 0

  constructor() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    document.getElementById('canvas')?.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    this.camera.position.set(0, this.boardSize / 2, this.boardSize / 2)
    this.scene.add(this.camera)

    this.controls = new PointerLockControls(this.camera, this.renderer.domElement)
    this.renderer.domElement.addEventListener('click', e => {
      this.controls.lock()
    })

    this.cursor.add(
      new THREE.Mesh(
        new THREE.RingGeometry(1 / 4, 1 / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
      )
    )
    this.positionCursor()
    this.cursor.position.y = 1 / 2 + 1 / 256
    this.cursor.rotateX(-Math.PI / 2)
    this.scene.add(this.cursor)

    const light = new THREE.DirectionalLight(0xffffff, 2)
    light.position.set(this.boardSize, 8, 0)
    light.target.position.set(0, 0, 0)
    light.castShadow = true
    this.scene.add(light)

    const ambientLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambientLight)

    this.generateMap()

    this.mapTiles((tile, x, z) => {
      const object = new THREE.Object3D()
      switch (tile.terrain) {
        case 'land': {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), new THREE.MeshPhongMaterial({ color: 0xffffff, vertexColors: true }))
          const colors = []
          let color = new THREE.Color();
          color.set(0xffffff)
          const positionAttribute = mesh.geometry.getAttribute('position')
          for (let i = 0; i < positionAttribute.count; i += 3) {
            if (i === 4 * 3 || i === 5 * 3) {
              color.set(0x40dd40)
            } else {
              color.set(0xdd8040)
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
            unit.name = 'unit'
            object.add(unit)
          }
          object.add(mesh)
          object.castShadow = true
          object.receiveShadow = true
          break
        }
        case 'sea': {
          // water surface
          const water = new THREE.Mesh(new THREE.BoxGeometry(1, 0, 1), new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            opacity: 0.5,
            transparent: true,
          }))
          water.translateY(3 / 8)

          // sea bed
          const sand = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), new THREE.MeshPhongMaterial({ color: 0xffff80 }))
          sand.translateY(-1 / 4)
          sand.receiveShadow = true

          object.add(sand)
          object.add(water)
          object.receiveShadow = true
          break
        }
        case 'ocean': {
          const geometry = new THREE.BoxGeometry(1, 0, 1)
          const material = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            opacity: 0.5,
            transparent: true,
          })
          const mesh = new THREE.Mesh(geometry, material)
          mesh.position.y = 3 / 8
          object.add(mesh)
          break
        }
        default:
          break
      }

      object.position.x = x - this.offset
      object.position.z = z - this.offset
      this.group.add(object)
      this.map[x][z] = object

      return tile
    })

    this.group.position.set(0, 0, 0)
    this.scene.add(this.group)

    this.addControls()

    this.update()
  }

  /**
   * keeps the main game loop alive
   */
  update() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.camera.getWorldDirection(this.direction)
    this.camera.position.addScaledVector(this.direction, this.velocity)
    this.velocity *= 3 / 4

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const intersects = this.raycaster.intersectObjects(this.group.children, true)

    if (intersects.length > 0) {
      const { object } = intersects[0]
      this.selected = object.parent
      this.pointer.x = (this.selected?.position.x ?? 0) + this.offset
      this.pointer.z = (this.selected?.position.z ?? 0) + this.offset
    } else {
      this.selected = null
    }

    this.positionCursor()

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => this.update())
  }

  /**
   * renders scene for a set amount of ticks with delays
   * @param {number} n the number of ticks to render
   * @param {(tick: number) => void} callback the function for updating the scene
   */
  renderTicks(n, callback) {
    for (let i = 0; i < n; i++) {
      callback(i)
      this.width = window.innerWidth
      this.height = window.innerHeight
      this.renderer.setSize(this.width, this.height)
      this.camera.aspect = this.width / this.height
      this.camera.updateProjectionMatrix()
      this.renderer.render(this.scene, this.camera)
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
      this.map[x] = []
      for (let z = 0; z < this.boardSize; z++) {
        let tile
        if (r.int() === 0) {
          tile = new Tile('land', x, z)
        } else {
          tile = new Tile('ocean', x, z)
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
            this.board[x][z] = new Tile('sea', x, z)
          }
        } else {
          if (unitCount === 0) {
            const unit = new Unit(x, z, 0, 1, 1, 1, 1)
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

  positionCursor() {
    this.cursor.position.x = this.pointer.x - this.offset
    this.cursor.position.z = this.pointer.z - this.offset
  }

  addControls() {
    const binder = new EventBinder()

    /** @type {{ key: string, handle: (e: Event) => void }[]} */
    const cases = [
      {
        key: 'ArrowUp',
        handle: e => {
          this.velocity = 1
        }
      },
      {
        key: 'ArrowDown',
        handle: e => {
          this.velocity = -1
        }
      },
    ]

    binder.bindCases('keydown', cases)
    binder.bind('click', e => {
      if (!this.controls.isLocked) return
      if (this.indicators.length > 0) {
        this.indicators.forEach(indicator => {
          if (indicator.position.x + this.offset === this.pointer.x && indicator.position.z + this.offset === this.pointer.z) {
            this.board[this.pointer.x][this.pointer.z].unit = this.tile.unit
            const unit = this.board[this.pointer.x][this.pointer.z].unit
            if (unit) {
              unit.x = this.pointer.x
              unit.z = this.pointer.z
            }
            const unitMesh = this.object.children.find(child => child.name === 'unit')
            if (!unitMesh) throw 'a unit disappeared'
            this.map[this.pointer.x][this.pointer.z].add(unitMesh)
            this.tile.unit = null
          }
          this.scene.remove(indicator)
        })
        this.indicators = []
        return
      }
      this.tile = this.board[this.pointer.x][this.pointer.z]
      this.object = this.map[this.pointer.x][this.pointer.z]
      if (this.tile.unit) {
        this.indicators.forEach(indicator => this.scene.remove(indicator))
        this.indicators = []
        const tiles = this.tile.unit.getAvailableTiles(this.board, this.pointer.x, this.pointer.z)
        tiles.forEach(tile => {
          const indicator = new THREE.Object3D()
          indicator.add(
            new THREE.Mesh(
              new THREE.RingGeometry(1 / 4, 1 / 2),
              new THREE.MeshBasicMaterial({ color: 0x0000ff, opacity: 1 / 2, transparent: true }),
            )
          )
          indicator.position.x = tile.x - this.offset
          indicator.position.z = tile.z - this.offset
          indicator.position.y = 1 / 2 + 1 / 256
          indicator.rotateX(-Math.PI / 2)
          this.scene.add(indicator)
          this.indicators.push(indicator)
        })
      }
    })
  }
}

const game = new Game()