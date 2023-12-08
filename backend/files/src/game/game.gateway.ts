/* -------------------------LIBRARIES IMPORTS------------------------- */

import { v4 as uuidv4 } from 'uuid';
import { Worker } from 'worker_threads'
import { Server, Socket } from 'socket.io';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ChatService } from '../chat/service/index.js';
import { UserService } from '../user/user.service.js';
import { UserGameService } from '../user_game/user_game.service.js';
import Characters from '../characters.json' assert { type: 'json' }
import { players, socketService } from '../main.js';

/* -------------------------TYPES------------------------- */

type Size = { width: number, height: number }
type Coordinates = { x: number, y: number }
type Side = 'left' | 'right'
type Direction = 'up' | 'down' | 'left' | 'right' | 'none'
type GameState = 'init' | 'ready' | 'created' | 'started' | 'stopped' | 'ended'
type workerMessage = newPropsFromWorker | GameState | GameEvent | playerLife | PlayerAchievements

const gameEvent = ['goal', '3', '2', '1', 'fight', 'blocked', 'stop', 'noHit'] as const;
type GameEvent = (typeof gameEvent)[number];

// Player key states
interface keyStates {
	up: boolean										// Player UP key state
	down: boolean									// Player DOWN key state
	left: boolean									// Player LEFT key state
	right: boolean									// Player RIGHT key state
}

// Players
export interface player {
	socket: Socket									// Player socket
	id: string										// Player ID
	userId: number									// Player user id
	nickname: string								// Player nickname
	workerId: string | undefined					// Player worker ID
	character: string								// Player character name
	state: string									// Player game state
}

// Player life display value
interface playerLife {
	left: number									// Left player display value
	right: number									// Right player display value
}

interface UserUpdate {
	left: {
		name: string
		hp: number
	}
	right: {
		name: string
		hp: number
	}
}

interface AchievementsTabs {
	left: boolean[],
	right: boolean[],
}

interface PlayerAchievements {
	leftAchiv: Achievement,
	rightAchiv: Achievement
}

interface Achievement {
	wasNotHit: boolean							// Player won a game without getting hit once
	hasNotHit: boolean							// Player lost a game without hitting the enemy once
	asGarrick: boolean							// Player wio a game with less than 10HP as Garrick
	asBoreas: boolean							// Player reached maximum buff as Boreas
	asHelios: boolean							// Player reached maximum buff as Helios
	asOrion: boolean							// Player avoided hit 4+ times as Orion
	asFaeleen: boolean							// Player crited 4+ times as Faeleen
	asThorian: boolean							// Player drained 25+ HP as Thorian
}

// Party worker
interface party {
	id: string										// Party id (worker ID)
	worker: Worker | undefined						// Party worker	
	workerState: GameState | undefined				// GameState of the party worker
	leftPlayer: player | undefined					// Left player client ID
	rightPlayer: player | undefined					// Right player client ID
	startTime: string								// Game start time
	remainingPlayers: number						// Number of remaining players in the party
}

// ----WORKER COMMUNICATION------------------------- //

// Login data (sent to the worker)
interface loginDataToWorker {
	workerId: string								// Worker own ID
}

// Players construction interface (sent to the worker)
interface playerConstructToWorker {
	side: Side										// Player side
	coords: Coordinates								// Player coordinates
	size: Size										// Player size
	character: string								// Player character
}

// New properties (sent by the worker)
interface newPropsFromWorker {
	workerId: string								// Worker ID
	leftProps: Coordinates							// Left player properties
	rightProps: Coordinates							// Right player properties
	ballProps: Coordinates							// Ball properties
}

// Player update (sent to the worker)
interface playerUpdateToWorker {
	side: Side										// Player side
	keyStates: keyStates							// Player key states
}

// ----CLIENT COMMUNICATION------------------------- //

// Player construction interface (sent to the client)
interface playerConstructToClient {
	side: Side										// Player side
	character: string								// Player character name
}

// New properties (sent to the client)
interface newPropsToClient {
	leftProps: Coordinates							// Left player properties
	rightProps: Coordinates							// Right player properties
	ballProps: Coordinates							// Ball properties
}

// New properties (sent by the client)
interface newPropsFromClient {
	keys: keyStates,								// Keys pressed by the client
	dir: Direction | undefined						// Direction of the client's player
}

// New direction for both players (sent to the client)
interface newDirectionToClient {
	left: Direction | undefined						// New direction of the left player
	right: Direction | undefined					// New direction of the right player
}

/* -------------------------WEBSOCKET-CLASS------------------------- */

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] }, namespace: 'game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private userService: UserService,
		private userGameService: UserGameService,
		private chatService: ChatService
	) { }

	@WebSocketServer()
	server: Server;

	// Constants
	private readonly screenHeight: number = 1080
	private readonly screenWidth: number = 1920
	private readonly privateRequests = new Map<string, number>()

	// Matchmaking queue
	private matchQueue: string[] = []
	// List of all ongoing parties (indexed by worker id)
	private parties: { [partyId: string]: party } = {}

	/* -------------------------FUNCTIONS------------------------- */

	wait(milliseconds: number) {
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}

	// Type checker for new props
	isNewProps(payload: workerMessage): payload is newPropsFromWorker {
		return (<newPropsFromWorker>payload).ballProps !== undefined
	}

	isGameEvent(payload: any): payload is GameEvent {
		return gameEvent.includes(payload);
	};

	isLifeUpdate(payload: workerMessage): payload is playerLife {
		return (<playerLife>payload).left !== undefined
	}

	isAchievements(payload: workerMessage): payload is PlayerAchievements {
		return (<PlayerAchievements>payload).leftAchiv !== undefined
	}

	// Create a new sesion player construct
	newWorkerConstruct(characterName: string, side: Side): playerConstructToWorker {
		let character = Characters[characterName]
		return {
			side: side,
			coords: {
				x: (side === 'left' ? 250 - character.size.width / 2 : this.screenWidth - 250 - character.size.width / 2),
				y: (this.screenHeight / 2 - character.size.height / 2),
			},
			size: { width: character.size.width, height: character.size.height },
			character: characterName
		}
	}

	// Get characters for both side, create the worker construct objects and emit them to the worker
	createWorkerConstructs(newParty: party) {
		if (newParty.leftPlayer && newParty.rightPlayer) {
			newParty.worker?.postMessage(this.newWorkerConstruct(newParty.leftPlayer.character, 'left'))
			newParty.worker?.postMessage(this.newWorkerConstruct(newParty.rightPlayer.character, 'right'))
		}
	}

	getAchievements(payload: PlayerAchievements): AchievementsTabs {
		console.log("Achievements:", payload)
		let achievements: AchievementsTabs = {
			left: [],
			right: [],
		}
		let i = 0
		for (let achievement in payload.leftAchiv) {
			achievements.left[i] = payload.leftAchiv[achievement]
			i++
		}
		i = 0
		for (let achievement in payload.rightAchiv) {
			achievements.right[i] = payload.rightAchiv[achievement]
			i++
		}
		return achievements
	}

	// Create the loginDataToWorker object to store the worker id and send it to the worker
	createWorker(newParty: party) {
		newParty.worker?.on('message', (payload: workerMessage) => {
			if (this.isNewProps(payload)) {
				let outgoingProps: newPropsToClient = {
					leftProps: payload.leftProps,
					rightProps: payload.rightProps,
					ballProps: payload.ballProps
				}
				newParty.leftPlayer?.socket?.emit('newProps', outgoingProps)
				newParty.rightPlayer?.socket?.emit('newProps', outgoingProps)
			}
			else if (this.isLifeUpdate(payload)) {
				if (payload.left == 0 || payload.right == 0) {
					this.playerIsDead((payload.left == 0 ? newParty.rightPlayer : newParty.leftPlayer), newParty)
				}
				let userUpdate: UserUpdate = {
					left: {
						name: newParty.leftPlayer.nickname,
						hp: payload.left
					},
					right: {
						name: newParty.rightPlayer.nickname,
						hp: payload.right
					}
				}
				newParty.leftPlayer?.socket?.emit('lifeUpdate', userUpdate)
				newParty.rightPlayer?.socket?.emit('lifeUpdate', userUpdate)
			}
			else if (this.isGameEvent(payload)) {
				switch (payload) {
					case ('stop'):
						newParty.leftPlayer?.socket?.emit('eventOff')
						newParty.rightPlayer?.socket?.emit('eventOff')
						break
					default:
						newParty.leftPlayer?.socket?.emit('eventOn', payload)
						newParty.rightPlayer?.socket?.emit('eventOn', payload)
				}
			}
			else if (this.isAchievements(payload)) {
				let achievements: {
					left: boolean[],
					right: boolean[]
				} = this.getAchievements(payload)
				let i = 0
				for (let achievement of achievements.left) {
					if (achievement) {
						console.log("creating achivement", i, "for player", newParty.leftPlayer.userId)
						this.userService.createAchievement(newParty.leftPlayer.userId, i)
					}
					i++
				}
				i = 0
				for (let achievement of achievements.right) {
					if (achievement) {
						console.log("creating achivement", i, "for player", newParty.rightPlayer.userId)
						this.userService.createAchievement(newParty.rightPlayer.userId, i)
					}
					i++
				}
				this.endWorker(newParty)
			}
			else {
				newParty.workerState = payload
				if (newParty.workerState == 'init')
					newParty.worker?.postMessage(<loginDataToWorker>{ workerId: newParty.id })
				else if (newParty.workerState == 'ready')
					this.createWorkerConstructs(newParty)
				else if (newParty.workerState == 'created' && newParty.leftPlayer.state == 'created' && newParty.rightPlayer.state == 'created')
					newParty.worker?.postMessage({ newState: <GameState>'started' })
			}
		})
	}

	// Starts a new party
	async createParty(leftPlayer: player, rightPlayer: player) {
		let newParty: party = {
			id: uuidv4(),
			worker: new Worker('./dist/worker/worker.js'),
			workerState: undefined,
			leftPlayer: leftPlayer,
			rightPlayer: rightPlayer,
			startTime: Date(),
			remainingPlayers: 2
		}
		newParty.leftPlayer?.socket?.emit('matched')
		newParty.rightPlayer?.socket?.emit('matched')
		console.log("Launching worker [" + newParty.id.slice(0, 4) + "]")
		this.parties[newParty.id] = newParty
		newParty.leftPlayer.workerId = newParty.id
		newParty.rightPlayer.workerId = newParty.id
		this.createWorker(newParty)
	}

	async sendOpponents(leftPlayer: player, rightPlayer: player) {
		let leftUser = await this.chatService.getUserFromSocket(leftPlayer.socket)
		let rightUser = await this.chatService.getUserFromSocket(rightPlayer.socket)
		leftPlayer.socket.emit('opponent', rightUser)
		rightPlayer.socket.emit('opponent', leftUser)
	}

	startPrivateGame(p1Socket: Socket, p2Socket: Socket) {
		console.log("Trying to launch private game")
		let leftPlayerId: string = p1Socket.id
		let rightPlayerId: string = p2Socket.id
		setTimeout(() => {
			let leftPlayer: player = players[leftPlayerId]
			let rightPlayer: player = players[rightPlayerId]
			if (leftPlayer === undefined || rightPlayer === undefined) {
				console.log("One or more players are missing, disconnecting")
				p1Socket.disconnect()
				p2Socket.disconnect()
			}
			else {
				this.sendOpponents(leftPlayer, rightPlayer);
				this.createParty(leftPlayer, rightPlayer);
			}
		}, 1000)
	}

	// Creates a new party if there is at least two player in the queue
	checkMatchQueue() {
		if (this.matchQueue.length >= 2) {
			let leftPlayerId: string = this.matchQueue.pop()
			let rightPlayerId: string = this.matchQueue.pop()
			setTimeout(() => {
				let leftPlayer: player = players[leftPlayerId]
				let rightPlayer: player = players[rightPlayerId]
				if (leftPlayer == undefined && rightPlayer != undefined)
					this.matchQueue.push(rightPlayer.id)
				else if (rightPlayer == undefined && leftPlayer != undefined)
					this.matchQueue.push(leftPlayer.id)
				else if (rightPlayer != undefined && leftPlayer != undefined) {
					this.sendOpponents(leftPlayer, rightPlayer)
					this.createParty(leftPlayer, rightPlayer)
				}
			}, 1500)
		}
	}

	// Create the player construct objects for clients and emit them to each client
	createWebConstructs(party: party) {
		if (party.leftPlayer && party.rightPlayer) {
			let leftClientConstruct: playerConstructToClient = { side: 'left', character: party.leftPlayer.character }
			let rightClientConstruct: playerConstructToClient = { side: 'right', character: party.rightPlayer.character }
			party.leftPlayer.socket?.emit('playerConstruct', leftClientConstruct)
			party.leftPlayer.socket?.emit('playerConstruct', rightClientConstruct)
			party.rightPlayer.socket?.emit('playerConstruct', leftClientConstruct)
			party.rightPlayer.socket?.emit('playerConstruct', rightClientConstruct)
		}
	}

	// Send results of a party to the database
	async sendPartyEnd(winner: player, party: party) {
		this.userGameService.createOne({
			player1: party.leftPlayer.userId,
			player2: party.rightPlayer.userId,
			timeStart: party.startTime,
			timeEnd: Date(),
			winner: winner.userId
		})
	}

	async playerIsDead(winner: player | undefined, party: party) {
		if (party.leftPlayer && party.rightPlayer && winner) {
			let loser: player = (winner.id == party.leftPlayer.id ? party.rightPlayer : party.leftPlayer)
			this.userService.updateRank(winner.userId, 10)
			this.userService.updateRank(loser.userId, -10)
			this.sendPartyEnd(winner, party)
			winner.socket?.emit('eventOn', 'victory')
			loser.socket?.emit('eventOn', 'defeat')
			setTimeout(() => {
				winner.socket?.emit('gameStopped')
				setTimeout(() => {
					loser.socket?.emit('gameStopped')
				}, 500)
			}, 2500)
		}
	}

	async endWorker(party: party) {
		party.worker?.terminate()
		if (party.worker)
			console.log('worker [' + party.id.slice(0, 4) + '] terminated')
		party.worker = undefined
	}

	/* -------------------------GLOBAL EVENT LISTENERS------------------------- */

	// Event handler for connection
	async handleConnection(socket: Socket, ...args: any[]) {
		console.log('New player connecting to game socket:', socket.id)
		let userData = await this.chatService.getUserFromSocket(socket)
		if (!userData)
			socket.disconnect()
		players[socket.id] = {
			socket: socket,
			id: socket.id,
			userId: userData.id,
			nickname: userData.nickname,
			workerId: undefined,
			character: userData.character,
			state: 'init'
		}
		console.log("New player in tab:", socket.id)
		socketService.setUser(players[socket.id].userId, socket);
		setTimeout(() => {
			socket.emit('connectionType')
		}, 100)
	}

	@SubscribeMessage('private')
	async handlePrivate(p1Socket: Socket, p2UserId: number) {
		// Store request in the map (socket p1, id p2)
		this.privateRequests.set(p1Socket.id, p2UserId)
		// Get user p1 from socket p1
		let p1User = await this.chatService.getUserFromSocket(p1Socket)
		// Get all p2 sockets from his id to see if invite is pending
		let p2SocketList: Socket[] = socketService.getUserSocketIds(p2UserId)
		for (let p2Socket of p2SocketList) {
			// If one of p2 sockets has p1 is as opponentID, start a game
			let p1UserID: number | undefined = this.privateRequests.get(p2Socket.id)
			if (p1UserID && p1UserID === p1User.id) {
				this.privateRequests.delete(p1Socket.id)
				this.privateRequests.delete(p2Socket.id)
				this.startPrivateGame(p1Socket, p2Socket)
				return
			}
		}
	}

	// Matchmaking request
	@SubscribeMessage('matchmaking')
	handleMatchmaking(socket: Socket) {
		this.matchQueue.push(socket.id)
		socket.emit('matching');
		this.checkMatchQueue()
	}

	// Event handler for stopMatchmaking requestplayer
	@SubscribeMessage('stopMatchmaking')
	handleStopMatchmaking(socket: Socket) {
		for (let index = 0; index < this.matchQueue.length; index++) {
			if (this.matchQueue[index] == socket.id) {
				this.matchQueue.splice(index, 1)
				break
			}
		}
		socket.emit('unmatched')
	}

	// Event handler for player key update
	@SubscribeMessage('playerKeyUpdate')
	handlePlayerKeyUpdate(socket: Socket, payload: newPropsFromClient) {
		let player: player = players[socket.id]
		if (player && player.workerId) {
			let party: party = this.parties[player.workerId]
			if (party.leftPlayer && party.rightPlayer) {
				let update: playerUpdateToWorker = {
					side: (party.leftPlayer.id == socket.id ? 'left' : 'right'),
					keyStates: payload.keys
				}
				party.worker?.postMessage(update)
				let dir: newDirectionToClient = {
					left: (party.leftPlayer.id == socket.id ? payload.dir : undefined),
					right: (party.rightPlayer.id == socket.id ? payload.dir : undefined)
				}
				party.leftPlayer.socket?.emit('changeDirection', dir)
				party.rightPlayer.socket?.emit('changeDirection', dir)
			}
		}
	}

	// Event handler for player state update
	@SubscribeMessage('playerStateUpdate')
	handlePlayerStateUpdate(socket: Socket, payload: GameState) {
		let player: player = players[socket.id]
		if (player && player.workerId) {
			let party: party = this.parties[player.workerId]
			if (party.leftPlayer && party.rightPlayer) {
				let playerSide = (party.leftPlayer.id == player.id ? 'leftPlayer' : 'rightPlayer')
				party[playerSide].state = payload
				if (party.rightPlayer.state == 'ready' && party.leftPlayer.state == 'ready')
					this.createWebConstructs(party)
				else if (party.workerState == 'created' && party.leftPlayer.state == 'created' && party.rightPlayer.state == 'created')
					party.worker?.postMessage({ newState: <GameState>'started' })
			}
		}
	}

	// Event handler for player disconnection
	async handleDisconnect(socket: Socket) {
		console.log("Socket disconnected:", socket.id)
		let disconnectedPlayer: player | undefined = players[socket.id]
		if (!disconnectedPlayer) return
		if (disconnectedPlayer.workerId === undefined) {
			delete players[socket.id]
			return
		}
		console.log("Worker id:", disconnectedPlayer.workerId);
		let party: party | undefined = this.parties[disconnectedPlayer.workerId]
		if (!party) {
			delete players[socket.id]
			return
		}
		// Si cet appel est le premier des deux joueurs
		if (party.remainingPlayers == 2) {
			party.remainingPlayers--
			// Si la partie s'est finie sur une mort
			if (party.workerState == 'ended')
				party.worker?.postMessage({ newState: 'achievements' })
			else {
				let remainingPlayer: player = (party.leftPlayer.id == disconnectedPlayer.id ? party.rightPlayer : party.leftPlayer)
				this.sendPartyEnd(remainingPlayer, party)
				remainingPlayer.socket?.emit('eventOn', 'victory')
				party.worker?.postMessage({ newState: 'stopped' })
				setTimeout(() => {
					remainingPlayer.socket?.emit('gameStopped')
				}, 3000)
				this.endWorker(party)
			}

		}
		else {
			delete players[party.leftPlayer.id]
			delete players[party.rightPlayer.id]
			party.leftPlayer = undefined
			party.rightPlayer = undefined
			delete this.parties[party.id]
		}
	}
}
