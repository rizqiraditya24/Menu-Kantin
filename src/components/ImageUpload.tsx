'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

interface ImageUploadProps {
    currentImageUrl?: string | null;
    onImageUploaded: (url: string) => void;
    bucket?: string;
    folder?: string;
    label?: string;
    compact?: boolean;
}

export default function ImageUpload({
    currentImageUrl,
    onImageUploaded,
    bucket = 'product-images',
    folder = 'products',
    label = 'Gambar Produk',
    compact = false,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync preview when currentImageUrl changes
    useEffect(() => {
        if (currentImageUrl) {
            setPreview(currentImageUrl);
        }
    }, [currentImageUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Check file size (4MB max)
        if (file.size > MAX_FILE_SIZE) {
            setError('Ukuran file maksimal 4MB. Silakan pilih file yang lebih kecil.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Hanya file gambar yang diperbolehkan.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Preview rendering
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onImageUploaded(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('Gagal mengupload gambar. Silakan coba lagi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {error}
                </div>
            )}

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer 
                    hover:border-secondary-500 transition-colors bg-secondary-50/50 overflow-hidden
                    group
                    ${compact ? 'w-32 h-32 flex items-center justify-center' : 'w-full p-4'}
                `}
            >
                {preview ? (
                    <div className={`relative ${compact ? 'w-full h-full' : 'aspect-video w-full'}`}>
                        <img
                            src={preview}
                            alt="Preview"
                            className={`w-full h-full rounded-lg ${compact ? 'object-cover' : 'object-contain bg-gray-100'}`}
                        />
                        {/* Overlay uploading icon */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                            </div>
                        )}
                        {/* Overlay hover text for compact mode */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-xs bg-black/50 px-2 py-1 rounded">
                                Ubah
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={`text-center ${compact ? 'p-2' : 'py-8'}`}>
                        <div className={`${compact ? 'text-2xl' : 'text-4xl'} mb-2`}>📷</div>
                        {!compact && (
                            <>
                                <p className="text-gray-500 text-sm">Klik untuk upload</p>
                                <p className="text-gray-400 text-xs mt-1">Maks. 4MB</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
