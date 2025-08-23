'use client'

import IconSelector from '../selector/icon-selector'
import { useToolStore } from '@/app/store/tool-store'
import { useToolViewStore } from '@/app/store/tool-view-store'
import useWorkspaceStore from '@/app/store/workspace-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { SiteURL } from '@/constants/site-url'
import { tool, tool_page } from '@/lib/generated/prisma'
import clsx from 'clsx'
import { ChevronRight, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface NavProjectsProps {
  tools: tool[] | null
  wsToolPages: tool_page[] | null
}

type SelectedSub = { toolId: string; page: string } | null

export function NavProjects({ tools, wsToolPages }: NavProjectsProps) {
  const current_tool = useToolStore((s) => s.current_tool)
  const workspace_id = useWorkspaceStore((s) => s.current_workspace_id)
  const toolToNavPages = useToolViewStore((s) => s.toolToNavPages)
  const { removeToolFromWorkspace, updateToolIcon } = useWorkspaceStore()
  const { setToolViewCurrentUrl } = useToolViewStore()

  // Single global selected sub-item
  const [selectedSub, setSelectedSub] = useState<SelectedSub>(null)

  // Single, global modal control
  const [confirmTool, setConfirmTool] = useState<tool | null>(null)

  const handleDeleteTool = (t: tool) => {
    if (workspace_id) removeToolFromWorkspace(workspace_id, t.id)
    if (selectedSub?.toolId === t.id) setSelectedSub(null)
    setConfirmTool(null)
  }

  const handleToolClicked = (t: tool) => {
    if (current_tool?.id === t.id) return
    useToolStore.setState({ current_tool: t })
    window.location.href = `/dashboard/${t.id}`
  }

  return (
    <SidebarGroup className="mt-2">
      <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
        <span
          onClick={() => {
            window.location.href = SiteURL.DASHBOARD
          }}
          style={{ cursor: 'pointer' }}
        >
          Tools
        </span>
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {tools?.map((t) => {
          const isActive = t.id === current_tool?.id
          return (
            <Collapsible
              key={t.id}
              asChild
              defaultOpen={isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem className="group relative">
                {/* left active border */}
                <span
                  className={clsx(
                    'pointer-events-none absolute inset-y-1 left-0 w-[3px] rounded-r',
                    isActive ? 'bg-primary' : 'bg-transparent',
                  )}
                />

                <div className="flex w-full items-center">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={t.name ?? ''}
                      className={clsx(
                        'h-9 w-full gap-2 rounded-xl px-2',
                        'transition-all',
                        'data-[state=open]:bg-accent/60',
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'hover:bg-muted/60',
                      )}
                    >
                      <IconSelector
                        selectedIcon={t.icon}
                        toolId={t.id}
                        onIconChange={updateToolIcon}
                      />

                      <span
                        className="flex-1 overflow-hidden text-sm font-medium text-foreground/90 whitespace-nowrap text-ellipsis"
                        onClick={() => handleToolClicked(t)}
                      >
                        {t.name}
                      </span>

                      <ChevronRight className="ml-1 size-4 shrink-0 opacity-70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {/* More menu -> open modal after menu closes (no freeze) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={clsx(
                          'ml-1 inline-flex size-8 items-center justify-center rounded-lg',
                          'text-muted-foreground/70 hover:text-foreground hover:bg-muted/60',
                          'opacity-0 transition-opacity group-hover:opacity-100',
                          isActive && 'opacity-100',
                        )}
                        aria-label="More options"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="min-w-44"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={() => {
                          requestAnimationFrame(() => {
                            requestAnimationFrame(() => setConfirmTool(t))
                          })
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CollapsibleContent>
                  <SidebarMenuSub className="mt-1 space-y-0.5 pl-3">
                    {toolToNavPages?.[t.id]?.map((page) => {
                      const pageVal = page || ''
                      const isSelected =
                        selectedSub?.toolId === t.id &&
                        selectedSub?.page === pageVal

                      return (
                        <SidebarMenuSubItem key={page}>
                          <SidebarMenuSubButton
                            asChild
                            className={clsx(
                              // 👇 add cursor-pointer here
                              'h-8 rounded-lg px-2 text-sm transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-accent text-foreground shadow-inner'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                            )}
                            aria-current={isSelected ? 'page' : undefined}
                          >
                            <span
                              className="flex w-full items-center gap-2"
                              onClick={() => {
                                setSelectedSub({ toolId: t.id, page: pageVal })
                                setToolViewCurrentUrl(pageVal)
                                handleToolClicked(t)
                              }}
                            >
                              <span
                                className={clsx(
                                  'inline-block size-1.5 rounded-full',
                                  isSelected
                                    ? 'bg-primary'
                                    : 'bg-muted-foreground/40',
                                )}
                              />
                              <span className="truncate">{page}</span>
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>

      {/* Single, top-level modal confirmation */}
      <AlertDialog
        open={!!confirmTool}
        onOpenChange={(open) => {
          if (!open) setConfirmTool(null)
        }}
      >
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Delete{' '}
              <strong>“{confirmTool?.name}”</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmTool && handleDeleteTool(confirmTool)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarGroup>
  )
}
