import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "1on1";
  const session = await getServerSession(authOptions as any);
  
  return (
    <html lang="ja">
      <body className="bg-gradient-to-br from-orange-50 to-orange-100 text-gray-900 min-h-screen">
        <Providers>
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-soft-orange border-b border-orange-100">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <img src="/logo.avif" alt="1on1" className="w-8 h-8 object-contain" />
                <span className="hidden sm:inline">{appName}</span>
              </Link>
              <nav className="flex items-center gap-2 sm:gap-4 text-sm">
                <Link href="/timeline" className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
                  <span className="text-base">📅</span>
                  <span className="hidden sm:inline">タイムライン</span>
                </Link>
                <Link href="/people" className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
                  <span className="text-base">👥</span>
                  <span className="hidden sm:inline">メンター</span>
                </Link>
                <Link href="/schedule" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 sm:px-3 py-1 rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center gap-1 shadow-md transition-all duration-200">
                  <span className="text-base">🗓️</span>
                  <span className="hidden sm:inline">予約</span>
                </Link>
                <Link href="/pairs" className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded">
                  <span className="text-base">🤝</span>
                  <span className="hidden sm:inline">ペア</span>
                </Link>
                {!session ? (
                  <>
                    <Link href="/login" className="text-orange-600 hover:text-orange-700 hover:underline transition-colors">ログイン</Link>
                    <Link href="/register" className="text-orange-600 hover:text-orange-700 hover:underline transition-colors">新規登録</Link>
                  </>
                ) : (
                  <>
                    <Link href="/profile" className="text-gray-600 hover:underline">{(session as any).user?.name || (session as any).user?.email}</Link>
                    <Link href="/api/auth/signout" className="text-orange-700 hover:text-orange-800 hover:underline transition-colors">ログアウト</Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}