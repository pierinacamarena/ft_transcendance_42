import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import { AnimatePresence, motion } from 'framer-motion'
import { popUp, xMove, yMove } from './utils/ftMotion.tsx'
import NavBar from './NavBar.tsx'
import { ChatBtn } from './old-Chat.tsx'
import WorkingChat from './Chat/index.tsx'
import Matchmaker, { GameInfos } from './Matchmaker.tsx'
import Home from './Home.tsx'
import AccountInfos from './AccountInfos.tsx'
import Friends from './Friends.tsx'
import Leader from './Leader.tsx'
import Characters from './Characters.tsx'
import Party from './Game.tsx'
import ErrorPage from './ErrorPage.tsx'
import '../css/Root.css'

// --------VALUES---------------------------------------------------------- //
export const BACK_ADDR = `http://${process.env.HOST_IP}:${process.env.BACK_PORT}`

// --------FT-FETCH-------------------------------------------------------- //
export const ftFetch = async (
	uri: string, method?: string, body?: any, answType?: string
) => {
	try {
		const answ = await fetch(`${BACK_ADDR}${uri}`, {
			method: method ? method : 'GET',
			credentials: 'include',
			mode: 'cors',
			body: body
		})
		if (answ.ok) switch (answType) {
			case 'img': return await answ.blob()
			case 'txt': return await answ.text()
			default: return await answ.json()
		}
		else { throw await answ.text() }
	}
	catch (error) { throw error }
}

// --------LOGIN----------------------------------------------------------- //
interface LoginProps {
	show2FA: boolean
	setShowContent: React.Dispatch<React.SetStateAction<boolean>>
	login: () => (() => void) | undefined
	socket: React.MutableRefObject<any>
}
const Login: React.FC<LoginProps> = ({ show2FA, login }) => {
	// ----STATES----------------------------- //
	const [inputValue, setInputValue] = useState('')
	const [errorLog, setErrorLog] = useState('')

	// ----HANDLERS--------------------------- //
	const login42btnHdl = {
		onMouseUp: () => {
			localStorage.setItem('logged', '1')
			window.location.href = `${BACK_ADDR}/auth/42/login`
		}
	}
	const inputHdl = {
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(e.target.value)
		}
	}
	const formHdl = {
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			const body = new URLSearchParams({ 'code': inputValue })
			ftFetch(`/auth/2FA/verify`, 'POST', body, 'txt')
				.then(() => login())
				.catch(x => {
					console.error('Login():', x)
					if (x) {
						try {
							const msg = JSON.parse(x)
							if (msg && msg.message) {
								setErrorLog(msg.message)
								const timer = setTimeout(() => setErrorLog(''), 2000)
								return () => clearTimeout(timer)
							}
						}
						catch (x) { console.error('[ERROR] FriendRequests():', x) }
					}
				})
		}
	}

	// ----ANIMATIONS------------------------- //
	const loginTxtNameMotion = yMove({ from: -30 })
	const popUpMotion = popUp({})
	const login42btnMotion = {
		...popUpMotion,
		whileHover: { scaleX: 1.1, scaleY: 1.1 }
	}
	const btnMotion = { whileHover: { scale: 1.05 } }
	const errorLogMotion = yMove({
		from: -30, inDuration: 0.3, outDuration: 0.3
	})

	// ----CLASSNAMES------------------------- //
	const loginTxtName = `login-txt`
	const login42btnName = `login-42btn`
	const twoFactorName = `login-2fa`

	// ----RENDER----------------------------- //
	return <>
		<motion.div className={loginTxtName} {...loginTxtNameMotion}>
			login with
		</motion.div>
		<motion.button
			className={login42btnName}
			{...login42btnMotion}
			{...login42btnHdl}
		/>
		{show2FA && <motion.form
			className={twoFactorName}
			{...formHdl}
			{...popUpMotion}>
			<input
				placeholder='google auth code'
				value={inputValue}
				{...inputHdl}
			/>
			<motion.button type='submit' {...btnMotion}>
				submit
			</motion.button>
			<AnimatePresence>
				{errorLog && <motion.div {...errorLogMotion}>
					{errorLog}
				</motion.div>}
			</AnimatePresence>
		</motion.form>}
	</>
}

// --------FRIEND-REQUESTS------------------------------------------------- //
interface FriendRequestsProps {
	users: any
	updateUsers: () => void
}
const FriendRequests: React.FC<FriendRequestsProps> = ({
	users, updateUsers
}) => {
	// ----VALUES----------------------------- //
	const rejectedUsersBase = localStorage.getItem('rejectedUsers')
	let rejectedUsers: any = []
	if (rejectedUsersBase) {
		try { rejectedUsers = JSON.parse(String(rejectedUsersBase)) }
		catch (x) { console.error('[ERROR] FriendRequests():', x) }
	}

	// ----STATES----------------------------- //
	const [requests, setRequests] = useState<any>([])

	// ----EFFECTS---------------------------- //
	useEffect(() => checkRequests(), [location.pathname])

	// ----HANDLERS--------------------------- //
	const checkRequests = () => {
		ftFetch(`/users/me/friends/requests/received`)
			.then(req => {
				ftFetch(`/users/me/friends`)
					.then(friends => {
						let temp = []
						for (let x in req) {
							let rejected = false
							for (let y in rejectedUsers)
								if (req[x].requester === rejectedUsers[y]) {
									rejected = true
									break
								}
							if (rejected) continue

							temp.push(req[x])
							for (let z in friends)
								if (req[x].requester === friends[z]) {
									temp.pop()
									break
								}
						}
						updateUsers()
						setRequests([...temp])
					})
					.catch(x => console.error('FriendRequests():', x))
			})
			.catch(x => console.error('FriendRequests():', x))
	}
	const acceptBtnHdl = (id: number) => ({
		onMouseUp: () => {
			ftFetch(`/users/me/friends/${id}`, 'POST')
				.then(() => {
					let temp: Array<any> = requests
					for (let x in temp)
						if (temp[x].requester === id) temp.splice(Number(x), 1)
					setRequests([...temp])
				})
				.catch(x => console.error('FriendRequests():', x))
		}
	})
	const declineBtnHdl = (id: number) => ({
		onMouseUp: () => {
			rejectedUsers.push(id)
			localStorage.setItem('rejectedUsers', JSON.stringify(
				rejectedUsers
			))
			let temp: Array<any> = requests
			for (let x in temp)
				if (temp[x].requester === id) temp.splice(Number(x), 1)
			setRequests([...temp])
		}
	})

	// ----ANIMATIONS------------------------- //
	const requestMotion = xMove({
		from: -30, inDuration: 0.3, outDuration: 0.3
	})
	const btnMotion = { whileHover: { scale: 1.05 } }

	// ----CLASSNAMES------------------------- //
	const boxName = 'friend-requests'

	// ----RENDER----------------------------- //
	const render = Array.from({ length: requests.length }, (_, index) => {
		let requesterName
		for (let x in users) {
			if (users[x].id === requests[index].requester) {
				requesterName = users[x].nickname
				break
			}
		}
		return <motion.div key={index} {...requestMotion}>
			<div>{requesterName}<br />wants to be friend with you</div>
			<motion.button
				{...acceptBtnHdl(requests[index].requester)}
				{...btnMotion}>
				accept
			</motion.button>
			<motion.button
				{...declineBtnHdl(requests[index].requester)}
				{...btnMotion}>
				decline
			</motion.button>
		</motion.div>
	})
	return <div className={boxName}>
		<AnimatePresence>{render}</AnimatePresence>
	</div>
}

// --------ROOT------------------------------------------------------------ //
const Root: React.FC = () => {
	// ----TYPES------------------------------ //
	type connectionType = 'matchmaking' | 'private'

	// ----ROUTER----------------------------- //
	const location = useLocation()
	const navigate = useNavigate()

	// ----REFS------------------------------- //
	const socket = useRef<Socket | undefined>(undefined)
	const gameSocket = useRef<Socket | undefined>(undefined)
	const matchmakerBtnLocked = useRef(false)

	// ----STATES----------------------------- //
	const [user, setUser] = useState<any>({})
	const [users, setUsers] = useState<any>({})
	const [opponent, setOpponent] = useState<any>({})

	const [show2FA, setShow2FA] = useState(false)
	const [showContent, setShowContent] = useState(false)
	const [inGame, setInGame] = useState(false)
	const [playersHP, setPlayersHP] = useState({
		left: { name: undefined, hp: 0 },
		right: { name: undefined, hp: 0 }
	})
	const [matchmaking, setMatchmaking] = useState(false)

	// ----EFFECTS---------------------------- //
	useLayoutEffect(() => {
		if (!localStorage.getItem('rejectedUsers'))
			localStorage.setItem('rejectedUsers', '[]')
		if (!localStorage.getItem('logged'))
			localStorage.setItem('logged', '0')
	}, [])

	useEffect(() => {
		loginCheck()
		if (location.pathname === '/game' && !inGame) navigate('/')
		if (location.pathname !== '/game' && inGame) {
			setInGame(false)
			gameSocket.current?.disconnect()
			gameSocket.current = undefined
		}
	}, [location.pathname])

	// ----HANDLERS--------------------------- //
	const closeApp = () => {
		setShowContent(false)
		if (location.pathname !== '/login')
			window.location.href = `http://${process.env.HOST_IP}:8080/login`
		socket.current?.disconnect()
	}
	const loginCheck = () => {
		if (localStorage.getItem('logged') === '0')
			return closeApp()

		ftFetch('/users/connected')
			.then(() => login())
			.catch(x => {
				console.error('Root():', x)
				closeApp()
				if (x) {
					try {
						const data = JSON.parse(x)
						if (data && data.message
							&& data.message === 'require second authentication step')
							setShow2FA(true)
					}
					catch (x) { console.error('[ERROR] Root():', x) }
				}
			})
	}
	const login = () => {
		setShow2FA(false)
		updateUser()
		updateUsers()
		if (!socket.current) {
			try {
				socket.current = io(`${BACK_ADDR}/chat`, {
					transports: ['websocket'],
					withCredentials: true
				})
			}
			catch (error) { console.error('Root():', error) }
		}
		if (location.pathname === '/login') {
			navigate('/')
			const timer = setTimeout(() => setShowContent(true), 500)
			return () => clearTimeout(timer)
		}
		else setShowContent(true)
	}
	const updateUser = () => {
		ftFetch(`/users/self`)
			.then(x => setUser((data: any) => ({ ...data, ...x })))
			.catch(x => console.error('Root():', x))
	}
	const updateUsers = () => {
		ftFetch(`/users/all`)
			.then(x => setUsers((data: any) => ({ ...data, ...x })))
			.catch(x => console.error('Root():', x))
	}
	const startGameSockets = (type: connectionType, opponentID?: number) => {
		// console.log('opponentId', opponentID);
		try {
			gameSocket.current = io(`${BACK_ADDR}/game`, {
				transports: ['websocket'],
				withCredentials: true,
			})
		}
		catch (error) { console.error('[ERROR] Matchmaker():', error) }
		gameSocket.current?.on('connectionType', () => {
			// console.log("Recieved connexion type")
			if (opponentID === undefined)
				gameSocket.current?.emit(type)
			else {
				// console.log('opponentId to send private', opponentID);
				gameSocket.current?.emit(type, opponentID)
			}
		})
		gameSocket.current?.on('matching', () => setMatchmaking(true))
		gameSocket.current?.on('matched', () => {
			matchmakerBtnLocked.current = true
			setMatchmaking(false)
			setInGame(true)
			navigate('/game')
			const timer = setTimeout(() => {
				matchmakerBtnLocked.current = false
			}, 1000)
			return () => clearTimeout(timer)
		})
		gameSocket.current?.on('unmatched', () => {
			gameSocket.current?.disconnect()
			gameSocket.current = undefined
			setMatchmaking(false)
		})
		gameSocket.current?.on('opponent', (x: any): void => {
			setOpponent(x)
		})
	}

	// ----CLASSNAMES------------------------- //
	const boxName = 'root' + (inGame ? ' root--ig' : '')
	const headerName = 'header'

	// ----RENDER----------------------------- //
	return <div className={boxName}>
		<AnimatePresence>
			{showContent && <header key={headerName} className='header'>
				{!inGame && <NavBar />}
				{inGame && user.id && opponent.id && <GameInfos
					user={user}
					opponent={opponent}
					playersHP={playersHP}
				/>}
				{!inGame && <ChatBtn />}
				<Matchmaker
					gameSocket={gameSocket}
					btnLocked={matchmakerBtnLocked}
					inGame={inGame}
					setInGame={setInGame}
					matchmaking={matchmaking}
					startGameSockets={startGameSockets}
				/>
			</header>}
		</AnimatePresence>
		<AnimatePresence>
			{showContent
				&& !inGame
				&& user.id
				&& location.pathname !== '/login'
				&& <FriendRequests
					key='FriendRequests'
					users={users}
					updateUsers={updateUsers}
				/>
			}
		</AnimatePresence>
		<AnimatePresence mode='wait'>
			<Routes location={location} key={location.pathname}>
				<Route path='/login' element={<Login
					show2FA={show2FA}
					setShowContent={setShowContent}
					login={login}
					socket={socket}
				/>} />
				<Route path='/' element={<Home
					selectedCharacter={user.character}
				/>} />
				<Route path='/profile/*' element={<>
					{user.id && <AccountInfos
						userID={user.id}
						updateUser={updateUser}
					/>}
				</>} />
				<Route path='/profile/friends' element={<>
					{user.nickname && <Friends
						socket={socket}
						username={user.nickname}
						users={users}
						updateUsers={updateUsers}
					/>}
				</>} />
				<Route path='/characters' element={<>
					{user.character && <Characters
						selectedCharacter={user.character}
						updateUser={updateUser}
					/>}
				</>} />
				<Route path='/leader' element={<Leader
					userID={user.id}
					users={users}
					updateUsers={updateUsers}
				/>} />
				<Route path='/game' element={<Party
					gameSocket={gameSocket}
					matchmakerBtnLocked={matchmakerBtnLocked}
					setInGame={setInGame}
					setPlayersHP={setPlayersHP}
				/>} />
				<Route path='/chat' element={<>
					{socket.current && <WorkingChat
						socket={socket.current}
						startGameSockets={startGameSockets}
					/>}
				</>} />
				<Route path='*' element={<ErrorPage code={404} />} />
			</Routes>
		</AnimatePresence>
	</div>
}
export default Root
