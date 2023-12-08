/* -------------------------IMPORTS------------------------- */

import { StaticBody } from 'arcade-physics/lib/physics/arcade/StaticBody.js'
import { Collider } from 'arcade-physics/lib/physics/arcade/Collider.js'
import { Body } from 'arcade-physics/lib/physics/arcade/Body.js'

/* -------------------------COMMON TYPES------------------------- */

export type Size = { width: number, height: number }
export type Coordinates = { x: number, y: number }
export type Side = 'left' | 'right'

/* -------------------------CUSTOM TYPES------------------------- */

export type GameState = 'init' | 'ready' | 'created' | 'started' | 'stopped' | 'ended' | 'achievements'
export type ParentPortMessage = PlayerConstruct | PlayerUpdate | LoginData | StateUpdate
export type GameEvent = 'goal' | 'blocked' | '3' | '2' | '1' | 'fight' | 'stop' | 'noHit'
export type Character = 'Boreas' | 'Helios' | 'Selene' | 'Liliana' | 'Orion' | 'Faeleen' | 'Rylan' | 'Garrick' | 'Thorian' | 'Test'

/* -------------------------PLAYER INTERFACES------------------------- */

export interface Player {
	side: Side									// Player side
	body: Body									// Player body
	character: Character						// Player character name
	stats: PlayerStats							// Player actual stats
	achievements: PlayerAchievements			// Player achievements stats
	construct: PlayerConstruct					// Player construct
	passiveWallBodies?: PassiveWalls			// Passive wall body
	ballCollider?: Collider						// Ball collider
}

export interface PlayerAchievements {
	wasNotHit: boolean							// Player won a game without getting hit once
	hasNotHit: boolean							// Player lost a game without hitting the enemy once
	asGarrick: boolean							// Player wio a game with less than 10HP as Garrick
	asBoreas: boolean							// Player reached maximum buff as Boreas
	asHelios: boolean							// Player reached maximum buff as Helios
	asOrion: boolean							// Player avoided hit 4+ times as Orion
	asFaeleen: boolean							// Player crited 4+ times as Faeleen
	asThorian: boolean							// Player drained 25+ HP as Thorian
}

export interface PlayerConstruct {
	side: Side									// Player side
	coords: Coordinates							// Player coordinates
	size: Size									// Player size
	character: Character						// Player character
}

// Player statistics interface
export interface PlayerStats {
	healthPoints: number						// Player HP
	attackPoints: number						// Player ATK
	defensePoints: number						// Player DEF
	speedPoints: number							// Player SPD
	critChance: number							// Player Crit %
	blockChance: number							// Player Block %
	lifeSteal: number							// Player Life Steal %
}

export interface KeyStates {
	up: boolean									// Player UP key state
	down: boolean								// Player DOWN key state
	left: boolean								// Player LEFT key state
	right: boolean								// Player RIGHT key state
}

export interface PlayerValues {
	left: number								// Left player life
	right: number								// Right player life
}

/* -------------------------OTHER ENTITIES------------------------- */

export interface PassiveWalls {
	up: StaticBody,								// Up wall
	down: StaticBody							// Down wall
}

export interface Ball {
	body: Body									// Ball body
	speed: number								// Ball speed
	leftUpPWallCollider?: Collider				// Left up passive wall collider
	leftDownPWallCollider?: Collider			// Left down passive wall collider
	rightUpPWallCollider?: Collider				// Right up passive wall collider
	rightDownPWallCollider?: Collider			// Right down passive wall collider
}

/* -------------------------COMMUNICATION------------------------- */

export interface LoginData {
	workerId: string							// Worker id
}

export interface StateUpdate {
	newState: GameState							// New worker game state
}

export interface PlayerUpdate {
	side: Side									// Player side
	keyStates: KeyStates						// Player key states
}

export interface NewProps {
	workerId: string							// Worker id
	leftProps: Coordinates						// Left player coordinates
	rightProps: Coordinates						// Right player coordinates
	ballProps: Coordinates						// Ball coordinates
}
