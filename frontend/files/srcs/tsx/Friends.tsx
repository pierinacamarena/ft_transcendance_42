import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { fade, bouncyWidthChangeByPx, heightChangeByPx, xMove, bouncyXMove, yMove, mergeMotions, widthChange } from './utils/ftMotion.tsx'
import { ftFetch } from './Root.tsx'
import { Socket } from 'socket.io-client'

// --------CLASSNAMES------------------------------------------------------ //
const NAME = 'profile'
const FRIEND_NAME = `${NAME}-friend`
const FRIENDS_NAME = `${FRIEND_NAME}s`
const LIST_NAME = `${FRIENDS_NAME}-list`
const COL_NAME = `${LIST_NAME}-col`

// --------FRIEND-NAME----------------------------------------------------- //
interface FriendLinkProps {
	data: any
	setFriends: React.Dispatch<any>
	rejectedUsers: any
	state: string
}
const FriendLink: React.FC<FriendLinkProps> = ({
	data, setFriends, rejectedUsers, state
}) => {
	// ----STATES----------------------------- //
	const [delBtn, setDelBtn] = useState(false)
	const [overTxt, setOverTxt] = useState(false)
	const [pp, setPP] = useState<any>(null)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (data.avatarFilename == undefined || pp) return

		ftFetch(`/avatars/${data.avatarFilename}`, undefined, undefined, 'img')
			.then(x => setPP(URL.createObjectURL(x)))
			.catch(x => console.error('UserLink():', x))
	}, [data])

	const getLogTxtColor = () => {
		switch (state) {
			case 'online': return 'rgb(110, 210, 90)'
			case 'offline': return 'rgb(182, 50, 95)'
			default: return 'rgb(182, 174, 50)'
		}
	}

	// ----ANIMATIONS------------------------- //
	const boxHdl = {
		onMouseEnter: () => {
			setDelBtn(true)
			setOverTxt(true)
		},
		onMouseLeave: () => {
			setDelBtn(false)
			setOverTxt(false)
		}
	}
	const delBtnHdl = {
		onMouseEnter: () => setOverTxt(false),
		onMouseLeave: () => setOverTxt(true),
		onMouseUp: () => {
			let finded = false
			for (let x in rejectedUsers)
				if (rejectedUsers[x] === data.id) finded = true
			if (!finded) {
				rejectedUsers.push(data.id)
				localStorage.setItem('rejectedUsers', JSON.stringify(
					rejectedUsers
				))
			}
			if (data.id == undefined) return

			ftFetch(`/users/me/friends/${data.id}`, 'DELETE')
				.then(() => {
					ftFetch(`/users/me/friends`)
						.then(x => setFriends(x))
						.catch(x => console.error('Friends():', x))
				})
				.catch(x => console.error('FriendLink():', x))
		}
	}

	// ----ANIMATIONS------------------------- //
	const delbtnMotion = {
		...xMove({ from: 30, inDuration: 0.3, outDuration: 0.3 }),
		whileHover: { scale: 1.05 }
	}
	const txtMotion = {
		animate: overTxt ? { textShadow: '0px 0px 4px white' } : {}
	}

	// ----CLASSNAMES------------------------- //
	const boxName = `${FRIEND_NAME}-linkBox`
	const ppName = `${FRIEND_NAME}-pic`
	const linkName = `${FRIEND_NAME}-name`
	const delBtnName = `${FRIEND_NAME}-del-btn`

	// ----RENDER----------------------------- //
	return <div className={boxName} {...boxHdl}>
		<Link to={`/profile/${data.id}`} className={COL_NAME}>
			<div
				className={ppName}
				style={{ backgroundImage: pp ? `url(${pp})` : 'none' }}
			/>
			<div className={linkName}>
				<motion.h1 {...txtMotion}>{data.nickname}</motion.h1>
				<p style={{ color: getLogTxtColor() }}>{state}</p>
			</div>
		</Link>
		<AnimatePresence>
			{delBtn && <motion.button
				className={delBtnName}
				{...delBtnHdl}
				{...delbtnMotion}
			/>}
		</AnimatePresence>
	</div>
}

// --------FRIEND---------------------------------------------------------- //
interface FriendProps {
	id: number
	friendID: any
	setFriends: React.Dispatch<any>
	rejectedUsers: any
	state: string
}
const Friend: React.FC<FriendProps> = ({
	id, friendID, setFriends, rejectedUsers, state
}) => {
	// ----STATES----------------------------- //
	const [data, setData] = useState<any>({})
	const [games, setGames] = useState(0)
	const [winz, setWinz] = useState(0)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (friendID[1] == undefined) return

		ftFetch(`/users/${friendID[1]}`)
			.then(x => setData(x))
			.catch(x => console.error('Friend():', x))

		ftFetch(`/games/${friendID[1]}/count`)
			.then(x => setGames(x))
			.catch(x => console.error('Friend():', x))

		ftFetch(`/games/${friendID[1]}/victories`)
			.then(x => setWinz(Object.keys(x).length))
			.catch(x => console.error('Friend():', x))
	}, [])

	// ----ANIMATIONS------------------------- //
	const boxMotion = yMove({
		from: 100 * id,
		inDuration: 0.6 + 0.01 * id,
		outDuration: 0.5 - 0.01 * id
	})

	// ----CLASSNAMES------------------------- //
	const childBoxName = `${COL_NAME} ${COL_NAME}--bigFont`

	// ----RENDER----------------------------- //
	const friendBox = (content: string) => <div className={childBoxName}>
		{content}
	</div>
	return <motion.div className={FRIEND_NAME} {...boxMotion}>
		<FriendLink
			data={data}
			setFriends={setFriends}
			rejectedUsers={rejectedUsers}
			state={state}
		/>
		{friendBox(`${games}`)}
		{friendBox(`${winz}`)}
		{friendBox(`${games - winz}`)}
		{friendBox(`${(winz / games * 100).toFixed(2)}%`)}
		{friendBox(`${Number(data.rankPoints)}`)}
	</motion.div>
}

// --------FRIENDS-LIST---------------------------------------------------- //
interface FriendsListProps {
	friends: any
	setFriends: React.Dispatch<any>
	rejectedUsers: any
	socket: React.MutableRefObject<Socket | undefined>
}
const FriendsList: React.FC<FriendsListProps> = ({
	friends, setFriends, rejectedUsers, socket
}) => {
	// ----VALUES----------------------------- //
	const data = Object.entries(friends)

	// ----STATES---------------------------- //
	const [friendsState, setFriendsState] = useState<any>([])

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		socket.current?.on('updatedState', x => {
			setFriendsState(Object.entries(x))
		})
	}, [])

	useEffect(() => {
		const friendIds: number[] = []
		for (let x in data)
			friendIds.push(Number(data[x][1]))
		socket.current?.emit('friendsState', friendIds)
	}, [friends])

	// ----HANDLERS--------------------------- //
	const getFriendState = (id: any) => {
		for (let x in friendsState) {
			if (friendsState[x][0] == id[1])
				return friendsState[x][1]
		}
		return 'offline'
	}

	// ----CLASSNAMES------------------------- //
	const listHeadName = `${LIST_NAME}-head`
	const noFriendsTxtName = `${FRIENDS_NAME}-noFriends-txt`

	// ----RENDER----------------------------- //
	const renderFriends = Array.from({ length: friends.length }, (_, index) =>
		<Friend
			key={friends[index]}
			id={index + 1}
			friendID={data[index]}
			setFriends={setFriends}
			rejectedUsers={rejectedUsers}
			state={getFriendState(data[index])}
		/>
	)
	return <div className={LIST_NAME}>
		<div className={listHeadName}>
			<div className={COL_NAME}>NAME</div>
			<div className={COL_NAME}>MATCHES</div>
			<div className={COL_NAME}>WINS</div>
			<div className={COL_NAME}>LOSES</div>
			<div className={COL_NAME}>RATIO</div>
			<div className={COL_NAME}>RANKING</div>
		</div>
		{renderFriends}
		{!friends.length && <div className={noFriendsTxtName}>
			this is empty
		</div>}
	</div>
}

// --------ADD-FORM-------------------------------------------------------- //
interface AddFormProps {
	username: string
	users: any
	setFriends: React.Dispatch<any>
	rejectedUsers: any
}
const AddForm: React.FC<AddFormProps> = ({
	username, users, setFriends, rejectedUsers
}) => {
	// ----STATES----------------------------- //
	const [inputValue, setInputValue] = useState('')
	const [formLog, setFormLog] = useState('')

	// ----HANDLES---------------------------- //
	const inputHdl = {
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(e.target.value)
		}
	}
	const formHdl = {
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			addFriend()
		}
	}
	const addFriend = () => {
		let user
		for (let x in users) {
			if (users[x].nickname === inputValue) {
				user = users[x]
				break
			}
		}
		if (!user) {
			setFormLog('user not found')
			const timer = setTimeout(() => setFormLog(''), 2000)
			return () => clearTimeout(timer)
		}
		if (inputValue === username) {
			setFormLog('failed')
			const timer = setTimeout(() => setFormLog(''), 2000)
			return () => clearTimeout(timer)
		}
		for (let x in rejectedUsers)
			if (rejectedUsers[x] === user.id) {
				rejectedUsers.splice(x, 1)
				localStorage.setItem('rejectedUsers', JSON.stringify(
					rejectedUsers
				))
			}
		if (user.id == undefined) return

		ftFetch(`/users/me/friends/${user.id}`, 'POST')
			.then(() => {
				setFormLog('request sent')
				ftFetch(`/users/me/friends`)
					.then(x => setFriends(x))
					.catch(x => console.error('Friends():', x))
				const timer = setTimeout(() => setFormLog(''), 2000)
				return () => clearTimeout(timer)
			})
			.catch(x => {
				console.error('AddForm():', x)
				setFormLog('failed')
				const timer = setTimeout(() => setFormLog(''), 2000)
				return () => clearTimeout(timer)
			})
	}

	// ----ANIMATIONS------------------------- //
	const boxMove = (index: number) => bouncyXMove({
		from: 100,
		extra: -10,
		inDuration: 0.8 + 0.01 * index,
		outDuration: 0.5 - 0.01 * index
	})
	const headBtnMotion = (index: number) => ({
		...boxMove(index),
		whileHover: { scale: 1.05 }
	})
	const inputMotion = mergeMotions(
		bouncyWidthChangeByPx({ finalWidth: 325, inDuration: 1 }),
		boxMove(6)
	)
	const submitTxtMotion = xMove({
		from: -30, inDuration: 0.3, outDuration: 0.3
	})

	// ----CLASSNAMES------------------------- //
	const submitTxtName = `${FRIENDS_NAME}-submit-log${(
		formLog === 'request sent' ? ` ${FRIENDS_NAME}-submit-log--green` : ''
	)}`

	// ----RENDER----------------------------- //
	return <>
		<form {...formHdl}>
			<motion.input
				placeholder='add new friend'
				value={inputValue}
				{...inputHdl}
				{...inputMotion}
			/>
			<motion.button type='submit' {...headBtnMotion(1)}>
				ADD
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

// --------FRIENDS--------------------------------------------------------- //
interface FriendsProps {
	username: string
	users: any
	updateUsers: () => void
	socket: React.MutableRefObject<Socket | undefined>
}
const Friends: React.FC<FriendsProps> = ({
	username, users, updateUsers, socket
}) => {
	// ----VALUES----------------------------- //
	const rejectedUsersBase = localStorage.getItem('rejectedUsers')
	let rejectedUsers: any = []
	if (rejectedUsersBase) {
		try { rejectedUsers = JSON.parse(String(rejectedUsersBase)) }
		catch (x) { console.error('[ERROR] FriendRequests():', x) }
	}

	// ----STATES----------------------------- //
	const [friends, setFriends] = useState<any>({})

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		updateUsers()
		ftFetch(`/users/me/friends`)
			.then(x => setFriends(x))
			.catch(x => console.error('Friends():', x))
	}, [])

	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 1 })
	const headMotion = heightChangeByPx({ finalHeight: 200, inDuration: 0.6 })

	// ----CLASSNAMES------------------------- //
	const boxName = `${FRIENDS_NAME} main`
	const headName = `${FRIENDS_NAME}-head`

	// ----RENDER----------------------------- //
	return <motion.main className={boxName} {...boxMotion}>
		<motion.div className={headName} {...headMotion}>
			<AddForm
				username={username}
				users={users}
				setFriends={setFriends}
				rejectedUsers={rejectedUsers}
			/>
		</motion.div>
		<FriendsList
			friends={friends}
			setFriends={setFriends}
			rejectedUsers={rejectedUsers}
			socket={socket}
		/>
	</motion.main >
}
export default Friends
