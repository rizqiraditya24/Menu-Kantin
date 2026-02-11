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

/**
 * Compress an image file to fit within maxSizeBytes using Canvas API.
 * Progressively reduces quality and dimensions until the file is small enough.
 * Returns a compressed File object (always JPEG for best compression).
 */
async function compressImage(file: File, maxSizeBytes: number): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Start with original dimensions
            let width = img.width;
            let height = img.height;

            // Cap max dimension to 2048px as initial step
            const MAX_DIMENSION = 2048;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            // Try progressive compression: reduce quality first, then dimensions
            const tryCompress = (currentWidth: number, currentHeight: number, quality: number) => {
                canvas.width = currentWidth;
                canvas.height = currentHeight;
                ctx.clearRect(0, 0, currentWidth, currentHeight);
                ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        if (blob.size <= maxSizeBytes || quality <= 0.1) {
                            // Success or minimum quality reached
                            const compressedFile = new File(
                                [blob],
                                file.name.replace(/\.[^.]+$/, '.jpg'),
                                { type: 'image/jpeg' }
                            );
                            resolve(compressedFile);
                        } else if (quality > 0.3) {
                            // Reduce quality first
                            tryCompress(currentWidth, currentHeight, quality - 0.1);
                        } else {
                            // Quality is low, reduce dimensions by 20%
                            const newWidth = Math.round(currentWidth * 0.8);
                            const newHeight = Math.round(currentHeight * 0.8);
                            tryCompress(newWidth, newHeight, 0.6);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            tryCompress(width, height, 0.85);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
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
    const [compressing, setCompressing] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState<string | null>(null);
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
        setStatusText(null);

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

        setUploading(true);

        try {
            let fileToUpload: File = file;

            // Compress if file exceeds max size
            if (file.size > MAX_FILE_SIZE) {
                setCompressing(true);
                setStatusText('Mengompresi gambar...');
                fileToUpload = await compressImage(file, MAX_FILE_SIZE);
                setCompressing(false);

                // Update preview with compressed image
                const compressedReader = new FileReader();
                compressedReader.onloadend = () => {
                    setPreview(compressedReader.result as string);
                };
                compressedReader.readAsDataURL(fileToUpload);
            }

            setStatusText('Mengupload...');

            // Use .jpg extension for compressed files
            const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onImageUploaded(publicUrl);
            setStatusText(null);
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('Gagal mengupload gambar. Silakan coba lagi.');
            setStatusText(null);
        } finally {
            setUploading(false);
            setCompressing(false);
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
                        {/* Overlay uploading/compressing icon */}
                        {(uploading || compressing) && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg z-10 gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                                {statusText && (
                                    <span className="text-white text-xs font-medium px-2 py-1 bg-black/30 rounded-full">
                                        {statusText}
                                    </span>
                                )}
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
                                <p className="text-gray-400 text-xs mt-1">Gambar otomatis dikompres maks. 4MB</p>
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
