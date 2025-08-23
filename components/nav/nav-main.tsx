'use client'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SiteURL } from '@/constants/site-url'
import { PlusCircleIcon } from 'lucide-react'

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2">
          <SidebarMenuButton tooltip="Create new internal tool">
            <PlusCircleIcon />
            <a href={SiteURL.CREATE_NEW_TOOL}>
              <span>Create New Tool</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
