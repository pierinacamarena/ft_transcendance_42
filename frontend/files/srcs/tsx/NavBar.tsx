import React from 'react'
import { Routes, Route, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { heightChangeByPx, yMove, mergeMotions } from './utils/ftMotion.tsx'

// --------ANIMATIONS------------------------------------------------------ //
const BACKLINK_HEIGHT = 60
const LINK_HEIGHT = 75

const navBarMotion = (height: number) => heightChangeByPx({
	finalHeight: height
})
const navBarLinkMotion = (from: number, index: number) => ({
	...mergeMotions(
		yMove({ from: from }),
		heightChangeByPx({
			finalHeight: (
				(!index || !from) ? BACKLINK_HEIGHT : LINK_HEIGHT
			) + 3
		})
	),
	whileHover: { scale: 1.05, zIndex: 4 }
})

// --------CLASSNAMES------------------------------------------------------ //
const NAME = 'navBar'
const LINK_NAME = `${NAME}-link`

// --------LINK------------------------------------------------------------ //
interface NavBarLinkProps {
	index: number
	to: string
	ext: string
	isLast?: boolean
	zindex: number
}
const NavBarLink: React.FC<NavBarLinkProps> = ({
	index, to, ext, isLast = false, zindex
}) => {
	// ----ANIMATIONS------------------------- //
	const comeFrom = (index ? BACKLINK_HEIGHT + LINK_HEIGHT * (index - 1) : 0)
	const linkMotion = navBarLinkMotion(-comeFrom, isLast ? -1 : index)

	// ----CLASSNAMES------------------------- //
	const boxName = `${LINK_NAME}-motion`
	const linkTxtName = `${LINK_NAME} ${LINK_NAME}-${ext} custom-txt`

	// ----RENDER----------------------------- //
	return <motion.div
		className={boxName}
		style={{ zIndex: zindex }}
		{...linkMotion}
		tabIndex={0}>
		<NavLink to={to} className={linkTxtName} tabIndex={-1} />
	</motion.div>
}

// --------RENDER-FROM-HOME------------------------------------------------ //
const FromHome: React.FC = () => {
	// ----ROUTER----------------------------- //
	const navigate = useNavigate()

	// ----HANDLERS--------------------------- //
	const logoutBtnHdl = {
		onMouseUp: () => {
			localStorage.setItem('logged', '0')
			navigate('/login')
		}
	}

	// ----ANIMATIONS------------------------- //
	const logoutBtnMotion = navBarLinkMotion(0, 0)

	// ----CLASSNAMES------------------------- //
	const logoutBtnName = `${LINK_NAME}-motion`
	const logoutBtnTxTName = `${LINK_NAME} ${LINK_NAME}-logout custom-txt`

	// ----RENDER----------------------------- //
	return <motion.nav
		className={NAME}
		{...navBarMotion(BACKLINK_HEIGHT + LINK_HEIGHT * 2)}>
		<motion.button
			className={logoutBtnName}
			style={{ zIndex: 2 }}
			{...logoutBtnHdl}
			{...logoutBtnMotion}>
			<div className={logoutBtnTxTName} />
		</motion.button>
		<NavBarLink
			index={1}
			to='/profile'
			ext='profile'
			zindex={1}
		/>
		<NavBarLink
			index={2}
			to='/leader'
			ext='leader'
			isLast={true}
			zindex={0}
		/>
	</motion.nav >
}

// --------RENDER-FROM-INFOS----------------------------------------------- //
const FromInfos: React.FC = () => (
	<motion.nav
		className={NAME}
		{...navBarMotion(BACKLINK_HEIGHT + LINK_HEIGHT)}>
		<NavBarLink
			index={0}
			to='/'
			ext='back'
			zindex={1}
		/>
		<NavBarLink
			index={1}
			to='/profile/friends'
			ext='friends'
			isLast={true}
			zindex={0}
		/>
	</motion.nav>
)

// --------RENDER-FROM-FRIENDS--------------------------------------------- //
const FromFriends: React.FC = () => (
	<motion.nav className={NAME} {...navBarMotion(BACKLINK_HEIGHT)}>
		<NavBarLink
			index={0}
			to='/profile'
			ext='back'
			isLast={true}
			zindex={0}
		/>
	</motion.nav>
)

// --------RENDER-FROM-CHARACTERS------------------------------------------ //
const FromCharacters: React.FC = () => (
	<motion.nav className={NAME} {...navBarMotion(BACKLINK_HEIGHT)}>
		<NavBarLink
			index={0}
			to='/'
			ext='home'
			isLast={true}
			zindex={0}
		/>
	</motion.nav>
)

// --------RENDER-FROM-LEADER---------------------------------------------- //
const FromLeader: React.FC = () => (
	<motion.nav className={NAME} {...navBarMotion(BACKLINK_HEIGHT)}>
		<NavBarLink
			index={0}
			to='/'
			ext='back'
			isLast={true}
			zindex={0}
		/>
	</motion.nav>
)

// --------RENDER-FROM-404------------------------------------------------- //
const From404: React.FC = () => (
	<motion.nav className={NAME} {...navBarMotion(BACKLINK_HEIGHT)}>
		<NavBarLink
			index={0}
			to='/'
			ext='home'
			isLast={true}
			zindex={0}
		/>
	</motion.nav>
)

// --------NAVBAR---------------------------------------------------------- //
const NavBar: React.FC = () => {
	// ----ROUTER----------------------------- //
	const location = useLocation()

	// ----RENDER----------------------------- //
	return <AnimatePresence mode='wait'>
		<Routes location={location} key={location.pathname}>
			<Route path='/' element={<FromHome />} />
			<Route path='/profile' element={<FromInfos />} />
			<Route path='/profile/friends' element={<FromFriends />} />
			<Route path='/characters' element={<FromCharacters />} />
			<Route path='/leader' element={<FromLeader />} />
			<Route path='*' element={<From404 />} />
		</Routes>
	</AnimatePresence>
}
export default NavBar