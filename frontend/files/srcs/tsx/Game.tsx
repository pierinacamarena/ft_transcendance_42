/* -------------------------LIBRARIES IMPORTS------------------------- */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Phaser, { Game, Physics } from 'phaser'
import Characters from '../resources/characters.json'

/* -------------------------ASSETS IMPORTS------------------------- */

// Text sheets
import goalTextSheet from '../resources/assets/game/text/goal.png'
import blockedTextSheet from '../resources/assets/game/text/blocked.png'
import oneTextSheet from '../resources/assets/game/text/1.png'
import twoTextSheet from '../resources/assets/game/text/2.png'
import threeTextSheet from '../resources/assets/game/text/3.png'
import fightTextSheet from '../resources/assets/game/text/fight.png'
import victoryTextSheet from '../resources/assets/game/text/victory.png'
import defeatTextSheet from '../resources/assets/game/text/defeat.png'

// Map
import map from '../resources/assets/game/maps/resizedMap.png'

// Objects
import ballSheet from '../resources/assets/game/objects/ball.png'
import treesSheet from '../resources/assets/game/objects/treeRow.png'

// ----- Boreas
import BoreasFrontSheet from '../resources/assets/game/character/Boreas/front.png'
import BoreasBackSheet from '../resources/assets/game/character/Boreas/back.png'
import BoreasLeftSheet from '../resources/assets/game/character/Boreas/left.png'
import BoreasRightSheet from '../resources/assets/game/character/Boreas/right.png'

// ----- Faeleen
import FaeleenFrontSheet from '../resources/assets/game/character/Faeleen/front.png'
import FaeleenBackSheet from '../resources/assets/game/character/Faeleen/back.png'
import FaeleenLeftSheet from '../resources/assets/game/character/Faeleen/left.png'
import FaeleenRightSheet from '../resources/assets/game/character/Faeleen/right.png'

// ----- Garrick
import GarrickFrontSheet from '../resources/assets/game/character/Garrick/front.png'
import GarrickBackSheet from '../resources/assets/game/character/Garrick/back.png'
import GarrickLeftSheet from '../resources/assets/game/character/Garrick/left.png'
import GarrickRightSheet from '../resources/assets/game/character/Garrick/right.png'

// ----- Helios
import HeliosFrontSheet from '../resources/assets/game/character/Helios/front.png'
import HeliosBackSheet from '../resources/assets/game/character/Helios/back.png'
import HeliosLeftSheet from '../resources/assets/game/character/Helios/left.png'
import HeliosRightSheet from '../resources/assets/game/character/Helios/right.png'

// ----- Liliana
import LilianaFrontSheet from '../resources/assets/game/character/Liliana/front.png'
import LilianaBackSheet from '../resources/assets/game/character/Liliana/back.png'
import LilianaLeftSheet from '../resources/assets/game/character/Liliana/left.png'
import LilianaRightSheet from '../resources/assets/game/character/Liliana/right.png'

// ----- Orion
import OrionFrontSheet from '../resources/assets/game/character/Orion/front.png'
import OrionBackSheet from '../resources/assets/game/character/Orion/back.png'
import OrionLeftSheet from '../resources/assets/game/character/Orion/left.png'
import OrionRightSheet from '../resources/assets/game/character/Orion/right.png'

// ----- Rylan
import RylanFrontSheet from '../resources/assets/game/character/Rylan/front.png'
import RylanBackSheet from '../resources/assets/game/character/Rylan/back.png'
import RylanLeftSheet from '../resources/assets/game/character/Rylan/left.png'
import RylanRightSheet from '../resources/assets/game/character/Rylan/right.png'

// ----- Selene
import SeleneFrontSheet from '../resources/assets/game/character/Selene/front.png'
import SeleneBackSheet from '../resources/assets/game/character/Selene/back.png'
import SeleneLeftSheet from '../resources/assets/game/character/Selene/left.png'
import SeleneRightSheet from '../resources/assets/game/character/Selene/right.png'

// ----- Thorian
import ThorianFrontSheet from '../resources/assets/game/character/Thorian/front.png'
import ThorianBackSheet from '../resources/assets/game/character/Thorian/back.png'
import ThorianLeftSheet from '../resources/assets/game/character/Thorian/left.png'
import ThorianRightSheet from '../resources/assets/game/character/Thorian/right.png'
import { useNavigate } from 'react-router-dom'
import { Socket } from 'socket.io-client'


/* -------------------------TYPES------------------------- */

type Size = { width: number, height: number }
type Coordinates = { x: number, y: number }
type Side = 'left' | 'right'
type Direction = 'up' | 'down' | 'left' | 'right' | 'none'
type GameState = 'init' | 'ready' | 'created' | 'started' | 'stopped' | 'ended'
type GameEvent = 'goal' | 'blocked' | '3' | '2' | '1' | 'fight' | 'stop' | 'victory' | 'defeat'

const CharacterNameArray = ['Boreas', 'Helios', 'Selene', 'Liliana', 'Orion', 'Faeleen', 'Rylan', 'Garrick', 'Thorian'] as const;
type CharacterName = (typeof CharacterNameArray)[number];

// Keys
interface keys {													// Keyboard keys
	up: Phaser.Input.Keyboard.Key									// UP key
	down: Phaser.Input.Keyboard.Key									// DOWN key
	left: Phaser.Input.Keyboard.Key									// LEFT key
	right: Phaser.Input.Keyboard.Key								// RIGHT key
}

// Characters
interface character {
	frontSheet: string												// Character front sheet
	backSheet: string												// Character back sheet
	leftSheet: string												// Character left sheet
	rightSheet: string												// Character right sheet
}

// Players
interface player {
	direction: Direction											// Player direction
	character: string												// Player character name
	sprite?: Phaser.Physics.Arcade.Sprite 							// Player sprite
	upPassiveWall?: Phaser.Physics.Arcade.Sprite					// Player up passive wall image
	downPassiveWall?: Phaser.Physics.Arcade.Sprite					// Player down passive wall image
}

// Direction of a player
interface playerDirections {
	left: Direction | undefined										// Left player direction
	right: Direction | undefined									// Right player direction
}

// Simple interface for a game object
interface simpleGameObject {
	sprite?: Phaser.Physics.Arcade.Sprite							// Game object sprite
}

// Player key states
interface keyStates {
	up: boolean														// Player UP key state
	down: boolean													// Player DOWN key state
	left: boolean													// Player LEFT key state
	right: boolean													// Player RIGHT key state
}

// Characters creation queue
interface creationQueue {
	left: playerConstruct | undefined								// Left player construct
	right: playerConstruct | undefined								// Right player construct
}

// New properties (sent to the back)
interface newPropsFromClient {
	keys: keyStates,												// New key states to send
	dir: Direction | undefined										// New direction to send
}

// Player constructor (sent by the back)
interface playerConstruct {
	id: string														// Player ID
	side: Side														// Player side
	character: string													// Character name
}

// New properties (sent by the back)
interface newPropsToClient {
	leftProps: Coordinates											// Left player properties
	rightProps: Coordinates											// Right player properties
	ballProps: Coordinates											// Ball properties
}

/* -------------------------GAME INITIALISATION------------------------- */
interface playerHP {
	left: {
		userID: number
		hp: number
	}
	right: {
		userID: number
		hp: number
	}
}
interface PartyProps {
	gameSocket: React.MutableRefObject<Socket<any, any> | undefined>,
	matchmakerBtnLocked: React.MutableRefObject<boolean>
	setInGame: React.Dispatch<React.SetStateAction<boolean>>
	setPlayersHP: React.Dispatch<any>
}
const Party: React.FC<PartyProps> = ({
	gameSocket,
	matchmakerBtnLocked,
	setInGame,
	setPlayersHP
}) => {

	/****** VARIABLES ******/

	// React variables
	const gameRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()
	let game: Phaser.Game

	// Canvas constants
	const screenWidth: number = 1920
	const screenHeight: number = 1080
	const characterFrameNumber: number = 3
	const animFramRate: number = 4
	const ballRay: number = 26
	const pWallSize: Size = {
		width: 85,
		height: 269
	}

	// Keyboard keys
	let keys: keys
	let actualKeyStates: keyStates = {
		up: false,
		down: false,
		left: false,
		right: false
	}
	let oldKeyStates: keyStates = {
		up: false,
		down: false,
		left: false,
		right: false
	}

	// Players
	let leftPlayer: player | undefined = undefined
	let rightPlayer: player | undefined = undefined

	// Ball
	let ball: simpleGameObject | undefined = undefined

	// Text
	let text: simpleGameObject | undefined = undefined
	let textAction: 'display' | 'remove' | undefined = undefined
	let textEvent: GameEvent | undefined = undefined

	// Characters
	let sheets: { [key: string]: character } = {}

	// Player event queues
	let moveQueue: newPropsToClient | undefined = undefined
	let creationQueue: creationQueue = {
		left: undefined,
		right: undefined
	}
	let animationQueue: playerDirections = {
		left: undefined,
		right: undefined
	}

	/****** SCENE PRELOADING ******/

	// Initialise all keyboards keys
	function keysInitialisation(scene: Phaser.Scene) {
		if (scene.input.keyboard) {
			keys = {
				up: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
				down: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
				left: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
				right: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
			}
		}
	}

	function isCharacterName(payload: any): payload is CharacterName {
		return CharacterNameArray.includes(payload);
	};

	// Initialise all characters of the scene
	function sheetsInitialisation(scene: Phaser.Scene) {
		sheets['Boreas'] = {
			frontSheet: BoreasFrontSheet,
			backSheet: BoreasBackSheet,
			leftSheet: BoreasLeftSheet,
			rightSheet: BoreasRightSheet
		}
		sheets['Faeleen'] = {
			frontSheet: FaeleenFrontSheet,
			backSheet: FaeleenBackSheet,
			leftSheet: FaeleenLeftSheet,
			rightSheet: FaeleenRightSheet
		}
		sheets['Garrick'] = {
			frontSheet: GarrickFrontSheet,
			backSheet: GarrickBackSheet,
			leftSheet: GarrickLeftSheet,
			rightSheet: GarrickRightSheet
		}
		sheets['Helios'] = {
			frontSheet: HeliosFrontSheet,
			backSheet: HeliosBackSheet,
			leftSheet: HeliosLeftSheet,
			rightSheet: HeliosRightSheet
		}
		sheets['Liliana'] = {
			frontSheet: LilianaFrontSheet,
			backSheet: LilianaBackSheet,
			leftSheet: LilianaLeftSheet,
			rightSheet: LilianaRightSheet
		}
		sheets['Orion'] = {
			frontSheet: OrionFrontSheet,
			backSheet: OrionBackSheet,
			leftSheet: OrionLeftSheet,
			rightSheet: OrionRightSheet
		}
		sheets['Rylan'] = {
			frontSheet: RylanFrontSheet,
			backSheet: RylanBackSheet,
			leftSheet: RylanLeftSheet,
			rightSheet: RylanRightSheet
		}
		sheets['Selene'] = {
			frontSheet: SeleneFrontSheet,
			backSheet: SeleneBackSheet,
			leftSheet: SeleneLeftSheet,
			rightSheet: SeleneRightSheet
		}
		sheets['Thorian'] = {
			frontSheet: ThorianFrontSheet,
			backSheet: ThorianBackSheet,
			leftSheet: ThorianLeftSheet,
			rightSheet: ThorianRightSheet
		}
		for (let characterName in sheets) {
			let character = sheets[characterName]
			if (isCharacterName(characterName)) {
				scene.load.spritesheet(characterName + 'Front', character.frontSheet, { frameWidth: Characters[characterName].size.width, frameHeight: Characters[characterName].size.height })
				scene.load.spritesheet(characterName + 'Back', character.backSheet, { frameWidth: Characters[characterName].size.width, frameHeight: Characters[characterName].size.height })
				scene.load.spritesheet(characterName + 'Left', character.leftSheet, { frameWidth: Characters[characterName].size.width, frameHeight: Characters[characterName].size.height })
				scene.load.spritesheet(characterName + 'Right', character.rightSheet, { frameWidth: Characters[characterName].size.width, frameHeight: Characters[characterName].size.height })
			}
		}
	}

	// Load the ball spritesheet
	function objectsInitialisation(scene: Phaser.Scene) {
		scene.load.image('map', map)
		scene.load.spritesheet('trees', treesSheet, { frameWidth: 85, frameHeight: 269 })
		scene.load.spritesheet('ball', ballSheet, { frameWidth: 52, frameHeight: 52 })
	}

	function textInitialisation(scene: Phaser.Scene) {
		scene.load.spritesheet('goal', goalTextSheet, { frameWidth: 195, frameHeight: 69 })
		scene.load.spritesheet('blocked', blockedTextSheet, { frameWidth: 345, frameHeight: 69 })
		scene.load.spritesheet('1', oneTextSheet, { frameWidth: 30, frameHeight: 76 })
		scene.load.spritesheet('2', twoTextSheet, { frameWidth: 50, frameHeight: 76 })
		scene.load.spritesheet('3', threeTextSheet, { frameWidth: 50, frameHeight: 76 })
		scene.load.spritesheet('fight', fightTextSheet, { frameWidth: 222, frameHeight: 69 })
		scene.load.spritesheet('victory', victoryTextSheet, { frameWidth: 322, frameHeight: 69 })
		scene.load.spritesheet('defeat', defeatTextSheet, { frameWidth: 295, frameHeight: 69 })
	}

	/****** SCENE CREATION ******/

	function createPassiveWalls(construct: playerConstruct, player: player, scene: Phaser.Scene) {
		let imgCoords: Coordinates = {
			x: (construct.side === 'left' ? pWallSize.width / 2 : 1920 - pWallSize.width / 2),
			y: pWallSize.height / 2
		}
		player.upPassiveWall = scene.physics.add.sprite(imgCoords.x, imgCoords.y, 'trees')
		imgCoords = {
			x: (construct.side === 'left' ? pWallSize.width / 2 : 1920 - pWallSize.width / 2),
			y: 1080 - pWallSize.height / 2
		}
		player.downPassiveWall = scene.physics.add.sprite(imgCoords.x, imgCoords.y, 'trees')
	}

	// Create a player in the scene from a player construct
	function createPlayer(construct: playerConstruct, scene: Phaser.Scene) {
		let newPlayer: player = {
			direction: (construct.side == 'left' ? 'right' : 'left'),
			character: construct.character,
		}
		let xPos = (construct.side == 'left' ? 250 : 1670)
		let yPos = 540
		newPlayer.sprite = scene.physics.add.sprite(xPos, yPos, newPlayer.character + (construct.side == 'left' ? 'Right' : 'Left'))
		newPlayer.sprite.setCollideWorldBounds(true)
		newPlayer.sprite.setImmovable(true)
		if (newPlayer.character === 'Liliana')
			createPassiveWalls(construct, newPlayer, scene)
		if (construct.side == 'left') leftPlayer = newPlayer
		else rightPlayer = newPlayer
		if (leftPlayer && rightPlayer) sendState('created')
	}

	// Create the ball in the scene
	function createBall(scene: Phaser.Scene) {
		ball = { sprite: scene.physics.add.sprite(screenWidth / 2, screenHeight / 2, 'ball') }
		ball.sprite?.body?.setCircle(ballRay)
		ball.sprite?.setBounce(1, 1)
		ball.sprite?.setCollideWorldBounds(true, undefined, undefined, undefined)
	}

	// Create the ball in the scene
	function createText(scene: Phaser.Scene, event: GameEvent) {
		if (text != undefined)
			destroyText()
		text = { sprite: scene.physics.add.sprite(screenWidth / 2, screenHeight / 2, event) }
		text.sprite?.setScale(2, 2)
	}

	function destroyText() {
		text?.sprite?.destroy()
		text = undefined
	}

	// Create animations in the scene
	function createAnims(scene: Phaser.Scene) {
		for (let characterName in sheets) {
			scene.anims.create({
				key: characterName + '_downAnim',
				frames: scene.anims.generateFrameNumbers(characterName + 'Front', { start: 0, end: characterFrameNumber - 1 }),
				frameRate: characterFrameNumber * animFramRate,
				repeat: -1
			})
			scene.anims.create({
				key: characterName + '_upAnim',
				frames: scene.anims.generateFrameNumbers(characterName + 'Back', { start: 0, end: characterFrameNumber - 1 }),
				frameRate: characterFrameNumber * animFramRate,
				repeat: -1
			})
			scene.anims.create({
				key: characterName + '_leftAnim',
				frames: scene.anims.generateFrameNumbers(characterName + 'Left', { start: 0, end: characterFrameNumber - 1 }),
				frameRate: characterFrameNumber * animFramRate,
				repeat: -1
			})
			scene.anims.create({
				key: characterName + '_rightAnim',
				frames: scene.anims.generateFrameNumbers(characterName + 'Right', { start: 0, end: characterFrameNumber - 1 }),
				frameRate: characterFrameNumber * animFramRate,
				repeat: -1
			})
		}
	}

	// Check if directional keys are pressed
	function allKeysUp(): boolean {
		return (keys.up.isUp && keys.down.isUp && keys.left.isUp && keys.right.isUp)
	}

	// Send player movements to the back
	function sendPlayerMovement(direction: Direction | undefined) {
		let props: newPropsFromClient = {
			keys: actualKeyStates,
			dir: direction
		}
		gameSocket.current?.emit('playerKeyUpdate', props)
	}

	// Send player stop to the back
	const sendPlayerStop = () => {
		gameSocket.current?.emit('playerStop')
	}

	// Send game state to the back
	const sendState = (state: GameState) => {
		gameSocket.current?.emit('playerStateUpdate', state)
	}

	/****** SCENE UPDATE ******/

	// Get direction of the player from actual and old key states
	function getDirection(): Direction | undefined {
		if (allKeysUp())
			return 'none'
		else if (actualKeyStates.left)
			return 'left'
		else if (actualKeyStates.right)
			return 'right'
		else if (actualKeyStates.up)
			return 'up'
		else if (actualKeyStates.down)
			return 'down'
		return undefined
	}

	// Adapts player moveState and devolity following the pressed keys
	function checkKeyInputs() {
		if (leftPlayer && rightPlayer) {
			oldKeyStates = Object.assign({}, actualKeyStates)
			actualKeyStates.up = keys.up.isDown
			actualKeyStates.down = keys.down.isDown
			actualKeyStates.left = keys.left.isDown
			actualKeyStates.right = keys.right.isDown
			if (actualKeyStates.up != oldKeyStates.up ||
				actualKeyStates.down != oldKeyStates.down ||
				actualKeyStates.left != oldKeyStates.left ||
				actualKeyStates.right != oldKeyStates.right) {
				sendPlayerMovement(getDirection())
			}
			if (allKeysUp())
				sendPlayerStop()
		}
	}

	// Create new player upon connection
	function checkNewPlayer(scene: Phaser.Scene) {
		if (creationQueue.left) {
			createPlayer(creationQueue.left, scene)
			creationQueue.left = undefined
		}
		if (creationQueue.right) {
			createPlayer(creationQueue.right, scene)
			creationQueue.right = undefined
		}
	}

	// Set player animations following anim state
	function checkAnims() {
		if (leftPlayer && rightPlayer) {
			if (animationQueue.left != undefined) {
				if (animationQueue.left != 'none') {
					leftPlayer.direction = animationQueue.left
					leftPlayer.sprite?.play(leftPlayer.character + '_' + animationQueue.left + 'Anim')
				}
				else leftPlayer.sprite?.stop()
				animationQueue.left = undefined
			}
			if (animationQueue.right != undefined) {
				if (animationQueue.right != 'none') {
					rightPlayer.direction = animationQueue.right
					rightPlayer.sprite?.play(rightPlayer.character + '_' + animationQueue.right + 'Anim')
				}
				else rightPlayer.sprite?.stop()
				animationQueue.right = undefined
			}
		}
	}

	function checkText(scene: Phaser.Scene) {
		if (textAction && textEvent) {
			switch (textAction) {
				case ('display'):
					createText(scene, textEvent)
					textAction = undefined
					textEvent = undefined
					break
				case ('remove'):
					destroyText()
					textAction = undefined
					textEvent = undefined
					break
			}
		}
	}

	// Get sheet size for each character (WILL BE DELETED)
	function getSheetSize(player: player): Size {
		let sheetSize: Size = { width: 0, height: 0 }
		if (isCharacterName(player.character)) {
			sheetSize = Characters[player.character].size
		}
		return sheetSize
	}

	function setPlayerPosition(player: player, coords: Coordinates) {
		let sheetSize: Size = getSheetSize(player)
		let xOffset: number = sheetSize.width / 2
		let yOffset: number = sheetSize.height / 2
		player.sprite?.setPosition(coords.x + xOffset, coords.y + yOffset)
	}

	// Set player position following xPos and yPos
	function checkMove() {
		if (moveQueue && leftPlayer && rightPlayer && ball) {
			setPlayerPosition(leftPlayer, moveQueue.leftProps)
			setPlayerPosition(rightPlayer, moveQueue.rightProps)
			ball.sprite?.setPosition(moveQueue.ballProps.x + ballRay, moveQueue.ballProps.y + ballRay)
			moveQueue = undefined
		}
	}

	/****** OVERLOADED PHASER FUNCTIONS ******/

	// Scene preloading for textures, keys & ball
	function preload(this: Phaser.Scene) {
		keysInitialisation(this)
		sheetsInitialisation(this)
		objectsInitialisation(this)
		textInitialisation(this)
	}

	// Scene creation
	function create(this: Phaser.Scene) {
		this.add.image(screenWidth * 0.5, screenHeight * 0.5, 'map')
		createBall(this)
		createAnims(this)
		sendState('ready')
	}

	// Scene update
	function update(this: Phaser.Scene) {
		if (!leftPlayer || !rightPlayer)
			checkNewPlayer(this)
		checkKeyInputs()
		checkMove()
		checkAnims()
		checkText(this)
	}

	/****** PAGE REACT Élément ******/

	// Create the game
	function createGame() {
		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			width: screenWidth,
			height: screenHeight,
			physics: {
				default: 'arcade',
				arcade: {
					gravity: { y: 0 },
					debug: false,
				},
			},
			scene: {
				preload: preload,
				create: create,
				update: update,
			},
			audio: {
				noAudio: true
			}
		}
		if (gameRef.current) {
			game = new Phaser.Game({ ...config, parent: gameRef.current, })
		}
	}

	// Start socket comunication with game server
	function socketListeners() {
		// Creates player
		gameSocket.current?.on('playerConstruct', (construct: playerConstruct) => {
			if (construct.side == 'left')
				creationQueue.left = construct
			else
				creationQueue.right = construct
		})
		// Update the moved player's position
		gameSocket.current?.on('newProps', (properties: newPropsToClient) => {
			moveQueue = properties
		})
		// Adapts direction of the player
		gameSocket.current?.on('changeDirection', (dir: playerDirections) => {
			if (dir.left != undefined)
				animationQueue.left = dir.left
			else
				animationQueue.left = undefined
			if (dir.right != undefined)
				animationQueue.right = dir.right
			else
				animationQueue.right = undefined
		})
		// Displays a game event on the scene
		gameSocket.current?.on('eventOn', (payload: GameEvent) => {
			if (payload == 'victory' || payload == 'defeat') {
				matchmakerBtnLocked.current = true
				// console.log("Button locked")
			}
			textEvent = payload
			textAction = 'display'
			setTimeout(() => {
				matchmakerBtnLocked.current = false
				// console.log("Button unlocked")
			}, 3500)
		})
		// Removes a game event on the scene
		gameSocket.current?.on('eventOff', () => {
			textEvent = 'stop'
			textAction = 'remove'
		})
		// Get the user back on the main page after end of a game
		gameSocket.current?.on('gameStopped', () => {
			gameSocket.current?.disconnect()
			gameSocket.current = undefined
			setInGame(false)
			navigate('/')
		})
		gameSocket.current?.on('lifeUpdate', (update: playerHP): any => {
			setPlayersHP(update)
			// console.log("New Update", update)
		})
	}

	// Construction of the whole page
	const [canvasWidth, setCanvasWidth] = useState(0)

	useLayoutEffect(() => handleResize(), [])

	useEffect(() => {
		window.addEventListener('resize', handleResize);

		socketListeners()
		createGame()
		return () => {
			if (game) {
				window.removeEventListener('resize', handleResize);
				keys.up.destroy()
				keys.down.destroy()
				keys.left.destroy()
				keys.down.destroy()
				ball?.sprite?.destroy()
				leftPlayer?.sprite?.destroy()
				rightPlayer?.sprite?.destroy()
				game.destroy(true, false)
			}
		}
	}, [])

	const handleResize = () => {
		const canvasForm = gameRef.current?.getBoundingClientRect()
		if (canvasForm && canvasForm.width)
			setCanvasWidth(canvasForm.width)
	}

	// React game element
	const borderStyle = (isBottom: boolean) => ({
		order: isBottom ? 3 : 1,
		minHeight: canvasWidth / 23,
		height: canvasWidth / 23
	})
	return (
		<main className='game main' ref={gameRef}>
			<div style={borderStyle(false)} />
			<div style={borderStyle(true)} />
		</main>
	)
}

export default Party
