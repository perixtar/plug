// team-switcher.tsx  (styling-only updates)
'use client'

import { useInviteMemberStore } from '@/app/store/invite-member-store'
import useWorkspaceStore from '@/app/store/workspace-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SiteURL } from '@/constants/site-url'
import { workspace } from '@/lib/generated/prisma'
import {
  ChevronsUpDown,
  GalleryVerticalEnd,
  Plus,
  UserPlus2,
  Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

// team-switcher.tsx  (styling-only updates)

export function TeamSwitcher({
  workspaces,
  current_workspace_id,
}: {
  workspaces: workspace[] | null
  current_workspace_id: string | null
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { isMobile } = useSidebar()
  const { setCurrentWorkspace } = useWorkspaceStore()
  const activeWorksapce = workspaces?.find(
    (workspace) => workspace.id === current_workspace_id,
  )
  const { openInviteMemberDialog } = useInviteMemberStore()

  if (!activeWorksapce) return null

  const handleAddWorkspace = () => {
    router.push(SiteURL.ONBOARDING)
  }

  return (
    <SidebarMenu className="mt-2">
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-xl px-2 data-[state=open]:bg-accent/60 data-[state=open]:text-accent-foreground hover:bg-muted/60"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground ring-1 ring-border/60">
                <GalleryVerticalEnd className="size-4" />
              </div>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[13px] font-semibold">
                  {activeWorksapce.name}
                </span>
                <span className="mt-[2px] inline-flex h-5 w-fit items-center rounded-md border px-1.5 text-[10px] text-muted-foreground">
                  Enterprise
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-xl border bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80 w-[--radix-dropdown-menu-trigger-width]"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Workspace
            </DropdownMenuLabel>

            {workspaces?.map((team, index) => {
              const isActive = team.id === current_workspace_id
              return (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => setCurrentWorkspace(team.id)}
                  className={[
                    'gap-2 p-2 rounded-lg',
                    'hover:bg-muted/60',
                    isActive ? 'bg-accent/60 text-foreground' : '',
                  ].join(' ')}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <GalleryVerticalEnd className="size-4" />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center">
                    <span className="truncate">{team.name}</span>
                  </div>

                  {isActive ? (
                    <Check className="ml-2 size-4 shrink-0 opacity-80" />
                  ) : (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              )
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/60"
              onClick={() => {
                // unmount so the invite dialog is interactable
                setMenuOpen(false)
                openInviteMemberDialog()
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <UserPlus2 className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Invite member
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/60"
              onClick={handleAddWorkspace}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add workspace
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
