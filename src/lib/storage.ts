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

const STORAGE_KEYS = {
    CATEGORIES: 'menu_kantin_categories',
    PRODUCTS: 'menu_kantin_products',
    AUTH: 'menu_kantin_auth',
};

// Seed data
const seedCategories: Category[] = [
    { id: '1', name: 'Makanan', created_at: new Date().toISOString() },
    { id: '2', name: 'Minuman', created_at: new Date().toISOString() },
    { id: '3', name: 'Snack', created_at: new Date().toISOString() },
];

const seedProducts: Product[] = [
    {
        id: '1',
        name: 'Nasi Goreng',
        category_id: '1',
        description: 'Nasi goreng spesial dengan telur',
        price: 15000,
        image_url: null,
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Es Teh Manis',
        category_id: '2',
        description: 'Teh manis dingin segar',
        price: 3000,
        image_url: null,
        created_at: new Date().toISOString()
    },
];

type StorageResponse<T> = {
    data?: T;
    error: { message: string } | null;
};

const safelySetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            throw new Error('Penyimpanan penuh. Gambar yang Anda upload mungkin terlalu besar. Coba gunakan gambar yang lebih kecil atau hapus beberapa produk/kategori.');
        }
        throw error;
    }
};

export const storage = {
    // Init
    init: () => {
        if (typeof window === 'undefined') return;

        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            safelySetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(seedCategories));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
            safelySetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
        }
    },

    // Auth
    login: (email: string) => {
        safelySetItem(STORAGE_KEYS.AUTH, JSON.stringify({ email, role: 'admin' }));
        return { user: { email, role: 'admin' } };
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
    },

    getUser: () => {
        if (typeof window === 'undefined') return null;
        const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
        return auth ? JSON.parse(auth) : null;
    },

    // Categories
    getCategories: () => {
        if (typeof window === 'undefined') return [];
        const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

        return cats.map((c: Category) => ({
            ...c,
            product_count: prods.filter((p: Product) => p.category_id === c.id).length
        }));
    },

    addCategory: (name: string): StorageResponse<Category> => {
        const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
        const newCat = {
            id: Date.now().toString(),
            name,
            created_at: new Date().toISOString()
        };
        cats.push(newCat);
        try {
            safelySetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
            return { data: newCat, error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    updateCategory: (id: string, name: string): StorageResponse<Category> => {
        const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
        const index = cats.findIndex((c: Category) => c.id === id);
        if (index === -1) return { error: { message: 'Category not found' } };

        cats[index].name = name;
        try {
            safelySetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
            return { data: cats[index], error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    deleteCategory: (id: string): StorageResponse<void> => {
        const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

        if (prods.some((p: Product) => p.category_id === id)) {
            return { error: { message: 'Kategori tidak bisa dihapus karena masih memiliki produk' } };
        }

        const newCats = cats.filter((c: Category) => c.id !== id);
        try {
            safelySetItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCats));
            return { error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    // Products
    getProducts: () => {
        if (typeof window === 'undefined') return [];
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');

        return prods.map((p: Product) => ({
            ...p,
            category: cats.find((c: Category) => c.id === p.category_id)
        }));
    },

    addProduct: (product: Omit<Product, 'id' | 'created_at' | 'category'>): StorageResponse<Product> => {
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const newProd = {
            ...product,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
        };
        prods.push(newProd);
        try {
            safelySetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
            return { data: newProd, error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    updateProduct: (id: string, updates: Partial<Product>): StorageResponse<Product> => {
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const index = prods.findIndex((p: Product) => p.id === id);
        if (index === -1) return { error: { message: 'Product not found' } };

        prods[index] = { ...prods[index], ...updates };
        try {
            safelySetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
            return { data: prods[index], error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    deleteProduct: (id: string): StorageResponse<void> => {
        const prods = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        const newProds = prods.filter((p: Product) => p.id !== id);
        try {
            safelySetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProds));
            return { error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    }
};
