'use client'

import useWorkspaceStore from '../store/workspace-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { SiteURL } from '@/constants/site-url'
import type { tool as ToolModel } from '@/lib/generated/prisma'
import { PlusCircle, ExternalLink, PencilLine } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useEffect } from 'react'

export type WorkspaceToTools = Record<string, ToolModel[]>

function formatRelativeTime(date?: Date | string | null) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const ms = Date.now() - d.getTime()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const dys = Math.floor(h / 24)
  if (s < 60) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${dys}d ago`
}

function ToolCard({ t }: { t: ToolModel }) {
  const previewHref = `${SiteURL.BASE}/dashboard/${t.id}`
  const editHref = `${SiteURL.TOOL}/${t.id}/edit`
  const updated = formatRelativeTime(t.updated_at as any)

  return (
    <Card className="group relative h-full overflow-hidden backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate text-xl">{t.name}</CardTitle>
            {t.description ? (
              <CardDescription className="mt-1 line-clamp-2">
                {t.description}
              </CardDescription>
            ) : null}
          </div>
          {/* Example status chip; swap logic when you have real status */}
          <Badge variant="secondary" className="shrink-0">
            Draft
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Preview area (placeholder); replace with real thumbnail or live snapshot when ready */}
        <div className="relative h-40 w-full rounded-xl border border-border/60 bg-muted/40">
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Preview
          </div>

          {/* Hover quick actions overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-end gap-2 bg-gradient-to-t from-background/80 via-background/40 to-transparent p-3 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <Button asChild size="sm" variant="secondary" className="gap-1">
              <Link href={previewHref} aria-label={`Preview ${t.name}`}>
                <ExternalLink className="h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1">
              <Link href={editHref} aria-label={`Edit ${t.name}`}>
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Updated {updated}</span>
      </CardFooter>
    </Card>
  )
}

export default function Dashboard() {
  const workspace_to_tools = useWorkspaceStore((s) => s.workspace_to_tools)
  const current_workspace_id = useWorkspaceStore((s) => s.current_workspace_id)

  const tools = useMemo(() => {
    if (!workspace_to_tools || !current_workspace_id) return []
    return workspace_to_tools[current_workspace_id] ?? []
  }, [workspace_to_tools, current_workspace_id])

  //   Optional: if you truly want to redirect when empty, uncomment below.
  useEffect(() => {
    if (current_workspace_id && tools.length === 0) {
      window.location.href = SiteURL.CREATE_NEW_TOOL
    }
  }, [current_workspace_id, tools.length])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold">My Tools</h1>
          {tools.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {tools.length} total
            </span>
          ) : null}
        </div>

        <Button asChild className="gap-2">
          <Link href={SiteURL.CREATE_NEW_TOOL}>
            <PlusCircle className="h-4 w-4" />
            New tool
          </Link>
        </Button>
      </div>

      {tools.length === 0 ? (
        <div className="mx-auto mt-24 max-w-xl rounded-2xl border border-border/60 bg-card/60 p-10 text-center">
          <div className="mb-2 text-xl font-semibold">No tools yet</div>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first tool to get started. You’ll be able to edit, run a
            preview, and share it with your team.
          </p>
          <Button asChild className="gap-2">
            <Link href={SiteURL.CREATE_NEW_TOOL}>
              <PlusCircle className="h-4 w-4" />
              Create a tool
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}
