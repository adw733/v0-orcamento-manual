"use client"

import type React from "react"

import { useState, useRef } from "react"
import { GripVertical } from "lucide-react"

interface Item {
  id: string | number
  name: string
  [key: string]: any
}

interface DraggableListProps {
  items: Item[]
  onReorder: (newItems: Item[]) => void
}

export default function DraggableList({ items, onReorder }: DraggableListProps) {
  const [draggedItem, setDraggedItem] = useState<Item | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | number | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, item: Item) => {
    // Set data transfer for Firefox compatibility
    e.dataTransfer.setData("text/plain", item.id.toString())
    e.dataTransfer.effectAllowed = "move"

    // Store the dragged item
    setDraggedItem(item)

    // Add a delay to set opacity (for visual effect)
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.5"
      }
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    // Reset opacity
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1"
    }

    // Reset states
    setDraggedItem(null)
    setDragOverItemId(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, item: Item) => {
    // Prevent default to allow drop
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    // Don't do anything if we're dragging over the same item
    if (draggedItem?.id === item.id) {
      setDragOverItemId(null)
      return
    }

    // Set the current item being dragged over
    setDragOverItemId(item.id)
  }

  const handleDragLeave = () => {
    setDragOverItemId(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetItem: Item) => {
    e.preventDefault()

    // Don't do anything if we don't have a dragged item or if we're dropping onto the same item
    if (!draggedItem || draggedItem.id === targetItem.id) {
      return
    }

    // Create a new array with the reordered items
    const newItems = [...items]
    const draggedItemIndex = newItems.findIndex((item) => item.id === draggedItem.id)
    const targetItemIndex = newItems.findIndex((item) => item.id === targetItem.id)

    // Remove the dragged item from its original position
    const [removedItem] = newItems.splice(draggedItemIndex, 1)

    // Insert the dragged item at the new position
    newItems.splice(targetItemIndex, 0, removedItem)

    // Call the onReorder callback with the new array
    onReorder(newItems)
  }

  return (
    <ul ref={listRef} className="w-full border rounded-lg overflow-hidden divide-y" aria-label="Draggable list">
      {items.map((item) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
          className={`
            flex items-center p-3 bg-white hover:bg-gray-50 transition-colors
            ${draggedItem?.id === item.id ? "opacity-50" : "opacity-100"}
            ${dragOverItemId === item.id ? "border-t-2 border-blue-500" : ""}
          `}
          aria-label={`Draggable item: ${item.name}`}
        >
          <div
            className="mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            aria-label="Drag handle"
          >
            <GripVertical size={20} />
          </div>
          <span className="flex-1">{item.name}</span>
        </li>
      ))}
    </ul>
  )
}
