import { ScrollArea } from '@/components/ui/scroll-area'

interface JsonViewerProps {
  data: unknown
}

export function JsonViewer({ data }: JsonViewerProps) {
  const jsonString = JSON.stringify(data, null, 2)
  
  return (
    <ScrollArea className="h-full w-full">
      <pre className="font-mono text-sm text-accent p-4 leading-relaxed">
        {jsonString}
      </pre>
    </ScrollArea>
  )
}
