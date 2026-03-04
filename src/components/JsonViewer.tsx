import { useState } from 'react'
import { CaretRight, CaretDown } from '@phosphor-icons/react'

interface JsonViewerProps {
  data: unknown
}

interface CollapsibleJsonNodeProps {
  label: string
  value: unknown
  level?: number
  isLast?: boolean
}

function CollapsibleJsonNode({ label, value, level = 0, isLast = false }: CollapsibleJsonNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2)
  const indent = level * 16

  if (value === null) {
    return (
      <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
        <span className="text-primary font-semibold">{label}</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-destructive">null</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
        <span className="text-primary font-semibold">{label}</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-accent">{value.toString()}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
        <span className="text-primary font-semibold">{label}</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-accent">{value}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
        <span className="text-primary font-semibold">{label}</span>
        <span className="text-muted-foreground">: </span>
        <span className="text-foreground">"{value}"</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
          <span className="text-primary font-semibold">{label}</span>
          <span className="text-muted-foreground">: []</span>
          {!isLast && <span className="text-muted-foreground">,</span>}
        </div>
      )
    }

    return (
      <div style={{ paddingLeft: `${indent}px` }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="py-0.5 hover:bg-muted/50 -ml-1 pl-1 pr-2 rounded inline-flex items-center gap-1"
        >
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
          <span className="text-primary font-semibold">{label}</span>
          <span className="text-muted-foreground">: [{value.length}]</span>
        </button>
        {isOpen && (
          <div>
            {value.map((item, index) => (
              <CollapsibleJsonNode
                key={index}
                label={`[${index}]`}
                value={item}
                level={level + 1}
                isLast={index === value.length - 1}
              />
            ))}
          </div>
        )}
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    
    if (entries.length === 0) {
      return (
        <div style={{ paddingLeft: `${indent}px` }} className="py-0.5">
          <span className="text-primary font-semibold">{label}</span>
          <span className="text-muted-foreground">: {'{}'}</span>
          {!isLast && <span className="text-muted-foreground">,</span>}
        </div>
      )
    }

    return (
      <div style={{ paddingLeft: `${indent}px` }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="py-0.5 hover:bg-muted/50 -ml-1 pl-1 pr-2 rounded inline-flex items-center gap-1"
        >
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
          <span className="text-primary font-semibold">{label}</span>
          <span className="text-muted-foreground">: {'{'}{entries.length} {entries.length === 1 ? 'property' : 'properties'}{'}'}</span>
        </button>
        {isOpen && (
          <div>
            {entries.map(([key, val], index) => (
              <CollapsibleJsonNode
                key={key}
                label={key}
                value={val}
                level={level + 1}
                isLast={index === entries.length - 1}
              />
            ))}
          </div>
        )}
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    )
  }

  return null
}

export function JsonViewer({ data }: JsonViewerProps) {
  return (
    <div className="font-mono text-xs p-4">
      <CollapsibleJsonNode label="result" value={data} />
    </div>
  )
}
