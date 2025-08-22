'use client'

import { useToolStore } from '@/app/store/tool-store'
import { useToolViewStore } from '@/app/store/tool-view-store'
import { previewUrl } from '@/lib/preview'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const ViewToolPage = () => {
  const [iframeKey, setIframeKey] = useState(0)
  const deploymentResult = useToolViewStore((state) => state.deploymentResult)
  const toolViewUrl = useToolViewStore((state) => state.tool_view_url)
  const currentNavPage = useToolViewStore(
    (state) => state.currentNavPage || '/',
  )
  const { setToolViewCurrentUrl } = useToolViewStore()

  useEffect(() => {
    setToolViewCurrentUrl(currentNavPage)
  }, [currentNavPage])

  return (
    <div className="flex flex-col w-full h-full p-4">
      {toolViewUrl ? (
        <iframe
          key={iframeKey}
          className="h-full w-full"
          sandbox="allow-forms allow-scripts allow-same-origin"
          loading="lazy"
          src={toolViewUrl}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="animate-spin h-8 w-8" />
          <span className="text-lg font-medium">Loading preview...</span>
        </div>
      )}
    </div>
  )
}

export default ViewToolPage
