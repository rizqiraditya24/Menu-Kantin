import { getSiteSettings } from '@/lib/supabase';
import MenuLayoutClient from './MenuLayoutClient';

export const dynamic = 'force-dynamic';

export default async function MenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch settings server-side — no delay on page load
    const settings = await getSiteSettings();

    return (
        <MenuLayoutClient
            initialSettings={settings}
        >
            {children}
        </MenuLayoutClient>
    );
}
