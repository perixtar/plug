import { getOrCreateToolPage } from '../actions/page/create-page'
import { Message } from '@/lib/messages'
import { create } from 'zustand'

export const MAX_NUM_PAGES = 100

export interface PageState {
  pages: string[]
  currentPage: string
  isAddingPage: boolean
  error: string
  page_initialized: boolean
}

const INITIAL_STATE: PageState = {
  pages: [],
  currentPage: '',
  isAddingPage: false,
  error: '',
  page_initialized: false,
}

interface PageActions {
  setPages: (pages: string[]) => void
  addPage: (
    page: string,
    tool_id: string,
    workspace_id: string,
  ) => Promise<boolean>
  setCurrentPage: (page: string) => void
  setIsAddingPage: (isAdding: boolean) => void
  setError: (error: string) => void
}

export const usePageStore = create<PageState & PageActions>((set) => ({
  // ---------------------------- STATES ----------------------------
  pages: INITIAL_STATE.pages,
  currentPage: INITIAL_STATE.currentPage,
  isAddingPage: INITIAL_STATE.isAddingPage,
  error: INITIAL_STATE.error,
  page_initialized: INITIAL_STATE.page_initialized,

  // ---------------------------- ACTIONS ----------------------------

  setPages: (pages) => set({ pages }),
  setError: (error) => set({ error }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setIsAddingPage: (isAddingPage) => set({ isAddingPage }),
  addPage: async (page: string, tool_id: string, workspace_id: string) => {
    console.log('Adding page:', page)
    if (!tool_id) {
      return false
    }

    // validate page name
    const trimmedPage = page.trim()
    if (!trimmedPage) {
      set({ error: 'Page name cannot be empty' })
      return false
    }

    if (!validatePageName(trimmedPage)) {
      set({
        error:
          'Page name can only contain letters, numbers, hyphens, and underscores',
      })
      return false
    }
    const pages = usePageStore.getState().pages

    if (pages.includes(trimmedPage)) {
      set({ error: 'This page already exists' })
      return false
    }

    if (pages.length == MAX_NUM_PAGES) {
      set({
        error: `You have exceeded the maximum allowed number pages: ${MAX_NUM_PAGES}. Delete existing page or contact developer for more pages. `,
      })
      return false
    }

    // add new page to the dropdown
    set((state) => ({
      pages: [...state.pages, page],
      currentPage: page,
      isAddingPage: false,
    }))

    // update db with new page
    await getOrCreateToolPage(page, tool_id, workspace_id)
    return true
  },
}))

// TODO: For Delete page, we should enforce user keeping at least one page

const validatePageName = (name: string) => {
  // Allow only alphanumeric characters, hyphens, and underscores
  const validPageNameRegex = /^[a-zA-Z0-9-_]+$/
  return validPageNameRegex.test(name)
}
