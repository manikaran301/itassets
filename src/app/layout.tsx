import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { cookies } from "next/headers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "M_AMS | Asset Management System",
  description:
    "Next-generation Asset Management System for HR, IT, and Admin teams.",
  icons: {
    icon: "/mrllogo.png",
    shortcut: "/mrllogo.png",
    apple: "/mrllogo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("mams-theme")?.value || "light";

  return (
    <html lang="en" className={theme} suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${jbMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <NotificationProvider>
                <SearchProvider>
                  <SidebarWrapper>
                    {children}
                  </SidebarWrapper>
                </SearchProvider>
              </NotificationProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
