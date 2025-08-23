// nav-users.tsx  (styling-only updates)
'use client'

import PricingPlanDialog from '../pricing/pricing-plan-dialog'
import { logout } from '@/app/actions/auth/auth'
import useProfileStore from '@/app/store/profile-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronsUpDown, LogOut, Sparkles } from 'lucide-react'

// nav-users.tsx  (styling-only updates)

export function NavUser() {
  const { isMobile } = useSidebar()
  const user = useProfileStore((state) => state.user)

  return (
    <SidebarMenu className="mt-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-xl px-2 data-[state=open]:bg-accent/60 data-[state=open]:text-accent-foreground hover:bg-muted/60"
            >
              <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/60">
                <AvatarImage
                  src={user?.user_metadata.avatar_url}
                  alt={user?.user_metadata.full_name}
                />
                <AvatarFallback className="rounded-lg">U</AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[13px] font-semibold">
                  {user?.user_metadata.full_name}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {user?.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-xl border bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-lg ring-1 ring-border/60">
                  <AvatarImage
                    src={user?.user_metadata.avatar_url}
                    alt={user?.user_metadata.full_name}
                  />
                  <AvatarFallback className="rounded-lg">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-[13px] font-semibold">
                    {user?.user_metadata.full_name}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <PricingPlanDialog>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-lg"
                >
                  <Sparkles className="mr-2 size-4" />
                  Upgrade to Pro
                </DropdownMenuItem>
              </PricingPlanDialog>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="rounded-lg text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
