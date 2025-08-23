'use server'

import { getUserFromServer } from '@/clients/supabase-server-client'
import InviteToWorkspaceEmail from '@/components/email/invite-to-signup'
import { SiteURL } from '@/constants/site-url'
import { encryptJSONToURLSafeStr } from '@/lib/encryption'
import { InviteUserPayloadSchema } from '@/types/invite-user-payload'
import { Resend } from 'resend'

export async function sendInviteEmail(
  email: string,
  workspace_id: string,
  workspace_name: string,
) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }
  const resend = new Resend(process.env.RESEND_SEND_EMAIL_API_KEY)

  const invite_user_payload = InviteUserPayloadSchema.parse({
    workspace_name: workspace_name,
    workspace_id: workspace_id,
    invite_user_email: email,
    invite_from_user_id: user.id,
  })

  const invite_token = await encryptJSONToURLSafeStr(invite_user_payload)
  // if not exists, send the /signup/invite; otherwise, send the /login/invite email
  let invite_link = `${SiteURL.BASE}/invite/${invite_token}/join`

  await resend.emails.send({
    from: 'no-reply@email.toolmind.ai',
    to: email,
    subject: 'Join me on Toolmind',
    react: InviteToWorkspaceEmail({
      workspace_name,
      invite_link,
      inviter_name: user.user_metadata.full_name,
    }),
  })
}

export async function sendInviteEmails(
  emails: string[],
  workspace_id: string,
  workspace_name: string,
) {
  const emailPromises = emails.map(async (email) => {
    await sendInviteEmail(email, workspace_id, workspace_name)
  })

  return Promise.all(emailPromises)
}
