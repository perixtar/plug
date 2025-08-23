'use client'

import useWorkspaceStore from '@/app/store/workspace-store'
import { NavMain } from '@/components/nav/nav-main'
import { NavProjects } from '@/components/nav/nav-projects'
import { NavUser } from '@/components/nav/nav-user'
import { TeamSwitcher } from '@/components/nav/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import * as React from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // fetch the selected workspace from the store and then fetch all thte tools from the workspace
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const workspace_to_tools = useWorkspaceStore(
    (state) => state.workspace_to_tools,
  )
  const workspace_to_toolpages = useWorkspaceStore(
    (state) => state.workspace_to_toolpages,
  )
  const current_workspace_id = useWorkspaceStore(
    (state) => state.current_workspace_id,
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row justify-center items-center relative group">
        <TeamSwitcher
          workspaces={workspaces}
          current_workspace_id={current_workspace_id}
        />
        <SidebarTrigger className="hidden group-hover:block transition-opacity" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {current_workspace_id && workspace_to_tools && (
          <NavProjects
            tools={workspace_to_tools[current_workspace_id]}
            wsToolPages={workspace_to_toolpages![current_workspace_id]}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
