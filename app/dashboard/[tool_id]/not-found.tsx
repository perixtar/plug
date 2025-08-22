import { loginWithProvider } from '@/app/actions/auth/auth'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { OAuthProvider } from '@/constants/oauth-provider'
import { SiteURL } from '@/constants/site-url'
import { Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface NotFoundPageProps {
  contentType: string
}

export default async function NotFound({ contentType }: NotFoundPageProps) {
  const user = await getUserFromServer()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Main content */}
        <div className="text-center space-y-6">
          {/* Lock icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          {/* Heading and description */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">
              This {contentType} could not be found
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You may not have access, or it might have been deleted or moved.
              Check the link and try again.
            </p>
          </div>

          {/* Action button */}
          <Button
            variant="secondary"
            className="bg-muted hover:bg-muted/80 text-foreground border-border"
          >
            <Link
              href={SiteURL.DASHBOARD}
              className="flex flex-row items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to my content
            </Link>
          </Button>
        </div>

        {/* Bottom user info */}
        <div className="pt-8">
          <Separator className="bg-border mb-4" />
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Logged in as</span>
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
            <span>•</span>
            <form
              action={async () => {
                'use server'
                await loginWithProvider(OAuthProvider.GOOGLE)
              }}
            >
              <button className="hover:text-foreground transition-colors">
                Switch account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
