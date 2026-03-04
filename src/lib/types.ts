export interface ModelContext {
  id: string
  type: 'page' | 'selection' | 'interaction' | 'custom'
  content: string
  metadata?: Record<string, any>
  timestamp: number
  enabled: boolean
}

export interface ContextMessage {
  type: 'context-added' | 'context-removed' | 'context-updated' | 'get-contexts' | 'contexts-response' | 'toggle-context' | 'add-context' | 'check-api'
  context?: ModelContext
  contexts?: ModelContext[]
  contextId?: string
  available?: boolean
}

export interface ModelContextAPI {
  provideContext(context: string, metadata?: any): Promise<void>
  clearContext(contextId?: string): Promise<void>
  getContexts(): Promise<ModelContext[]>
}

declare global {
  interface Navigator {
    modelContext?: ModelContextAPI
  }
  
  const chrome: {
    runtime: {
      onMessage: {
        addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void
        removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void
      }
      lastError?: { message: string }
      sendMessage: (message: any, callback?: (response: any) => void) => void
    }
    tabs: {
      query: (queryInfo: { active?: boolean; currentWindow?: boolean }) => Promise<Array<{ id?: number; url?: string }>>
      sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void
    }
    storage: {
      local: {
        get: (keys: string[]) => Promise<Record<string, any>>
        set: (items: Record<string, any>) => Promise<void>
      }
    }
  }
}

export {}

