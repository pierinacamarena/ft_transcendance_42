import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Socket } from 'socket.io-client'
import { AnimatePresence, motion } from 'framer-motion'
import { popUp, bouncyYMove, heightChangeByPx, fade } from './utils/ftMotion.tsx'
import { Timer } from './utils/ftNumbers.tsx'
import { ftFetch } from './Root.tsx'

// --------GAME-INFOS------------------------------------------------------ //
interface GameInfosProps {
	playersHP: any
	user: any
	opponent: any
}
export const GameInfos: React.FC<GameInfosProps> = ({
	playersHP, opponent, user
}) => {
	// ----STATES----------------------------- //
	const [playerLeftPP, setPlayerLeftPP] = useState<any>(null)
	const [playerRightPP, setPlayerRightPP] = useState<any>(null)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (playersHP.left.name == undefined) return

		ftFetch(
			`/avatars/${getAvatarFileName(playersHP.left.name)}`,
			undefined,
			undefined,
			'img'
		)
			.then(x => setPlayerLeftPP(URL.createObjectURL(x)))
			.catch(x => console.error('GameInfos():', x))

		ftFetch(
			`/avatars/${getAvatarFileName(playersHP.right.name)}`,
			undefined,
			undefined,
			'img'
		)
			.then(x => setPlayerRightPP(URL.createObjectURL(x)))
			.catch(x => console.error('GameInfos():', x))
	}, [playersHP])

	// ----HANDLERS--------------------------- //
	const getAvatarFileName = (username: string) => {
		if (username === user.nickname) return user.avatarFilename
		if (username === opponent.nickname) return opponent.avatarFilename
	}

	// ----ANIMATIONS------------------------- //
	const boxMotion = heightChangeByPx({ finalHeight: 275, inDuration: 0.7 })
	const childMotion = fade({ inDelay: 0.3 })

	// ----CLASSNAMES------------------------- //
	const name = 'gameInfo'
	const boxName = `${name}s`
	const playerNameName = `${name}-playerName`
	const playerPPName = `${name}-playerHP`
	const scoreName = `${name}-score`
	const timerName = `${name}-timer`

	// ----RENDER----------------------------- //
	return <motion.div className={boxName} {...boxMotion}>
		<motion.div className={playerPPName} {...childMotion}
			style={{ backgroundImage: playerLeftPP ? `url(${playerLeftPP})` : 'none' }} />
		<motion.div className={playerPPName} {...childMotion}
			style={{ backgroundImage: playerRightPP ? `url(${playerRightPP})` : 'none' }} />
		<motion.div className={playerNameName} {...childMotion}>
			{playersHP.left.name}
		</motion.div>
		<motion.div className={playerNameName} {...childMotion}>
			{playersHP.right.name}
		</motion.div>
		<motion.div className={scoreName} {...childMotion}>
			{playersHP.left.hp}
		</motion.div>
		<motion.div className={scoreName} {...childMotion}>
			{playersHP.right.hp}
		</motion.div>
		<motion.div className={timerName} {...childMotion}>
			<Timer />
		</motion.div>
	</motion.div>
}

// --------MATCHMAKER------------------------------------------------------ //
type connectionType = 'matchmaking' | 'private'
export interface MatchmakerProps {
	gameSocket: React.MutableRefObject<Socket<any, any> | undefined>
	btnLocked: React.MutableRefObject<boolean>
	inGame: boolean
	setInGame: React.Dispatch<React.SetStateAction<boolean>>
	matchmaking: boolean
	startGameSockets: (type: connectionType) => void
}
const Matchmaker: React.FC<MatchmakerProps> = ({
	gameSocket, btnLocked, inGame, setInGame, matchmaking, startGameSockets
}) => {
	// ----ROUTER----------------------------- //
	const navigate = useNavigate()

	// ----HANDLERS--------------------------- //
	const toggleMatchmaker = () => {
		if (btnLocked.current) return
		btnLocked.current = true
		if (!inGame) {
			if (!matchmaking) startGameSockets('matchmaking')
			else gameSocket.current?.emit('stopMatchmaking')
		}
		else {
			gameSocket.current?.disconnect()
			gameSocket.current = undefined
			setInGame(false)
			navigate('/')
		}
		const timer = setTimeout(() => { btnLocked.current = false }, 350)
		return () => clearTimeout(timer)
	}
	const matchmakerBtnHdl = { onMouseUp: toggleMatchmaker }

	// ----ANIMATIONS------------------------- //
	const popUpMotion = popUp({ inDuration: 0.3, outDuration: 0.3 })
	const boxMotion = {
		...bouncyYMove({
			from: 100,
			extra: -10,
			inDuration: 0.7,
			outDuration: 0.4
		}),
		whileHover: { scale: 1.05 }
	}
	const txtMotion = {
		...popUpMotion,
		initial: { ...popUpMotion.initial, rotate: -180 },
		animate: { ...popUpMotion.animate, rotate: 0 },
		exit: { ...popUpMotion.exit, rotate: -180 }
	}

	// ----CLASSNAMES------------------------- //
	const boxName = 'matchmaker'
	const txtName = `custom-txt ${boxName}-txt-${(
		inGame ? 'exit' : (matchmaking ? 'stop' : 'play')
	)}`

	// ----RENDER----------------------------- //
	return <motion.button
		className={boxName}
		{...boxMotion}
		{...matchmakerBtnHdl}>
		<AnimatePresence mode='wait'>
			<motion.div key={txtName} className={txtName} {...txtMotion}>
				{matchmaking && <Timer />}
			</motion.div>
		</AnimatePresence>
	</motion.button>
}
export default Matchmaker