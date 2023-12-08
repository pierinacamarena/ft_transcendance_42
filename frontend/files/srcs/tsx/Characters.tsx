import React, { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fade, xMove, yMove } from './utils/ftMotion.tsx'
import { ftFetch } from './Root.tsx'
import * as characters from '../resources/characters.json'

// --------VALUES---------------------------------------------------------- //
const COUNT = 9
const data = Object.entries(characters)
export const characterNames = (id: number) => {
	switch (id) {
		case 1: return `${data[0][0]}`
		case 2: return `${data[1][0]}`
		case 3: return `${data[2][0]}`
		case 4: return `${data[3][0]}`
		case 5: return `${data[4][0]}`
		case 6: return `${data[5][0]}`
		case 7: return `${data[6][0]}`
		case 8: return `${data[7][0]}`
		case 9: return `${data[8][0]}`
		default: return 'error'
	}
}
export const characterIds = (name: string) => {
	switch (name) {
		case `${data[0][0]}`: return 1
		case `${data[1][0]}`: return 2
		case `${data[2][0]}`: return 3
		case `${data[3][0]}`: return 4
		case `${data[4][0]}`: return 5
		case `${data[5][0]}`: return 6
		case `${data[6][0]}`: return 7
		case `${data[7][0]}`: return 8
		case `${data[8][0]}`: return 9
		default: return -1
	}
}

// --------CLASSNAMES------------------------------------------------------ //
const NAME = 'character'

// --------SPELL----------------------------------------------------------- //
interface SpellProps {
	selected: number
}
const Spell: React.FC<SpellProps> = ({ selected }) => {
	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 0.3, outDuration: 0.3 })

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}-spell`

	// ----RENDER----------------------------- //
	return <motion.div className={boxName} {...boxMotion}>
		<h1>{data[selected - 1][1].passive.name}</h1>
		<p>{data[selected - 1][1].passive.effect}</p>
	</motion.div>
}

// --------CHARACTER------------------------------------------------------- //
interface CharacterProps {
	selected: number
}
const Character: React.FC<CharacterProps> = ({ selected }) => {
	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 0.3, outDuration: 0.3 })
	const xMoveMotion = (index: number) => xMove({
		from: 300,
		inDuration: 0.25 * index,
		outDuration: 0.25 * (4 - index)
	})

	// ----CLASSNAMES------------------------- //
	const statsName = `${NAME}-stats`
	const storyName = `${NAME}-story`
	const spellsName = `${NAME}-spells`

	// ----RENDER----------------------------- //
	return <div className={NAME}>
		<motion.div className={storyName} {...xMoveMotion(3)}>
			<AnimatePresence mode='wait'>
				<motion.div key={`${storyName}-${selected}`} {...boxMotion}>
					<h1>{data[selected - 1][0]}</h1>
					<p>{data[selected - 1][1].story}</p>
				</motion.div>
			</AnimatePresence>
		</motion.div>
		<motion.div className={statsName} {...xMoveMotion(2)}>
			<AnimatePresence mode='wait'>
				<motion.div key={`${statsName}-${selected}`} {...boxMotion}>
					<div>HP: {data[selected - 1][1].hp}</div>
					<div>ATK: {data[selected - 1][1].attack}</div>
					<div>DEF: {data[selected - 1][1].defense}</div>
					<div>SPD: {data[selected - 1][1].speed}</div>
				</motion.div>
			</AnimatePresence>
		</motion.div>
		<motion.div className={spellsName} {...xMoveMotion(1)}>
			<AnimatePresence mode='wait'>
				<Spell
					key={`${spellsName}-${selected}`}
					selected={selected}
				/>
			</AnimatePresence>
		</motion.div>
	</div>
}

// --------CHARACTER-BOX--------------------------------------------------- //
interface CharBoxProps {
	id: number
	swapping: React.MutableRefObject<boolean>
	setSelected: React.Dispatch<React.SetStateAction<number>>
	setShowed: React.Dispatch<React.SetStateAction<number>>
	selected: number
	updateUser: () => void
}
const CharBox: React.FC<CharBoxProps> = ({
	id, swapping, setSelected, selected, updateUser, setShowed
}) => {
	// ----HANDLERS--------------------------- //
	const boxHdl = {
		onMouseUp: () => {
			if (!swapping.current) {
				setShowed(id)
				swapping.current = true
				const timer = setTimeout(() => swapping.current = false, 500)
				return () => clearTimeout(timer)
			}
		}
	}
	const updateSelected = () => {
		ftFetch('/users/select/' + characterNames(id))
			.then(() => updateUser())
			.catch(x => console.error('CharBox():', x))
	}
	const selectBtnHdl = {
		onMouseUp: () => {
			updateSelected()
			setSelected(id)
			setShowed(id)
			swapping.current = true
			const timer = setTimeout(() => swapping.current = false, 500)
			return () => clearTimeout(timer)
		}
	}

	// ----ANIMATIONS------------------------- //
	const boxMotion = yMove({
		from: 200 * id,
		inDuration: 0.7 + 0.02 * id,
		outDuration: 0.5 - 0.01 * id
	})
	const selectBtnMotion = { whileHover: { scale: 1.05 } }

	// ----CLASSNAMES------------------------- //
	const skinBoxName = `${NAME}-skin ${NAME}-skin-${characterNames(id)}`
	const selectBoxName = `${NAME}-selectBox`

	// ----RENDER----------------------------- //
	return <motion.div {...boxMotion}>
		<div className={skinBoxName} {...boxHdl} />
		<div className={selectBoxName}>
			{selected !== id && <motion.button
				{...selectBtnHdl}
				{...selectBtnMotion}>
				select
			</motion.button>}
			{selected === id && <>selected</>}
		</div>
	</motion.div>
}

// --------CHARACTER-BOXES------------------------------------------------- //
interface CharBoxesProps {
	swapping: React.MutableRefObject<boolean>
	setSelected: React.Dispatch<React.SetStateAction<number>>
	setShowed: React.Dispatch<React.SetStateAction<number>>
	selected: number
	updateUser: () => void
}
const CharBoxes: React.FC<CharBoxesProps> = ({
	swapping, setSelected, selected, updateUser, setShowed
}) => {
	// ----ANIMATIONS------------------------- //
	const boxMotion = yMove({ from: 500, inDuration: 0.7 })

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}s-select`

	// ----RENDER----------------------------- //
	const render = Array.from({ length: COUNT }, (_, index) =>
		<CharBox
			key={index + 1}
			id={index + 1}
			swapping={swapping}
			setSelected={setSelected}
			selected={selected}
			updateUser={updateUser}
			setShowed={setShowed}
		/>
	)
	return <motion.div className={boxName} {...boxMotion}>
		{render}
	</motion.div>
}

// --------CHARACTERS------------------------------------------------------ //
interface CharactersProps {
	selectedCharacter: string
	updateUser: () => void
}
const Characters: React.FC<CharactersProps> = ({
	selectedCharacter, updateUser
}) => {
	// ----REFS------------------------------- //
	const swapping = useRef(false)

	// ----STATES----------------------------- //
	const [selected, setSelected] = useState(characterIds(selectedCharacter))
	const [showed, setShowed] = useState(selected)

	// ----ANIMATIONS------------------------- //
	const boxMotion = fade({ inDuration: 1 })

	// ----CLASSNAMES------------------------- //
	const boxName = `${NAME}s main`

	// ----RENDER----------------------------- //
	return <motion.main className={boxName} {...boxMotion}>
		<CharBoxes
			swapping={swapping}
			selected={selected}
			setSelected={setSelected}
			updateUser={updateUser}
			setShowed={setShowed}
		/>
		<Character selected={showed} />
	</motion.main>
}
export default Characters