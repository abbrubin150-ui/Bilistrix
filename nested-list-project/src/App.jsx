import { useState } from 'react'

const COLORS = [
  { bg: '#1a1a2e', border: '#e94560', text: '#eaeaea' },
  { bg: '#16213e', border: '#0f3460', text: '#e0e0e0' },
  { bg: '#1f4068', border: '#1b1b2f', text: '#d0d0d0' },
  { bg: '#2a2a4a', border: '#4a4a6a', text: '#c0c0c0' },
  { bg: '#3a3a5a', border: '#5a5a7a', text: '#b0b0b0' },
  { bg: '#4a4a6a', border: '#6a6a8a', text: '#a0a0a0' },
]

const generateId = () => Math.random().toString(36).substr(2, 9)

const createItem = (text = '', level = 0) => ({
  id: generateId(),
  text,
  isOpen: true,
  level,
  children: [],
})

function ListItem({ item, onUpdate, onDelete, onAddChild, level }) {
  const [isEditing, setIsEditing] = useState(!item.text)
  const [editText, setEditText] = useState(item.text)
  const canNest = level < 5
  const color = COLORS[level]

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(item.id, { ...item, text: editText.trim() })
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setEditText(item.text)
      setIsEditing(false)
    }
  }

  const toggleOpen = () => {
    onUpdate(item.id, { ...item, isOpen: !item.isOpen })
  }

  return (
    <div
      style={{
        marginBottom: '8px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: color.bg,
        border: `2px solid ${color.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          direction: 'rtl',
        }}
      >
        {item.children.length > 0 && (
          <button
            onClick={toggleOpen}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: color.text,
              transform: item.isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              padding: '4px',
            }}
          >
            ◀
          </button>
        )}

        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            placeholder="הכנס טקסט..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${color.border}`,
              background: 'rgba(255,255,255,0.1)',
              color: color.text,
              fontSize: '16px',
              direction: 'rtl',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            style={{
              flex: 1,
              cursor: 'pointer',
              color: color.text,
              fontSize: '16px',
              fontWeight: level === 0 ? '600' : '400',
            }}
          >
            {item.text || 'לחץ לעריכה...'}
          </span>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {canNest && (
            <button
              onClick={() => onAddChild(item.id)}
              title="הוסף תת-פריט"
              style={{
                background: '#4ade80',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: '#1a1a2e',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            >
              +
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            title="מחק"
            style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            ✕
          </button>
        </div>
      </div>

      {item.children.length > 0 && (
        <div
          style={{
            maxHeight: item.isOpen ? '2000px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.4s ease-in-out',
            paddingRight: item.isOpen ? '24px' : '0',
            paddingBottom: item.isOpen ? '12px' : '0',
            paddingLeft: '12px',
          }}
        >
          {item.children.map((child) => (
            <ListItem
              key={child.id}
              item={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState([])

  const updateItemRecursive = (items, id, newItem) => {
    return items.map((item) => {
      if (item.id === id) return newItem
      if (item.children.length > 0) {
        return { ...item, children: updateItemRecursive(item.children, id, newItem) }
      }
      return item
    })
  }

  const deleteItemRecursive = (items, id) => {
    return items
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: deleteItemRecursive(item.children, id),
      }))
  }

  const addChildRecursive = (items, parentId, newChild) => {
    return items.map((item) => {
      if (item.id === parentId) {
        return { ...item, children: [...item.children, newChild], isOpen: true }
      }
      if (item.children.length > 0) {
        return { ...item, children: addChildRecursive(item.children, parentId, newChild) }
      }
      return item
    })
  }

  const findItemRecursive = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children.length > 0) {
        const found = findItemRecursive(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  const handleUpdate = (id, newItem) => {
    setItems((prev) => updateItemRecursive(prev, id, newItem))
  }

  const handleDelete = (id) => {
    setItems((prev) => deleteItemRecursive(prev, id))
  }

  const handleAddChild = (parentId) => {
    const parent = findItemRecursive(items, parentId)
    if (parent && parent.level < 5) {
      const newChild = createItem('', parent.level + 1)
      setItems((prev) => addChildRecursive(prev, parentId, newChild))
    }
  }

  const addRootItem = () => {
    setItems((prev) => [...prev, createItem('', 0)])
  }

  const countItems = (items) => {
    return items.reduce((sum, item) => sum + 1 + countItems(item.children), 0)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        padding: '40px 20px',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        direction: 'rtl',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: '800',
              color: '#e94560',
              marginBottom: '12px',
              textShadow: '0 4px 20px rgba(233,69,96,0.4)',
              letterSpacing: '2px',
            }}
          >
            רשימות מקוננות
          </h1>
          <p style={{ color: '#a0a0a0', fontSize: '18px' }}>
            עד 6 רמות קינון עם אקורדיון
          </p>
          <div
            style={{
              marginTop: '16px',
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              display: 'inline-block',
              color: '#e0e0e0',
              fontSize: '14px',
            }}
          >
            סה"כ פריטים: {countItems(items)}
          </div>
        </header>

        <button
          onClick={addRootItem}
          style={{
            width: '100%',
            padding: '18px',
            marginBottom: '24px',
            borderRadius: '12px',
            border: '2px dashed #e94560',
            background: 'rgba(233,69,96,0.1)',
            color: '#e94560',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(233,69,96,0.2)'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(233,69,96,0.1)'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          + הוסף פריט חדש
        </button>

        <div>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px',
                color: '#6a6a8a',
                fontSize: '18px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              הרשימה ריקה. לחץ על הכפתור למעלה להוספת פריט.
            </div>
          ) : (
            items.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                level={0}
              />
            ))
          )}
        </div>

        <footer
          style={{
            marginTop: '60px',
            textAlign: 'center',
            color: '#4a4a6a',
            fontSize: '14px',
            padding: '20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            רמות קינון: 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣
          </div>
          לחץ על ◀ לפתיחה/סגירה של תת-פריטים
        </footer>
      </div>
    </div>
  )
}
