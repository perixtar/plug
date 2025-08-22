'use client'

import { saveRootUserOnboardingData } from '@/app/actions/auth/save-onboarding-data'
import { sendInviteEmails } from '@/app/actions/auth/send-invite-email'
import { useOnboardingStore } from '@/app/store/onboarding-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteURL } from '@/constants/site-url'
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useRef, useState, useTransition } from 'react'

export default function OnboardingPage() {
  const router = useRouter()
  const updateOnboardingData = useOnboardingStore(
    (state) => state.updateOnboardingData,
  )
  const onboardingData = useOnboardingStore((state) => state.onboardingData)

  const [error, setError] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [invitedMemberEmails, setInvitedMemberEmails] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  // Validation state
  const [workspaceTouched, setWorkspaceTouched] = useState(false)
  const workspaceInputRef = useRef<HTMLInputElement | null>(null)
  const workspaceName = (onboardingData.workspaceName || '').trim()
  const isWorkspaceValid = workspaceName.length > 0
  const canSubmit = isWorkspaceValid && !isPending

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleAddInvitedMember = () => {
    if (!newMemberEmail) return
    if (!validateEmail(newMemberEmail)) {
      setError('Please enter a valid email address')
      return
    }
    const next = Array.from(new Set([...invitedMemberEmails, newMemberEmail]))
    setNewMemberEmail('')
    setError('')
    setInvitedMemberEmails(next)
    updateOnboardingData({ invitedMemberEmails: next })
  }

  const handleRemoveInvited = (email: string) => {
    const next = invitedMemberEmails.filter((e) => e !== email)
    setInvitedMemberEmails(next)
    updateOnboardingData({ invitedMemberEmails: next })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // trigger validation on submit
    setWorkspaceTouched(true)
    if (!isWorkspaceValid) {
      workspaceInputRef.current?.focus()
      return
    }

    startTransition(async () => {
      const name = onboardingData.workspaceName
      if (name) {
        const res = await saveRootUserOnboardingData(name)
        await sendInviteEmails(
          onboardingData.invitedMemberEmails,
          res.workspace.id,
          name,
        )
      }
      updateOnboardingData({ workspaceName: '', invitedMemberEmails: [] })
      router.push(SiteURL.DASHBOARD)
    })
  }

  const inputBase =
    'h-12 rounded-2xl border bg-background/90 shadow-sm transition focus-visible:ring-2'
  const inputClass =
    inputBase +
    (workspaceTouched && !isWorkspaceValid
      ? ' border-destructive/60 focus-visible:ring-destructive/40'
      : ' border-border/60 focus-visible:ring-foreground/15')

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Ambient gradients (match SignUp page) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-from)_0%,_transparent_50%)] from-primary/8 via-primary/4 to-transparent dark:from-primary/6" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-from)_0%,_transparent_60%)] from-blue-500/5 to-transparent dark:from-blue-400/3" />
      </div>

      {/* LEFT: form card */}
      <div className="flex flex-1 items-center justify-center p-6 md:w-1/2 md:pr-3">
        <Card className="w-full max-w-md rounded-3xl border border-border/40 bg-card/95 shadow-xl backdrop-blur-sm md:shadow-2xl">
          <form onSubmit={handleSubmit} noValidate>
            <CardHeader className="space-y-3 pb-8 pt-8">
              <CardTitle className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Create workspace
              </CardTitle>
              <CardDescription className="text-center text-balance text-muted-foreground/90">
                Set up your organization&apos;s workspace
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-7 px-8">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input
                  ref={workspaceInputRef}
                  id="workspace-name"
                  placeholder="e.g. Acme Team"
                  value={onboardingData.workspaceName || ''}
                  onChange={(e) =>
                    updateOnboardingData({ workspaceName: e.target.value })
                  }
                  onBlur={() => setWorkspaceTouched(true)}
                  aria-invalid={workspaceTouched && !isWorkspaceValid}
                  aria-describedby={
                    workspaceTouched && !isWorkspaceValid
                      ? 'workspace-error'
                      : undefined
                  }
                  className={inputClass}
                />
                {workspaceTouched && !isWorkspaceValid ? (
                  <p id="workspace-error" className="text-sm text-destructive">
                    Please enter a workspace name.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You can change this anytime in settings.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="invite-email">
                  Invite team members (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    placeholder="name@company.com"
                    className="h-12 flex-1 rounded-2xl border-border/60 bg-background/90 shadow-sm transition focus-visible:ring-2 focus-visible:ring-foreground/15"
                    value={newMemberEmail}
                    onChange={(e) => {
                      setError('')
                      setNewMemberEmail(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddInvitedMember()
                      }
                    }}
                    type="email"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'invite-error' : undefined}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddInvitedMember}
                    className="group h-12 rounded-2xl px-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Add
                  </Button>
                </div>

                {error ? (
                  <p id="invite-error" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                {invitedMemberEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {invitedMemberEmails.map((email) => (
                      <span
                        key={email}
                        className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-3 py-1.5 text-xs text-foreground/90 shadow-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvited(email)}
                          className="rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
                          aria-label={`Remove ${email}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  We’ll email them a secure link to join your workspace.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between gap-2 border-t border-border/40 bg-card/70 px-8 py-6">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-4"
                asChild
              >
                <Link href="/company" aria-label="Go back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>

              <Button
                type="submit"
                className="group h-12 rounded-2xl px-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                title={!isWorkspaceValid ? 'Enter a workspace name' : undefined}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing…
                  </>
                ) : (
                  <>
                    Finish
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* RIGHT: hero panel (unchanged styling to match SignUp) */}
      <div className="hidden border-t border-border/30 bg-gradient-to-br from-muted/20 via-muted/10 to-background/50 p-8 backdrop-blur-sm md:flex md:w-1/2 md:flex-col md:items-center md:justify-center md:border-t-0 md:border-l md:border-border/30 md:pl-3 dark:from-muted/10 dark:via-muted/5 lg:p-12 lg:pl-6">
        <div className="max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Start your journey
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground/90">
              Create your account and set up your workspace in just a few steps
            </p>
          </div>

          <div className="relative mx-auto flex aspect-square w-72 max-w-full items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-blue-500/10 to-primary/20 blur-3xl dark:from-primary/10 dark:via-blue-400/5 dark:to-primary/10" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary/10 to-transparent blur-2xl" />
            <div className="relative flex items-center justify-center">
              <div className="flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary/5 to-primary/15 ring-1 ring-primary/10 backdrop-blur-sm">
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 ring-1 ring-primary/20 backdrop-blur-sm">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/30 ring-1 ring-primary/30 backdrop-blur-sm">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-2xl ring-4 ring-primary/25 backdrop-blur-sm">
                      <span className="text-sm font-bold">Space</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-1 opacity-60">
            <div className="h-2 w-2 rounded-full bg-primary/40" />
            <div className="h-2 w-8 rounded-full bg-primary" />
            <div className="h-2 w-2 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
