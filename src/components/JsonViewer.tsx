interface JsonViewerProps {
  data: unknown
}

export function JsonViewer({ data }: JsonViewerProps) {
  const jsonString = JSON.stringify(data, null, 2)
  
  return (
    <pre className="font-mono text-xs text-foreground p-4 leading-relaxed whitespace-pre-wrap break-words">
      {jsonString}
    </pre>
  )
}
