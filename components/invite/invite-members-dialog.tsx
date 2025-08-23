'use client'

import { EmailInput } from './email-input'
import { sendInviteEmails } from '@/app/actions/auth/send-invite-email'
import { useInviteMemberStore } from '@/app/store/invite-member-store'
import useWorkspaceStore from '@/app/store/workspace-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function InviteMembersDialog() {
  const {
    isInviteMemberDialogOpen,
    emails,
    closeInviteMemberDialog,
    setEmails,
    resetEmails,
  } = useInviteMemberStore()
  const workspace_id = useWorkspaceStore((s) => s.current_workspace_id)

  const workspace_name = useWorkspaceStore(
    (s) => s.workspaces!.find((w) => w.id === s.current_workspace_id)?.name,
  )

  const handleSendInvite = async () => {
    await sendInviteEmails(emails, workspace_id!, workspace_name!)

    // Reset form and close dialog
    resetEmails()
    closeInviteMemberDialog()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset emails when dialog is closed
      resetEmails()
      closeInviteMemberDialog()
    }
  }

  return (
    <Dialog open={isInviteMemberDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-medium">
            Invite members
          </DialogTitle>
          <DialogDescription className="sr-only">
            Send email invitations to new team members to join your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Type or paste in emails below, separated by commas
          </p>

          <div className="space-y-2">
            <Label htmlFor="emails" className="text-sm">
              Email addresses
            </Label>
            <EmailInput emails={emails} onEmailsChange={setEmails} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSendInvite} disabled={emails.length === 0}>
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
