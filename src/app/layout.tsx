import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "M_AMS | Asset Management System",
  description: "Next-generation Asset Management System for HR, IT, and Admin teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased font-inter`}
      >
        <AuthProvider>
          <Sidebar />
          <main className="pl-64 min-h-screen bg-background">
            <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 flex items-center px-6">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Enterprise Assets</h1>
              <div className="ml-auto flex items-center gap-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="bg-muted px-4 py-1.5 rounded-full text-sm border border-transparent focus:border-primary/30 outline-none transition-all w-64 group-hover:w-80"
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg">
                  JD
                </div>
              </div>
            </header>
            <div className="p-4 md:p-6 pb-20">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
