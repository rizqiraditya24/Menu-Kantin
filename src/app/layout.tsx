import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Menu Warung",
    description: "Menu makanan warung/kantin online",
};

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
