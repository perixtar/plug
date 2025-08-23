import Logo from './logo'
import { CopyButton } from './ui/copy-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'

export function DeployDialog({ url }: { url: string }) {
  const posthog = usePostHog()

  const [deployedURL, setDeployedURL] = useState<string | null>(null)
  const [siteName, setSiteName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDeployedURL(null)
    setError(null)
  }, [url])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">
          <Logo style="e2b" width={16} height={16} className="mr-2" />
          Deploy Site
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-4 w-80 flex flex-col gap-2">
        <div className="text-sm font-semibold">Deploy Your Site</div>
        <div className="text-sm text-muted-foreground">
          Deploy your site with our subdomain service.
        </div>
        <form
          className="flex flex-col gap-2"
          onSubmit={() => {
            console.log('Deploying site:', siteName)
          }}
        >
          {deployedURL ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">Your site is deployed!</div>
              <div className="flex items-center gap-2">
                <Input value={deployedURL} readOnly />
                <CopyButton content={deployedURL} />
              </div>
            </div>
          ) : (
            <>
              <Input
                placeholder="Enter site name (e.g., mysite)"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
              />
              {error && <div className="text-sm text-red-500">{error}</div>}
            </>
          )}
          <Button
            type="submit"
            variant="default"
            disabled={deployedURL !== null || isLoading}
          >
            {isLoading
              ? 'Deploying...'
              : deployedURL
                ? 'Deployed'
                : 'Deploy Site'}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
