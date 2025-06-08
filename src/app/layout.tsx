import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'POSアプリケーション',
  description: 'モバイルPOSシステム',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}