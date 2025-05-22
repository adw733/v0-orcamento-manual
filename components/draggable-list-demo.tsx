"use client"

import { useState } from "react"
import DraggableList from "./draggable-list"

interface Item {
  id: string | number
  name: string
}

export default function DraggableListDemo() {
  const [myItems, setMyItems] = useState<Item[]>([
    { id: "a", name: "Item Alpha" },
    { id: "b", name: "Item Bravo" },
    { id: "c", name: "Item Charlie" },
    { id: "d", name: "Item Delta" },
  ])

  const handleReorder = (newItems: Item[]) => {
    setMyItems(newItems)
    console.log("Items reordered:", newItems)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Draggable List Example</h2>
      <p className="mb-4 text-gray-600">Drag and drop items to reorder them.</p>

      <DraggableList items={myItems} onReorder={handleReorder} />

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Current Order:</h3>
        <pre className="text-sm">{JSON.stringify(myItems, null, 2)}</pre>
      </div>
    </div>
  )
}
