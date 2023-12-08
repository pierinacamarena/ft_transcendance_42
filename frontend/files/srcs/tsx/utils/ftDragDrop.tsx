import React from 'react'
import { useDrag, useDrop } from 'react-dnd'

// --------DRAG-DROP------------------------------------------------------- //
interface DragDropProps extends React.HTMLAttributes<HTMLDivElement> {
	itemId: number
	content: any
	moveItem: (draggedId: number, droppedId: number) => void
}
export const DragDrop: React.FC<DragDropProps> = ({
	itemId, content, moveItem, ...divParams
}) => {
	// ----HANDLERS--------------------------- //
	const [, drag] = useDrag<any>({
		type: 'item',
		item: { id: itemId }
	})
	const [, drop] = useDrop<any>({
		accept: 'item',
		drop: (item) => moveItem(item.id, itemId)
	})

	// ----RENDER----------------------------- //
	return <div ref={(node) => drag(drop(node))} {...divParams}>
		{content}
	</div >
}