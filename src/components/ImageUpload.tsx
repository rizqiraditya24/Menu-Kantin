'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
    currentImageUrl?: string | null;
    onImageUploaded: (url: string) => void;
}

export default function ImageUpload({ currentImageUrl, onImageUploaded }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
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
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            onImageUploaded(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Gagal mengupload gambar');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Gambar Produk
            </label>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-secondary-300 rounded-xl p-4 cursor-pointer hover:border-secondary-500 transition-colors bg-secondary-50/50"
            >
                {preview ? (
                    <div className="relative aspect-video">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-gray-500 text-sm">Klik untuk upload gambar</p>
                        <p className="text-gray-400 text-xs mt-1">JPG, PNG, atau WebP</p>
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
