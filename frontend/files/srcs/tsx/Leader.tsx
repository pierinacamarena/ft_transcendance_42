import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { fade, bouncyWidthChangeByPx, heightChangeByPx, bouncyXMove, yMove, mergeMotions, xMove } from './utils/ftMotion.tsx'
import { ftFetch } from './Root.tsx'

// --------CLASSNAMES------------------------------------------------------ //
const NAME = 'leader'
const COL_NAME = `${NAME}-col`

// --------USER-LINK------------------------------------------------------- //
interface UserLinkProps {
	boxName: string
	rank: number
	userID: number
	usr: any
}
const UserLink: React.FC<UserLinkProps> = ({
	boxName, rank, userID, usr
}) => {
	// ----STATES----------------------------- //
	const [pp, setPP] = useState<any>(null)
	const [over, setOver] = useState(false)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (usr.id == undefined) return

		ftFetch(`/avatars/${usr.avatarFilename}`, undefined, undefined, 'img')
			.then(x => setPP(URL.createObjectURL(x)))
			.catch(x => console.error('UserLink():', x))
	}, [])

	// ----HANDLERS--------------------------- //
	const nameBoxHdl = {
		onMouseEnter: () => setOver(true),
		onMouseLeave: () => setOver(false)
	}

	// ----ANIMATIONS------------------------- //
	const nameMotion = {
		animate: over ? { textShadow: '0px 0px 4px white' } : {}
	}

	// ----CLASSNAMES------------------------- //
	const rankName = `${boxName}-rank`
	const ppName = `${boxName}-pic`
	const linkTxtName = `${boxName}-link-txt`

	// ----RENDER----------------------------- //
	return <Link
		to={`/profile${usr.id !== userID ? `/${usr.id}` : ''}`}
		className={COL_NAME}
		{...nameBoxHdl}>
		<div className={rankName}>#{rank}</div>
		<div
			className={ppName}
			style={{ backgroundImage: pp ? `url(${pp})` : 'none' }}
		/>
		<motion.div className={linkTxtName} {...nameMotion}>
			{usr.nickname}
		</motion.div>
	</Link>
}

// --------USER------------------------------------------------------------ //
interface UserStatsProps {
	rank: number
	userID: number
	usr: any
}
const UserStats: React.FC<UserStatsProps> = ({ rank, usr, userID }) => {
	// ----STATES----------------------------- //
	const [games, setGames] = useState(0)
	const [winz, setWinz] = useState(0)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (usr.id == undefined) return

		ftFetch(`/games/${usr.id}/count`)
			.then(x => setGames(x))
			.catch(x => console.error('UserStats():', x))

		ftFetch(`/games/${usr.id}/victories`)
			.then(x => setWinz(Object.keys(x).length))
			.catch(x => console.error('UserStats():', x))
	}, [])

	// ----ANIMATIONS------------------------- //
	const boxMotion = yMove({
		from: 100 * rank,
		inDuration: 0.6 + 0.01 * rank,
		outDuration: 0.5 - 0.01 * rank
	})

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}-usr`
	const colName = `${COL_NAME} ${COL_NAME}--bigFont`

	// ----RENDER----------------------------- //
	const usrBox = (content: string) => <div className={colName}>
		{content}
	</div>
	return <motion.div className={boxName} {...boxMotion}>
		<UserLink boxName={boxName} rank={rank} userID={userID} usr={usr} />
		{usrBox(`${games}`)}
		{usrBox(`${winz}`)}
		{usrBox(`${games - winz}`)}
		{usrBox(`${(winz / games * 100).toFixed(2)}%`)}
		{usrBox(`${usr.rankPoints}`)}
	</motion.div>
}

// --------BOARD----------------------------------------------------------- //
interface BoardProps {
	data: any[]
	from: number
	userID: number
}
const Board: React.FC<BoardProps> = ({ data, from, userID }) => {
	// ----VALUES----------------------------- //
	let count = data.length < 20 ? data.length : 20
	if (from + count > data.length)
		from = data.length - count

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}-body`
	const headName = `${NAME}-boardHead`

	// ----RENDER----------------------------- //
	const renderUsers = Array.from({ length: count }, (_, index) =>
		<UserStats
			key={index}
			rank={from + index + 1}
			usr={data[from + index]}
			userID={userID}
		/>
	)
	return <div className={boxName}>
		<div className={headName}>
			<div className={COL_NAME}>NAME</div>
			<div className={COL_NAME}>MATCHES</div>
			<div className={COL_NAME}>WINS</div>
			<div className={COL_NAME}>LOSES</div>
			<div className={COL_NAME}>RATIO</div>
			<div className={COL_NAME}>RANKING</div>
		</div>
		{renderUsers}
	</div>
}

// --------SEARCH-FORM----------------------------------------------------- //
interface SearchFormProps {
	data: any[]
	setFrom: React.Dispatch<React.SetStateAction<number>>
	boxMove: any
	headBtnMotion: any
}
const SearchForm: React.FC<SearchFormProps> = ({
	data, setFrom, boxMove, headBtnMotion
}) => {
	// ----STATES----------------------------- //
	const [inputValue, setInputValue] = useState('')
	const [formLog, setFormLog] = useState('')

	// ----HANDLERS--------------------------- //
	const inputHdl = {
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(e.target.value)
		}
	}
	const formHdl = {
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			searchUser(inputValue)
		}
	}
	const searchUser = (username: string) => {
		const ret = data.findIndex((x: any) => x.nickname === username)
		if (ret < 0) setFormLog('user not found')
		else {
			setFrom(ret - 10 >= 0 ? ret - 10 : 0)
			setFormLog('user found')
		}
		const timer = setTimeout(() => setFormLog(''), 2000)
		return () => clearTimeout(timer)
	}

	// ----ANIMATIONS------------------------- //
	const headInputMotion = mergeMotions(
		bouncyWidthChangeByPx({ finalWidth: 325, inDuration: 1 }),
		boxMove(6)
	)
	const submitTxtMotion = xMove({
		from: -30, inDuration: 0.3, outDuration: 0.3
	})

	// ----CLASSNAMES------------------------- //
	const submitTxtName = `${NAME}-form-log${(
		formLog === 'user found' ? ` ${NAME}-form-log--green` : ''
	)}`

	// ----RENDER----------------------------- //
	return <>
		<form {...formHdl}>
			<motion.input
				placeholder='user search'
				{...headInputMotion}
				{...inputHdl}
			/>
			<motion.button type='submit' {...headBtnMotion(5)}>
				OK
			</motion.button>
		</form>
		<AnimatePresence>
			{formLog.length !== 0 && <motion.div
				className={submitTxtName}
				{...submitTxtMotion}>
				{formLog}
			</motion.div>}
		</AnimatePresence>
	</>
}

// --------HEAD-CONTENT---------------------------------------------------- //
interface HeadContentProps {
	userID: number
	data: any[]
	setFrom: React.Dispatch<React.SetStateAction<number>>
}
const HeadContent: React.FC<HeadContentProps> = ({
	userID, data, setFrom
}) => {
	// ----HANDLERS--------------------------- //
	const downBtnHdl = {
		onMouseUp: () => setFrom(x => (
			x + 20 < data.length - 20 ?
				x + 20
				:
				data.length - 20 < 0 ? 0 : data.length - 20
		))
	}
	const upBtnHdl = {
		onMouseUp: () => setFrom(x => (x - 20 >= 0 ? x - 20 : 0))
	}
	const findMeBtnHdl = {
		onMouseUp: () => {
			const myRank = data.findIndex((item: any) =>
				item.id === userID
			)
			setFrom(myRank - 10 >= 0 ? myRank - 10 : 0)
		}
	}
	const findTopBtnHdl = { onMouseUp: () => setFrom(0) }

	// ----ANIMATIONS------------------------- //
	const boxMove = (index: number) => bouncyXMove({
		from: 100 * index,
		extra: -10,
		inDuration: 0.8 + 0.02 * index,
		outDuration: 0.5 - 0.01 * index
	})
	const headBtnMotion = (index: number) => ({
		...boxMove(index),
		whileHover: { scale: 1.05 }
	})

	// ----CLASSNAMES------------------------- //
	const headBtnName = (nameExt: string) => `${NAME}-${nameExt}-btn`

	// ----RENDER----------------------------- //
	const headBtn = (
		index: number, nameExt: string, content: string, hdl: {}
	) => (
		<motion.button
			className={headBtnName(nameExt)}
			{...headBtnMotion(index)}
			{...hdl}>
			{content}
		</motion.button>
	)
	return <>
		{headBtn(1, 'down', '>>', downBtnHdl)}
		{headBtn(2, 'up', '<<', upBtnHdl)}
		{headBtn(3, 'findMe', 'FIND ME', findMeBtnHdl)}
		{headBtn(4, 'findTop', 'TOP', findTopBtnHdl)}
		<SearchForm
			data={data}
			boxMove={boxMove}
			headBtnMotion={headBtnMotion}
			setFrom={setFrom}
		/>
	</>
}

// --------LEADER---------------------------------------------------------- //
interface LeaderProps {
	userID: number
	users: any
	updateUsers: () => void
}
const Leader: React.FC<LeaderProps> = ({ userID, users, updateUsers }) => {
	// ----STATES----------------------------- //
	const [data, setData] = useState<any[]>([])
	const [from, setFrom] = useState(0)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		const temp = (users ? Object.values(users) : [])
		temp.sort((a: any, b: any) => b.rankPoints - a.rankPoints)
		setData(temp)

		updateUsers()
	}, [Object.keys(users).length])

	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 1 })
	const headMotion = heightChangeByPx({ finalHeight: 200, inDuration: 0.6 })

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME} main`
	const headName = `${NAME}-head`

	// ----RENDER----------------------------- //
	return <motion.main className={boxName} {...boxMotion}>
		<motion.div className={headName} {...headMotion}>
			<HeadContent
				userID={userID}
				data={data}
				setFrom={setFrom}
			/>
		</motion.div>
		<Board data={data} from={from} userID={userID} />
	</motion.main >
}
export default Leader