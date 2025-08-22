import { Message } from '@/lib/messages'
import { nanoid } from 'nanoid'
import { create } from 'zustand'

export enum DebugErrorType {
  Runtime = 'runtime',
  Build = 'build',
}

export type DebugRequest = {
  // Distinguish each request so the same content can be queued again
  id: string
  requestContent: string
  errorType: DebugErrorType
}
interface ToolMessageStore {
  page_messages: Message[]
  lastMessage: Message | null
  debugQueue: DebugRequest[]
}

const INITIAL_STATE: ToolMessageStore = {
  page_messages: [],
  debugQueue: [],
  lastMessage: null,
}

interface ToolMessageAction {
  initToolMessageStore: (page_messages: Message[]) => void
  setMessages: (msgs: Message[]) => void
  setLastMessage: (message: Partial<Message>) => void
  addMessage: (msg: Message) => Message[]
  handleUndo: () => void
  triggerDebugRequest: (reqContent: string, errorType?: DebugErrorType) => void // enqueue (back-compat)
  enqueueDebugRequest: (reqContent: string, errorType?: DebugErrorType) => void
  dequeueDebugRequest: () => DebugRequest[]
}

export const useToolMessageStore = create<ToolMessageStore & ToolMessageAction>(
  (set) => ({
    ...INITIAL_STATE,
    initToolMessageStore: async (page_messages: Message[]) => {
      set(() => ({
        page_messages,
      }))
    },
    setMessages: (msgs: Message[]) => {
      set({ page_messages: msgs })
    },
    setLastMessage: (partialMsg) => {
      // update info on a particular message, assume always editing the last index
      set((state) => {
        if (!state.page_messages) {
          return {}
        }
        const updateIndex = state.page_messages.length - 1

        // Clone the array so we don’t mutate state directly.
        const updatedMessages = [...state.page_messages]

        // Merge the existing message at that index with the new fields.
        const existing = state.page_messages[updateIndex]
        const lastMsg = {
          ...existing,
          ...partialMsg,
        }
        updatedMessages[updateIndex] = lastMsg
        return { page_messages: updatedMessages, lastMessage: lastMsg }
      })
    },
    handleUndo: () =>
      set((state) => {
        if (!state.page_messages) {
          return {}
        }
        // 1. Compute new array by slicing off the last two items
        const newMessages = state.page_messages.slice(0, -2)

        // 2. Return a partial state update that overwrites both keys
        return {
          page_messages: newMessages,
          currentPreview: { fragment: undefined, result: undefined },
        }
      }),
    addMessage: (message) => {
      const existing_msgs: Message[] =
        useToolMessageStore.getState().page_messages

      const newArr = [...existing_msgs, message]
      set({ page_messages: newArr })
      return newArr
    },
    triggerDebugRequest: (reqContent, errorType = DebugErrorType.Runtime) => {
      const req: DebugRequest = {
        id: nanoid(),
        requestContent: reqContent,
        errorType,
      }
      set((state) => ({ debugQueue: [...state.debugQueue, req] }))
    },

    enqueueDebugRequest: (reqContent, errorType = DebugErrorType.Runtime) => {
      useToolMessageStore.getState().triggerDebugRequest(reqContent, errorType)
    },
    dequeueDebugRequest: () => {
      let drained: DebugRequest[] = []
      set((state) => {
        drained = state.debugQueue
        return { debugQueue: [] }
      })
      return drained
    },
  }),
)
