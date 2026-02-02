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
