import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POSアプリケーション',
  description: 'モバイルPOSシステム',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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