import type { Metadata } from "next";
import "./globals.css";

import { getSiteSettings } from "@/lib/supabase";

export async function generateMetadata() {
    const settings = await getSiteSettings();
    return {
        title: settings?.site_name || "Menu Warung",
        description: settings?.slogan || "Menu makanan warung/kantin online",
        icons: {
            icon: settings?.logo_url || '/favicon.ico', // Fallback if no logo
        },
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className="antialiased min-h-screen bg-gradient-to-br from-secondary-50 to-white">
                {children}
            </body>
        </html>
    );
}
