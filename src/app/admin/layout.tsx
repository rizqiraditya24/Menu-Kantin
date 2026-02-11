import { getSiteSettings } from '@/lib/supabase';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch settings server-side — no delay on page load
    const settings = await getSiteSettings();

    const initialSettings = {
        logo_url: settings?.logo_url || null,
        site_name: settings?.site_name || 'Menu Warung',
    };

    return (
        <AdminLayoutClient initialSettings={initialSettings}>
            {children}
        </AdminLayoutClient>
    );
}
