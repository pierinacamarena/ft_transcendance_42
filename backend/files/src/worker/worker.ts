/* -------------------------LIBRARIES IMPORTS------------------------- */

import Phaser from 'phaser'
import { parentPort } from 'worker_threads'
import { ArcadePhysics } from 'arcade-physics'
import Characters from '../characters.json' assert { type: 'json' }

/* -------------------------TYPES------------------------- */

import { ArcadePhysicsCallback, ArcadeProcessCallback } from 'arcade-physics/lib/physics/arcade/typedefs/types.js'
import { Body } from 'arcade-physics/lib/physics/arcade/Body.js'
import { Ball, Player, PlayerStats, PlayerConstruct, PlayerUpdate, PlayerValues, StateUpdate, NewProps, LoginData } from './types.js'
import { Size, Side, Coordinates } from './types.js'
import { Character, GameEvent, GameState, ParentPortMessage } from './types.js'

/* -------------------------VARIABLES------------------------- */

// Game constants
const screenWidth: number = 1920
const screenHeight: number = 1080
const targetFPS: number = 60
const speedCoefficient: number = 100
const ballRay: number = 26
const ballBaseSpeed: number = 6.5
const pWallSize: Size = {
	width: 85,
	height: 269
}

// Worker variables
let workerId: string | undefined = undefined
let identifier: string | undefined = undefined

// Entities
let leftPlayer: Player | undefined = undefined
let rightPlayer: Player | undefined = undefined
let ball: Ball | undefined = undefined

// Game variables
let tick: number = 0
let generalGameState: 'on' | 'off' = 'off'
let lastKickSide: Side | undefined = undefined

// Achievements variables
let nbCrit: PlayerValues = {
	left: 0,
	right: 0
}
let nbBlock: PlayerValues = {
	left: 0,
	right: 0
}
let stolenLife: PlayerValues = {
	left: 0,
	right: 0
}

// Physics initialisation
const physics: ArcadePhysics = new ArcadePhysics({
	width: screenWidth,
	height: screenHeight,
	gravity: {
		x: 0,
		y: 0
	}
})

/* -------------------------CREATION FUNCTIONS------------------------- */

//Get the base statistics for a character
function getBaseStats(characterName: Character): PlayerStats {
	return {
		healthPoints: Characters[characterName].hp,
		attackPoints: Characters[characterName].attack,
		defensePoints: Characters[characterName].defense,
		speedPoints: Characters[characterName].speed,
		critChance: (characterName === 'Faeleen' ? 30 : 0),
		blockChance: (characterName === 'Orion' ? 30 : 0),
		lifeSteal: (characterName === 'Thorian' ? 30 : 0)
	}
}

// Create the ball
function createBall() {
	ball = {
		body: physics.add.body(screenWidth / 2 - ballRay, screenHeight / 2 - ballRay),
		speed: 0
	}
	ball.body.setCircle(ballRay)
	ball.body.setCollideWorldBounds(true, undefined, undefined, true)
	ball.body.setBounce(1, 1)
	ball.body.onWorldBounds = true
	physics.world.on('worldbounds', (body: Body, up: boolean, down: boolean, left: boolean, right: boolean) => {
		if (body.isCircle && (left || right)) {
			ball.body.onWorldBounds = false
			const collisionSide = (left ? 'left' : 'right')
			let resolveStatus: string = resolveGoal(collisionSide)
			if (resolveStatus != 'ended')
				goalTransition(resolveStatus)
			else
				generalGameState = 'off'
		}
	})
}

// Gives the ball it's initial impulse
function initialImpulseBall() {
	lastKickSide = undefined
	let initialSpeed = speedCoefficient * ballBaseSpeed
	let randomAngle = Math.random() * 2 * Math.PI
	ball?.body.setVelocity(initialSpeed * Math.cos(randomAngle), initialSpeed * Math.sin(randomAngle))
}

// Recalculates the ball speed after collision
function recomputeBallSpeed(ballBody: Body) {
	let globalVelocity = Math.sqrt(Math.pow(ballBody.velocity.x, 2) + Math.pow(ballBody.velocity.y, 2))
	let normalX = ballBody.velocity.x / globalVelocity
	let normalY = ballBody.velocity.y / globalVelocity
	globalVelocity = (ball.speed + ballBaseSpeed) * speedCoefficient
	if (globalVelocity > 1500)
		globalVelocity = 1500
	ballBody.setVelocity(normalX * globalVelocity, normalY * globalVelocity)
}

// Right ball collider
const rightBallColliderCallback: ArcadePhysicsCallback = (playerBody: Body, ballBody: Body) => {
	if (lastKickSide != 'right')
		ball.speed = ball.speed + 1
	recomputeBallSpeed(ballBody)
	lastKickSide = 'right'
}

// Left ball collider
const leftBallColliderCallback: ArcadePhysicsCallback = (playerBody: Body, ballBody: Body) => {
	if (lastKickSide != 'left')
		ball.speed = ball.speed + 1
	recomputeBallSpeed(ballBody)
	lastKickSide = 'left'
}

// Destroys the ball and all it's colliders
function destroyBall() {
	if (ball) {
		ball.leftUpPWallCollider?.destroy()
		ball.leftUpPWallCollider = undefined
		ball.leftDownPWallCollider?.destroy()
		ball.leftDownPWallCollider = undefined
		ball.rightUpPWallCollider?.destroy()
		ball.rightUpPWallCollider = undefined
		ball.rightDownPWallCollider?.destroy()
		ball.rightDownPWallCollider = undefined
		ball?.body.destroy()
		ball = undefined
	}
}

// Resets the ball to it's starting position
function resetBall() {
	physics.world.removeAllListeners()
	destroyBall()
	createBall()
}

// Creates passive walls for Liliana
function createPassiveWalls(player: Player) {
	let pWall1: Coordinates = {
		x: (player.side === 'left' ? 0 : 1920 - pWallSize.width),
		y: 0
	}
	let pWall2: Coordinates = {
		x: (player.side === 'left' ? 0 : 1920 - pWallSize.width),
		y: 1080 - pWallSize.height
	}
	player.passiveWallBodies = {
		up: physics.add.staticBody(pWall1.x, pWall1.y, pWallSize.width, pWallSize.height),
		down: physics.add.staticBody(pWall2.x, pWall2.y, pWallSize.width, pWallSize.height)
	}
	if (ball) {
		if (player.side === 'left') {
			ball.leftUpPWallCollider = physics.add.collider(ball.body, player.passiveWallBodies.up)
			ball.leftDownPWallCollider = physics.add.collider(ball.body, player.passiveWallBodies.down)
		}
		else {
			ball.rightUpPWallCollider = physics.add.collider(ball.body, player.passiveWallBodies.up)
			ball.rightDownPWallCollider = physics.add.collider(ball.body, player.passiveWallBodies.down)
		}
	}
}

// Create all player colliders
function createPlayerColliders(player: Player) {
	player.body.setCollideWorldBounds(true, undefined, undefined, undefined)
	player.body.setImmovable(true)
	if (ball) {
		let collideCallback: ArcadePhysicsCallback = (player.side == 'left' ? leftBallColliderCallback : rightBallColliderCallback)
		player.ballCollider = physics.add.collider(player.body, ball.body, collideCallback)
	}
}

// Destroy a player and all it's colliders
function destroyPlayer(player: Player) {
	player.ballCollider?.destroy()
	player.ballCollider = undefined
	player.body.destroy()
	player.body = undefined
}

// Create a new player
function createPlayer(construct: PlayerConstruct) {
	let newPlayer: Player = {
		side: construct.side,
		body: physics.add.body(construct.coords.x, construct.coords.y, construct.size.width, construct.size.height),
		character: construct.character,
		achievements: {
			wasNotHit: true,
			hasNotHit: true,
			asBoreas: false,
			asHelios: false,
			asFaeleen: false,
			asGarrick: false,
			asOrion: false,
			asThorian: false
		},
		stats: getBaseStats(construct.character),
		construct: construct
	}
	createPlayerColliders(newPlayer)
	if (newPlayer.character == 'Liliana')
		createPassiveWalls(newPlayer)
	if (leftPlayer) rightPlayer = newPlayer
	else leftPlayer = newPlayer
}

// Resets a player to it's starting position
function resetPlayer(player: Player) {
	destroyPlayer(player)
	player.body = physics.add.body(player.construct.coords.x, player.construct.coords.y, player.construct.size.width, player.construct.size.height)
	createPlayerColliders(player)
	if (player.character == 'Liliana')
		createPassiveWalls(player)
}

/* -------------------------UPDATE FUNCTIONS------------------------- */

// Update players local speed using keyStates recieved from main process
function updatePlayer(updatedPlayer: PlayerUpdate) {
	const player: Player = (updatedPlayer.side == 'left' ? leftPlayer : rightPlayer)
	const totalSpeed: number = (speedCoefficient * player.stats.speedPoints)
	let xVel: number = 0
	let yVel: number = 0
	if (updatedPlayer.keyStates.up) yVel = yVel - totalSpeed
	if (updatedPlayer.keyStates.down) yVel = yVel + totalSpeed
	if (updatedPlayer.keyStates.left) xVel = xVel - totalSpeed
	if (updatedPlayer.keyStates.right) xVel = xVel + totalSpeed
	if (xVel && yVel) {
		xVel = (totalSpeed / 2) * Math.SQRT2 * (xVel / totalSpeed)
		yVel = (totalSpeed / 2) * Math.SQRT2 * (yVel / totalSpeed)
	}
	if (leftPlayer && rightPlayer) {
		if (updatedPlayer.side == leftPlayer.side) leftPlayer.body.setVelocity(xVel, yVel)
		else rightPlayer.body.setVelocity(xVel, yVel)
	}
}

// Update the game state following the state update
async function updateState(newStateContainer: StateUpdate) {
	switch (newStateContainer.newState) {
		case ('started'):
			if (tick == 0) {
				let playerLife: PlayerValues = {
					left: leftPlayer.stats.healthPoints,
					right: rightPlayer.stats.healthPoints
				}
				parentPort?.postMessage(playerLife)
				await playCountdown()
				initialImpulseBall()
			}
			generalGameState = 'on'
			break
		case ('achievements'):
			parentPort?.postMessage({ leftAchiv: leftPlayer.achievements, rightAchiv: rightPlayer.achievements })
			break
		case ('stopped'):
			generalGameState = 'off'
			break
	}
}

// Make all calculations of damage/buff/debuff after a goal
function resolveGoal(side: Side): string {
	// Roles
	let attacker: Player = (side == 'right' ? leftPlayer : rightPlayer)
	let attackee: Player = (side == 'right' ? rightPlayer : leftPlayer)
	//Crit
	let crit: number = 1
	if (attacker.stats.critChance)
		crit = (Math.ceil(Math.random() * (100 / attacker.stats.critChance)) == 1 ? 2 : 1)
	if (crit != 1) {
		nbCrit[attacker.side] = nbCrit[attacker.side] + 1
		if (nbCrit[attacker.side] >= 4) {
			attacker.achievements.asFaeleen = true
			console.log(identifier, "Faeleen achievement unlocked")
		}
	}
	let attack: number = attacker.stats.attackPoints * crit
	//Defense
	let defenseModifier: number = (attacker.character == 'Rylan' ? 1 / 2 : 1)
	let damage: number = attack - (attackee.stats.defensePoints * defenseModifier * crit)
	//Blocked
	let blocked: string = 'false'
	if (attackee.character == 'Orion' && Math.ceil(Math.random() * (100 / attackee.stats.blockChance)) == 1 || damage == 0) {
		damage = 0
		blocked = 'true'
		nbBlock[attacker.side] = nbBlock[attacker.side] + 1
		if (nbBlock[attacker.side] >= 4) {
			attacker.achievements.asOrion = true
			console.log(identifier, "Orion achievement unlocked")
		}
	}
	//Damage application
	attackee.stats.healthPoints = Math.ceil(attackee.stats.healthPoints - damage)
	if (damage > 0) {
		attackee.achievements.wasNotHit = false
		attacker.achievements.hasNotHit = false
	}
	if (attackee.stats.healthPoints < 0)
		attackee.stats.healthPoints = 0
	if (attackee.stats.healthPoints === 0 && attacker.character === 'Garrick') {
		if (attacker.stats.healthPoints < 10) {
			attacker.achievements.asGarrick = true
			console.log(identifier, "Garrick achievement unlocked")
		}
	}
	//Buffs after goal
	if (blocked == 'false') {
		// Attackees
		if (attackee.character == 'Boreas') {
			let buff = attackee.stats.defensePoints - Characters['Boreas'].defense
			if (buff < 4)
				buff = buff + 1
			if (buff == 4) {
				attackee.achievements.asBoreas = true
				console.log(identifier, "Boreas achievement unlocked")
			}
			attackee.stats.defensePoints = Characters['Boreas'].defense + buff
			console.log(identifier, attackee.side, "Boreas defense is now:", attackee.stats.defensePoints)
		}
		else if (attackee.character == 'Helios') {
			if (attackee.stats.attackPoints != Characters['Helios'].attack)
				console.log(identifier, attackee.side, "Helios attack was reset to:", Characters['Helios'].attack)
			attackee.stats.attackPoints = Characters['Helios'].attack
		}
		else if (attackee.character == 'Garrick') {
			attackee.stats.attackPoints = Characters['Garrick'].attack + Math.ceil((Characters['Garrick'].hp - attackee.stats.healthPoints) / 10)
			console.log(identifier, attackee.side, "Garrick attack is now:", attackee.stats.attackPoints)
		}
		else if (attackee.character == 'Selene') {
			attacker.stats.speedPoints = Math.ceil(Characters[attacker.character].speed / 2)
			console.log(identifier, attackee.side, "Selene has debuffed ennemy")
		}
		// Attackers
		if (attacker.character == 'Boreas') {
			if (attacker.stats.defensePoints != Characters['Boreas'].defense)
				console.log(identifier, attacker.side, "Boreas defense was reset to:", Characters['Boreas'].defense)
			attacker.stats.defensePoints = Characters['Boreas'].defense
		}
		else if (attacker.character == 'Helios') {
			let buff = attacker.stats.attackPoints - Characters['Helios'].attack
			if (buff < 4)
				buff = buff + 1
			if (buff == 4) {
				attacker.achievements.asHelios = true
				console.log(identifier, "Helios achievement unlocked")
			}
			attacker.stats.attackPoints = Characters['Helios'].attack + buff
			console.log(identifier, attacker.side, "Helios attack is now:", attacker.stats.attackPoints)
		}
		else if (attacker.character == 'Thorian') {
			let lifeSteal: number = Math.ceil(damage / (100 / attacker.stats.lifeSteal))
			attacker.stats.healthPoints = attacker.stats.healthPoints + lifeSteal
			if (attacker.stats.healthPoints > Characters['Thorian'].hp) {
				lifeSteal = lifeSteal - (attacker.stats.healthPoints - Characters['Thorian'].hp)
				attacker.stats.healthPoints = Characters['Thorian'].hp
			}
			stolenLife[attacker.side] = stolenLife[attacker.side] + lifeSteal
			if (stolenLife[attacker.side] >= 25) {
				attacker.achievements.asThorian = true
				console.log(identifier, "Thorian achievement unlocked")
			}
			console.log(identifier, attacker.side, "Thorian health is now:", attacker.stats.healthPoints)
		}
		else if (attacker.character == 'Selene') {
			attackee.stats.speedPoints = Characters[attackee.character].speed
			console.log(identifier, attacker.side, "Selene debuff was cleared")
		}
	}
	let newLife: PlayerValues = {
		left: leftPlayer.stats.healthPoints,
		right: rightPlayer.stats.healthPoints
	}
	parentPort?.postMessage(newLife)
	if (newLife.left == 0 || newLife.right == 0) {
		blocked = 'ended'
		sendState('ended')
	}
	return blocked
}

// Displays goal animation
function displayAnim(anim: GameEvent) {
	parentPort?.postMessage(anim)
}

// Reset all entities to their respective start position
function resetEntities() {
	if (leftPlayer && rightPlayer) {
		resetBall()
		resetPlayer(leftPlayer)
		resetPlayer(rightPlayer)
		update()
	}
}

// Displays a piece of text on the screen
function displayText(event: GameEvent, timeout: number): Promise<void> {
	return new Promise<void>((resolve) => {
		displayAnim(event)
		setTimeout(() => {
			displayAnim('stop')
			setTimeout(() => {
				resolve()
			}, 100)
		}, (timeout > 100 ? timeout - 100 : 100))
	});
}

// Displays the combat countdown on the screen
async function playCountdown() {
	await displayText('3', 1000)
	await displayText('2', 1000)
	await displayText('1', 1000)
	await displayText('fight', 500)
}

// Triggered on goal, starts a new round 
async function goalTransition(blocked: string) {
	generalGameState = 'off'
	if (blocked == 'false')
		await displayText('goal', 3000)
	else
		await displayText('blocked', 3000)
	resetEntities()
	await playCountdown()
	initialImpulseBall()
	generalGameState = 'on'
}

/* -------------------------PORT INPUT------------------------- */

// Check if incomming data type loginData
function isLogin(incomingData: ParentPortMessage): incomingData is LoginData {
	return (<LoginData>incomingData).workerId !== undefined
}

// Check if incomming data type is playerConstruct
function isConstruct(incomingData: ParentPortMessage): incomingData is PlayerConstruct {
	return (<PlayerConstruct>incomingData).coords !== undefined
}

// Check if incomming data type is playerUpdate
function isPlayerUpdate(incomingData: ParentPortMessage): incomingData is PlayerUpdate {
	return (<PlayerUpdate>incomingData).keyStates !== undefined
}

// Check if incomming data type is stateUpdate
function isStateUpdate(incomingData: ParentPortMessage): incomingData is StateUpdate {
	return (<StateUpdate>incomingData).newState !== undefined
}

// Backend messages listeners
function portListener() {
	parentPort?.on('message', (incomingData: ParentPortMessage) => {
		if (isLogin(incomingData)) {
			workerId = incomingData.workerId
			identifier = '[' + workerId.slice(0, 4) + '] '
			sendState('ready')
		}
		else if (isConstruct(incomingData)) {
			createPlayer(incomingData)
			if (leftPlayer && rightPlayer)
				sendState('created')
		}
		else if (isPlayerUpdate(incomingData)) {
			updatePlayer(incomingData)
		}
		else if (isStateUpdate(incomingData)) {
			updateState(incomingData)
			sendState(incomingData.newState)
		}
		else {
			console.log(identifier, 'ERROR: Wrong message type')
		}
	})
}

/* -------------------------PORT OUTPUT------------------------- */

// Returns coordinates of a body
function getProperties(body: Body): Coordinates {
	return {
		x: body.x,
		y: body.y
	}
}

// Send objects properties to backend
function sendProperties() {
	if (workerId && leftPlayer && ball && rightPlayer && parentPort) {
		let newProps: NewProps = {
			workerId: workerId,
			leftProps: getProperties(leftPlayer.body),
			rightProps: getProperties(rightPlayer.body),
			ballProps: getProperties(ball.body)
		}
		parentPort.postMessage(newProps)
	}
}

// Send the state to the backend
function sendState(state: GameState) {
	if (state != 'achievements')
		parentPort?.postMessage(state)
}

/* -------------------------MAIN FUNCTIONS------------------------- */

// Update the game to the next tick
function update() {
	physics.world.update(tick * 1000, 1000 / targetFPS)
	physics.world.postUpdate()
	tick++
	sendProperties()
}

function main() {
	portListener()
	createBall()
	sendState('init')
	setInterval(() => {
		if (generalGameState === 'on') {
			update()
		}
	}, 1000 / targetFPS)
}

main()