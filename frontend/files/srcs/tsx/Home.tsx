import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { popUp } from './utils/ftMotion.tsx'

// --------HOME------------------------------------------------------------ //
interface HomeProps { selectedCharacter: string }
const Home: React.FC<HomeProps> = ({ selectedCharacter }) => {
	// ----ANIMATIONS------------------------- //
	const charBoxMotion = popUp({})
	const swapBtnMotion = { whileHover: { scale: 1.05 } }

	// ----CLASSNAMES------------------------- //
	const name = `home`
	const boxName = `${name} main`
	const charSkinName = (
		`${name}-character character-skin character-skin-${(
			selectedCharacter
		)}`
	)
	const swapBoxName = `${name}-swap-box`
	const linkName = `${name}-characters-link custom-txt`

	// ----RENDER----------------------------- //
	return <div className={boxName}>
		<motion.div {...charBoxMotion}>
			<h1 {...charBoxMotion}>selected character</h1>
			<div className={charSkinName} />
			<div className={swapBoxName}>
				<motion.div {...swapBtnMotion}>
					<Link to='/characters' className={linkName} />
				</motion.div>
			</div>
		</motion.div>
	</div>
}
export default Home