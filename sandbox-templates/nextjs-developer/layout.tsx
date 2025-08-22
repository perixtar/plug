import PostHogProviderWrapper from './PostHogProviderWrapper'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Script id="iframe-error-handler" strategy="beforeInteractive">
          {`
            window.onerror = function(message, source, lineno, colno, error) {
              parent.postMessage({
                type: 'iframe-error',
                message,
                source,
                lineno,
                colno,
                stack: error && error.stack
              }, '*');
            };
          `}
        </Script>
        <Toaster />
        <PostHogProviderWrapper>{children}</PostHogProviderWrapper>
      </body>
    </html>
  )
}
