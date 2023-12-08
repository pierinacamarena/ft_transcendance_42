import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { fade, widthChangeByPercent, heightChangeByPercent, yMove, mergeMotions, xMove } from './utils/ftMotion.tsx'
import { ftFetch } from './Root.tsx'
import * as achievments from '../resources/achievments.json'

// --------CLASSNAMES------------------------------------------------------ //
const NAME = 'profile'
const INFOS_NAME = `${NAME}-accountInfos`
const ACHIEVEMENT_NAME = `${NAME}-achievement`
const ACHIEVEMENTS_NAME = `${ACHIEVEMENT_NAME}s`
const STATS_NAME = `${NAME}-stats`
const HISTORY_NAME = `${NAME}-history`

// --------MATCH----------------------------------------------------------- //
interface MatchProps {
	userID: number
	pageOwner: any
	data: any
	index: number
}
const Match: React.FC<MatchProps> = ({ pageOwner, userID, data, index }) => {
	// ----VALUES----------------------------- //
	const enemyID = (
		data[index][1].player1 === pageOwner.id ?
			data[index][1].player2 : data[index][1].player1
	)

	// ----STATES----------------------------- //
	const [enemyInfos, setEnemyInfos] = useState<any>({})

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (!pageOwner.id || enemyID == undefined) return

		ftFetch(`/users/${enemyID}`)
			.then(x => setEnemyInfos(x))
			.catch(x => console.error('Match()', x))
	}, [pageOwner.id])

	// ----CLASSNAMES------------------------- //
	const boxName = `${HISTORY_NAME}-match`
	const userBoxName = `${boxName}-box ${boxName}-user-box`
	const enemyBoxName = `${boxName}-box ${boxName}-enemy-box`
	const winName = `${boxName}-middleTxt ${boxName}-won`
	const loseName = `${boxName}-middleTxt ${boxName}-lost`

	// ----RENDER----------------------------- //
	const renderResult = () => {
		if (data[index][1].winner === pageOwner.id)
			return <div className={winName}>WON</div>
		else
			return <div className={loseName}>LOST</div>
	}
	const renderUserScore = () => <div className={userBoxName}>
		{pageOwner.nickname}
	</div>
	const renderEnemyScore = () => <Link
		to={`/profile${pageOwner.id === userID ? `/${enemyInfos.id}` : ''}`}
		className={enemyBoxName}>
		{enemyInfos.nickname}
	</Link>
	return <div className={boxName}>
		{renderUserScore()}
		{renderResult()}
		{renderEnemyScore()}
	</div>
}

// --------HISTORY--------------------------------------------------------- //
interface HistoryProps {
	userID: number
	pageOwner: any
	userHistory: any
}
const History: React.FC<HistoryProps> = ({ userID, pageOwner, userHistory }) => {
	// ----VALUES----------------------------- //
	const data = Object.entries(userHistory)

	// ----RENDER----------------------------- //
	const render = Array.from({ length: data.length }, (_, index) =>
		<Match
			key={index}
			data={data}
			pageOwner={pageOwner}
			userID={userID}
			index={index}
		/>
	)
	return <div className={HISTORY_NAME}>
		{!data.length && <h1>no recent matches</h1>}
		{render}
	</div>
}

// --------STATS----------------------------------------------------------- //
interface StatsProps {
	userHistory: any
	pageOwner: any
	winsCount: number
}
const Stats: React.FC<StatsProps> = ({ userHistory, pageOwner, winsCount }) => {
	// ----VALUES----------------------------- //
	const data = Object.entries(userHistory)

	// ----ANIMATIONS------------------------- //
	const txtMotion = fade({ inDuration: 0.2, outDuration: 0.2, inDelay: 0.5 })

	// ----CLASSNAMES------------------------- //
	const statsFirstLineName = `${STATS_NAME}-firstLine`
	const statsSecondLineName = `${STATS_NAME}-secondLine`

	// ----RENDER----------------------------- //
	return <div className={STATS_NAME}>
		<motion.div className={statsFirstLineName} {...txtMotion}>
			{data.length} MATCHES / {winsCount} WINS / {data.length - winsCount} LOSES
		</motion.div>
		<motion.div className={statsSecondLineName} {...txtMotion}>
			RATIO: {(winsCount / data.length * 100).toFixed(2)}% / RANK POINTS: {pageOwner.rankPoints}
		</motion.div>
	</div>
}

// --------ACHIEVEMENTS---------------------------------------------------- //
interface AchievementsProps {
	pageOwner: any
}
const Achievements: React.FC<AchievementsProps> = ({ pageOwner }) => {
	// ----VALUES----------------------------- //
	const data = Object.entries(achievments)

	// ----STATES----------------------------- //
	const [unlocked, setUnlocked] = useState<any>([])

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (pageOwner.id == undefined) return

		ftFetch(`/users/${pageOwner.id}/achievements`)
			.then(x => {
				const temp = Object.entries(x)
				setUnlocked(temp)
			})
			.catch(x => console.error('Achievements():', x))
	}, [pageOwner])

	// ----HANDLERS--------------------------- //
	const isUnlocked = (id: number) => {
		for (let x in unlocked)
			if (unlocked[x][1].achievId == id) {
				let temp = unlocked[x][1].time.substring(0, 10)
				temp = temp.split('-')
				return `${temp[2]}-${temp[1]}-${temp[0]}`
			}
		return ''
	}

	// ----ANIMATIONS------------------------- //
	const achievementMotion = (index: number) => yMove({
		from: 400 * index,
		inDuration: 0.9 + 0.02 * index,
		outDuration: 0.5 - 0.01 * index
	})

	// ----CLASSNAMES------------------------- //
	const unitName = (id: number) => (
		`${ACHIEVEMENT_NAME}${(
			isUnlocked(id) ? ` ${ACHIEVEMENT_NAME}--unlocked` : ''
		)}`
	)
	const countName = `${ACHIEVEMENTS_NAME}-head`
	const listName = `${ACHIEVEMENTS_NAME}-list`
	const lockIconName = `${ACHIEVEMENT_NAME}-lockIcon`
	const unlockedTxTName = `${ACHIEVEMENT_NAME}-unlockedTxt`

	// ----RENDER----------------------------- //
	const render = Array.from({ length: data.length - 1 }, (_, index) => {
		const time = isUnlocked(index)
		return <motion.div
			className={unitName(index)}
			key={`${ACHIEVEMENT_NAME}-${index + 1}`}
			{...achievementMotion(index + 1)}>
			<h1>{data[index][0]}</h1>
			<p>{data[index][1]}</p>
			{time ?
				<div className={unlockedTxTName}>since {time}</div>
				: <div className={lockIconName} />
			}
		</motion.div>
	})
	return <>
		<div className={countName}>ACHIEVEMENTS</div>
		<div className={listName}>{render}</div>
	</>
}

// --------SET-2FA--------------------------------------------------------- //
interface Set2FAProps {
	pageOwner: any
	setShowSettings: React.Dispatch<React.SetStateAction<number>>
	setSettingsLog: React.Dispatch<React.SetStateAction<string>>
}
const Set2FA: React.FC<Set2FAProps> = ({
	pageOwner, setShowSettings, setSettingsLog
}) => {
	// ----STATES----------------------------- //
	const [qrcode, setQrcode] = useState<any>(null)
	const [enabled, setEnabled] = useState(false)
	const [activated, setActivated] = useState(pageOwner.twoFactorAuthStatus)
	const [qrcodeExitBtn, setQrcodeExitBtn] = useState(false)
	const [activateForm, setActivateForm] = useState(false)
	const [inputValue, setInputValue] = useState('')

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		ftFetch('/auth/2FA/secret')
			.then(x => x ? setEnabled(true) : setEnabled(false))
			.catch(x => console.error('[ERROR] Set2FA():', x))
	}, [])

	// ----HANDLERS--------------------------- //
	const cancelBtnHdl = { onMouseUp: () => setShowSettings(0) }
	const onOffBtnHdl = {
		onMouseUp: () => {
			if (!enabled) {
				setSettingsLog('please get your qrcode first')
				const timer = setTimeout(() => setSettingsLog(''), 2000)
				return () => clearTimeout(timer)
			}
			setActivateForm(true)
		}
	}
	const qrcodeBtnHdl = {
		onMouseUp: () => {
			if (!enabled) {
				ftFetch(`/auth/2FA/secret/new`, 'POST')
					.then(() => {
						setEnabled(true)
						ftFetch(`/auth/2FA/qrcode`, undefined, undefined, 'img')
							.then(x => setQrcode(URL.createObjectURL(x)))
							.catch(x => {
								setSettingsLog('failed')
								console.error('Set2FA():', x)
								const timer = setTimeout(() => {
									setSettingsLog('')
								}, 2000)
								return () => clearTimeout(timer)
							})
					})
					.catch(x => {
						setSettingsLog('failed')
						console.error('Set2FA():', x)
						const timer = setTimeout(() => setSettingsLog(''), 2000)
						return () => clearTimeout(timer)
					})
			}
			else {
				ftFetch(`/auth/2FA/qrcode`, undefined, undefined, 'img')
					.then(x => setQrcode(URL.createObjectURL(x)))
					.catch(x => {
						setSettingsLog('failed')
						console.error('Set2FA():', x)
						const timer = setTimeout(() => setSettingsLog(''), 2000)
						return () => clearTimeout(timer)
					})
			}
		}
	}
	const qrcodeBoxHdl = {
		onMouseEnter: () => setQrcodeExitBtn(true),
		onMouseLeave: () => setQrcodeExitBtn(false)
	}
	const qrcodeExitBtnHdl = { onMouseUp: () => setQrcode(null) }
	const inputHdl = {
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(e.target.value)
		}
	}
	const nameFormHdl = {
		onSubmit: (e: any) => {
			e.preventDefault()
			if (e.nativeEvent.submitter?.className === formBackBtnName)
				return
			if (!inputValue) {
				setSettingsLog('no entry')
				const timer = setTimeout(() => setSettingsLog(''), 2000)
				return () => clearTimeout(timer)
			}
			const body = new URLSearchParams({ 'code': inputValue })
			ftFetch(`/auth/2FA/verify`, 'POST', body, 'txt')
				.then(() => {
					if (!activated) {
						ftFetch(`/auth/2FA/on`, 'POST')
							.then(() => {
								setSettingsLog('success')
								setActivated(true)
								setActivateForm(false)
								setShowSettings(0)
								const timer = setTimeout(() => setSettingsLog(''), 2000)
								return () => clearTimeout(timer)
							})
							.catch(x => {
								setSettingsLog('failed')
								console.error('Set2FA():', x)
								const timer = setTimeout(() => setSettingsLog(''), 2000)
								return () => clearTimeout(timer)
							})
					}
					else {
						ftFetch(`/auth/2FA/off`, 'POST')
							.then(() => {
								setSettingsLog('success')
								setActivated(false)
								setActivateForm(false)
								setShowSettings(0)
								const timer = setTimeout(() => setSettingsLog(''), 2000)
								return () => clearTimeout(timer)
							})
							.catch(x => {
								setSettingsLog('failed')
								console.error('Set2FA():', x)
								const timer = setTimeout(() => setSettingsLog(''), 2000)
								return () => clearTimeout(timer)
							})
					}
				})
				.catch(x => {
					console.error('Login():', x)
					if (x) {
						try {
							const msg = JSON.parse(x)
							if (msg && msg.message) {
								setSettingsLog(msg.message)
								const timer = setTimeout(() => setSettingsLog(''), 2000)
								return () => clearTimeout(timer)
							}
						}
						catch (x) { console.error('[ERROR] FriendRequests():', x) }
					}
				})
		}
	}

	// ----ANIMATIONS------------------------- //
	const btnMotion = { whileHover: { scale: 1.05 } }
	const mainMotion = xMove({ from: -30, inDuration: 0.3, outDuration: 0.3 })
	const qrCodeExitBtnMotion = {
		...xMove({ from: -30, inDuration: 0.3, outDuration: 0.3 }),
		...btnMotion
	}

	// ----CLASSNAMES------------------------- //
	const settingsSelectName = `${NAME}-settings-select`
	const qrcodeBoxName = `${NAME}-2fa-qrcodeBox`
	const formSubmitBtnName = `${NAME}-form-submit-btn`
	const formBackBtnName = `${NAME}-form-back-btn`
	const nameFormName = `${NAME}-name-form`

	// ----RENDER----------------------------- //
	return <>
		{!qrcode && !activateForm && <motion.div
			className={settingsSelectName}
			{...mainMotion}>
			<motion.button {...onOffBtnHdl} {...btnMotion}>
				{activated ? <>disable</> : <>enable</>}
			</motion.button>
			<motion.button {...qrcodeBtnHdl} {...btnMotion}>
				get qrcode
			</motion.button>
			<motion.button {...cancelBtnHdl} {...btnMotion}>
				back
			</motion.button>
		</motion.div>}
		{qrcode && <motion.div
			className={qrcodeBoxName}
			{...qrcodeBoxHdl}
			{...mainMotion}>
			<div style={{ backgroundImage: `url(${qrcode})` }} />
			<AnimatePresence>
				{qrcodeExitBtn && <motion.button
					{...qrcodeExitBtnHdl}
					{...qrCodeExitBtnMotion}>
					{'>'}
				</motion.button>}
			</AnimatePresence>
		</motion.div>}
		{activateForm && <motion.form
			className={nameFormName}
			{...nameFormHdl}
			{...mainMotion}>
			<input
				placeholder='2fa code'
				value={inputValue}
				{...inputHdl}
			/>
			<motion.button
				type='submit'
				className={formSubmitBtnName}
				{...btnMotion}>
				submit
			</motion.button>
			<motion.button
				className={formBackBtnName}
				{...cancelBtnHdl}
				{...btnMotion}>
				cancel
			</motion.button>
		</motion.form>}
	</>
}

// --------SET-INFOS------------------------------------------------------- //
interface InfoSettingsProps {
	pageOwner: any
	showSettings: number
	setShowSettings: React.Dispatch<React.SetStateAction<number>>
	updateUser: () => void
	setPageOwner: React.Dispatch<any>
}
const InfoSettings: React.FC<InfoSettingsProps> = ({
	pageOwner, showSettings, setShowSettings, updateUser, setPageOwner
}) => {
	// ----STATES----------------------------- //
	const [inputValue, setInputValue] = useState('')
	const [settingsLog, setSettingsLog] = useState('')

	// ----HANDLERS--------------------------- //
	const cancelBtnHdl = {
		onMouseUp: () => {
			setShowSettings(0)
			setInputValue('')
		}
	}
	const toNicknameBtnHdl = { onMouseUp: () => setShowSettings(3) }
	const to2FABtnHdl = { onMouseUp: () => setShowSettings(4) }
	const nameFormHdl = {
		onSubmit: (e: any) => {
			e.preventDefault()
			if (e.nativeEvent.submitter?.className === formBackBtnName)
				return
			if (!inputValue) {
				setSettingsLog('no entry')
				const timer = setTimeout(() => setSettingsLog(''), 2000)
				return () => clearTimeout(timer)
			}

			const body = new URLSearchParams({ 'nickname': inputValue })
			ftFetch('/users/me/nickname', 'POST', body)
				.then(x => {
					updateUser()
					setPageOwner(x)
					setSettingsLog('success')
					setInputValue('')
					setShowSettings(0)
					const timer = setTimeout(() => setSettingsLog(''), 2000)
					return () => clearTimeout(timer)
				})
				.catch(x => {
					console.error('InfoSettings():', x)
					setSettingsLog('failed')
					setInputValue('')
					const timer = setTimeout(() => setSettingsLog(''), 2000)
					return () => clearTimeout(timer)
				})
		}
	}
	const ppFormHdl = {
		onSubmit: (e: any) => {
			e.preventDefault()
			if (e.nativeEvent.submitter?.className === formBackBtnName)
				return
			if (!e.target.elements.image.files[0]) {
				setSettingsLog('no file selected')
				const timer = setTimeout(() => setSettingsLog(''), 2000)
				return () => clearTimeout(timer)
			}

			const body = new FormData()
			body.append('file', e.target.elements.image.files[0])
			ftFetch('/users/me/avatar/upload', 'POST', body)
				.then(x => {
					setPageOwner(x)
					updateUser()
					setSettingsLog('success')
					setShowSettings(0)
					const timer = setTimeout(() => setSettingsLog(''), 2000)
					return () => clearTimeout(timer)
				})
				.catch(x => {
					console.error('InfoSettings():', x)
					if (x) {
						try {
							const answ = JSON.parse(x).message
							if (answ) setSettingsLog(answ)
							else setSettingsLog('failed')
							const timer = setTimeout(() => setSettingsLog(''), 2000)
							return () => clearTimeout(timer)
						}
						catch (x) { console.error('[ERROR] FriendRequests():', x) }
					}
				})
		}
	}
	const inputHdl = {
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			setInputValue(e.target.value)
		}
	}

	// ----ANIMATIONS------------------------- //
	const btnMotion = { whileHover: { scale: 1.05 } }
	const mainMotion = xMove({
		from: showSettings === 1 ? 30 : -30,
		inDuration: 0.3,
		outDuration: 0.3
	})
	const settingsLogMotion = xMove({
		from: -30,
		inDuration: 0.3,
		outDuration: 0.3
	})

	// ----CLASSNAMES------------------------- //
	const settingsSelectName = `${NAME}-settings-select`
	const nameFormName = `${NAME}-name-form`
	const ppFormName = `${NAME}-pp-form`
	const formSubmitBtnName = `${NAME}-form-submit-btn`
	const formBackBtnName = `${NAME}-form-back-btn`
	const settingsLogName = `${NAME}-settings-log${(
		settingsLog === 'success' ? ` ${NAME}-settings-log--green` : ''
	)}`

	// ----RENDER----------------------------- //
	return <>
		<AnimatePresence>
			{showSettings === 1 && <motion.form
				className={ppFormName}
				{...ppFormHdl}
				{...mainMotion}>
				<input type='file' name='image' />
				<motion.button
					type='submit'
					className={formSubmitBtnName}
					{...btnMotion}>
					submit
				</motion.button>
				<motion.button
					className={formBackBtnName}
					{...cancelBtnHdl}
					{...btnMotion}>
					back
				</motion.button>
			</motion.form>}
		</AnimatePresence>
		<AnimatePresence>
			{showSettings === 2 && <motion.div
				className={settingsSelectName}
				{...mainMotion}>
				<motion.button
					{...toNicknameBtnHdl}
					{...btnMotion}>
					nickname
				</motion.button>
				<motion.button
					{...to2FABtnHdl}
					{...btnMotion}>
					2fa
				</motion.button>
				<motion.button
					{...cancelBtnHdl}
					{...btnMotion}>
					back
				</motion.button>
			</motion.div>}
		</AnimatePresence>
		<AnimatePresence>
			{showSettings === 3 && <motion.form
				className={nameFormName}
				{...nameFormHdl}
				{...mainMotion}>
				<input
					placeholder='new username'
					value={inputValue}
					{...inputHdl}
				/>
				<motion.button
					type='submit'
					className={formSubmitBtnName}
					{...btnMotion}>
					submit
				</motion.button>
				<motion.button
					className={formBackBtnName}
					{...cancelBtnHdl}
					{...btnMotion}>
					cancel
				</motion.button>
			</motion.form>}
		</AnimatePresence>
		<AnimatePresence>
			{showSettings === 4 && <Set2FA
				pageOwner={pageOwner}
				setShowSettings={setShowSettings}
				setSettingsLog={setSettingsLog}
			/>}
		</AnimatePresence>
		<AnimatePresence>
			{settingsLog && <motion.div
				className={settingsLogName}
				{...settingsLogMotion}>
				{settingsLog}
			</motion.div>}
		</AnimatePresence>
	</>
}

// --------INFOS----------------------------------------------------------- //
interface InfosProps {
	userID: number
	pageOwner: any
	updateUser: () => void
	setPageOwner: React.Dispatch<any>
}
const Infos: React.FC<InfosProps> = ({
	userID, pageOwner, updateUser, setPageOwner
}) => {
	// ----STATES----------------------------- //
	const [overDiv, setOverDiv] = useState(0)
	const [showSettings, setShowSettings] = useState(0)
	const [bio, setBio] = useState('')
	const [pp, setPP] = useState<any>(null)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (pageOwner.id == undefined) return

		ftFetch(
			`/avatars/${pageOwner.avatarFilename}`,
			undefined,
			undefined,
			'img'
		)
			.then(x => setPP(URL.createObjectURL(x)))
			.catch(x => console.error('Infos():', x))
		if (pageOwner.story) setBio(pageOwner.story)
	}, [pageOwner])

	// ----HANDLERS--------------------------- //
	const nicknameHdl = {
		onMouseEnter: () => setOverDiv(1),
		onMouseLeave: () => setOverDiv(0)
	}
	const setBtnHdl = { onMouseUp: () => setShowSettings(2) }

	const ppHdl = {
		onMouseEnter: () => setOverDiv(2),
		onMouseLeave: () => setOverDiv(0)
	}
	const setPicBtnHdl = { onMouseUp: () => setShowSettings(1) }

	const txtAreaHdl = {
		onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setBio(e.target.value)
		},
		onBlur: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const body = new URLSearchParams({ 'story': e.target.value })
			ftFetch('/users/me/story', 'POST', body)
				.catch(x => console.error('Infos():', x))
		}
	}

	// ----ANIMATIONS------------------------- //
	const btnMotion = { whileHover: { scale: 1.05 } }
	const setPictureBtnMotion = {
		...mergeMotions(
			xMove({ from: -20, inDuration: 0.3, outDuration: 0.3 }),
			yMove({ from: -20, inDuration: 0.3, outDuration: 0.3 })
		),
		...btnMotion
	}
	const setNameBtnMotion = {
		...xMove({ from: -30, inDuration: 0.3, outDuration: 0.3 }),
		...btnMotion
	}

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}-picture`
	const nicknameField = `${NAME}-nickname`

	// ----RENDER----------------------------- //
	return <>
		<div
			className={boxName}
			{...ppHdl}
			style={{ backgroundImage: pp ? `url(${pp})` : 'none' }}>
			<AnimatePresence>
				{!pp && <motion.p {...fade({})}>loading...</motion.p>}
			</AnimatePresence>
			<AnimatePresence>
				{pageOwner.id === userID && overDiv === 2 &&
					<motion.button {...setPictureBtnMotion} {...setPicBtnHdl} />
				}
			</AnimatePresence>
		</div>
		<div className={nicknameField} {...nicknameHdl}>
			{pageOwner.nickname}
			<AnimatePresence>
				{pageOwner.id === userID && overDiv === 1 &&
					<motion.button {...setNameBtnMotion} {...setBtnHdl} />
				}
			</AnimatePresence>
		</div>
		<textarea
			placeholder='anything to say ?'
			value={bio}
			readOnly={userID !== pageOwner.id}
			{...txtAreaHdl}
		/>
		<InfoSettings
			pageOwner={pageOwner}
			showSettings={showSettings}
			setShowSettings={setShowSettings}
			updateUser={updateUser}
			setPageOwner={setPageOwner}
		/>
	</>
}

// --------ACCOUNT-INFOS--------------------------------------------------- //
interface AccountInfosProps {
	userID: number
	updateUser: () => void
}
const AccountInfos: React.FC<AccountInfosProps> = ({ userID, updateUser }) => {
	// ----ROUTER----------------------------- //
	const location = useLocation()

	// ----VALUES----------------------------- //
	let id = location.pathname.split('/')[2]
	if (!id) id = String(userID)

	// ----STATES----------------------------- //
	const [pageOwner, setPageOwner] = useState<any>({})
	const [userHistory, setUserHistory] = useState<any>({})
	const [winsCount, setWinsCount] = useState(0)

	// ----EFFECTS---------------------------- //
	useEffect(() => {
		if (id == undefined) return

		ftFetch(`/users/${id}`)
			.then(x => setPageOwner((data: any) => ({ ...data, ...x })))
			.catch(x => console.error('AccountInfos():', x))

		ftFetch(`/games/${id}`)
			.then(x => setUserHistory(x))
			.catch(x => console.error('AccountInfos():', x))

		ftFetch(`/games/${id}/victories/count`)
			.then(x => setWinsCount(x))
			.catch(x => console.error('AccountInfos():', x))
	}, [])

	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 1 })
	const achievementsMotion = heightChangeByPercent({ inDuration: 0.8 })
	const historyMotion = mergeMotions(
		widthChangeByPercent({ inDuration: 0.8 }),
		heightChangeByPercent({ inDuration: 0.8, initialHeight: 32 })
	)

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}-infos main`
	const historyBoxName = `${HISTORY_NAME}-box`

	// ----RENDER----------------------------- //
	return <motion.div className={boxName} {...boxMotion}>
		<motion.div className={INFOS_NAME} {...boxMotion}>
			<Infos
				userID={userID}
				updateUser={updateUser}
				pageOwner={pageOwner}
				setPageOwner={setPageOwner}
			/>
		</motion.div>
		<motion.div className={ACHIEVEMENTS_NAME} {...achievementsMotion}>
			<Achievements pageOwner={pageOwner} />
		</motion.div>
		<motion.div className={historyBoxName} {...historyMotion}>
			<Stats
				pageOwner={pageOwner}
				userHistory={userHistory}
				winsCount={winsCount}
			/>
			<History
				userID={userID}
				pageOwner={pageOwner}
				userHistory={userHistory}
			/>
		</motion.div>
	</motion.div >
}
export default AccountInfos