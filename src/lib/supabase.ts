import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if URL is provided (avoids build-time errors)
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any;


// Types for database tables
export interface Category {
    id: string;
    name: string;
    created_at: string;
    product_count?: number;
}

export interface Product {
    id: string;
    name: string;
    category_id: string;
    description: string | null;
    price: number;
    image_url: string | null;
    created_at: string;
    category?: Category;
}

export interface SiteSettings {
    id: string;
    site_name: string;
    logo_url: string | null;
    slogan: string | null;
    whatsapp_number: string | null;
    updated_at: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Order {
    id: string;
    customer_name: string;
    customer_note: string | null;
    total_price: number;
    status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
    order_items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    product?: Product;
}

// Helper: fetch site settings (returns first row or defaults)
export async function getSiteSettings(): Promise<SiteSettings | null> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid error if table is empty

    if (error) {
        // Only log actual errors, not "no rows" (though maybeSingle handles no rows)
        console.error('Error fetching site settings:', error.message);
        return null;
    }

    // Return data or default structure if needed, but null is handled by callers
    return data;
}

// Helper: update or insert site settings
export async function upsertSiteSettings(settings: Partial<SiteSettings>) {
    // Try to get existing
    const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('site_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('site_settings')
            .insert({ ...settings });
        if (error) throw error;
    }
}

// Format price helper
export function formatPrice(price: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}
