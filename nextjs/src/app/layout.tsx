import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ScrollRestoration from '@/components/ScrollRestoration';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/** 站点元数据 */
export const metadata: Metadata = {
  title: "轩辕李 | 和 AI 一起编程",
  description: "AI 编程时代的实践者与思考者",
  keywords: ["AI编程", "提示工程", "轩辕李", "个人展示"],
};

/** 根布局组件 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-primary text-[var(--text-primary)]`}
      >
        <ScrollRestoration />
        {children}
      </body>
    </html>
  );
}
