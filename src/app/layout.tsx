import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { UserHeader } from "@/components/UserHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "M_AMS | Asset Management System",
  description:
    "Next-generation Asset Management System for HR, IT, and Admin teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${jbMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Sidebar />
              <main className="pl-64 min-h-screen bg-background">
                <UserHeader />
                <div className="p-4 md:p-6 pb-20">{children}</div>
              </main>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
