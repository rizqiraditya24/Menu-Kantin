'use client';

import { useState, useEffect } from 'react';
import { supabase, SiteSettings, getSiteSettings, upsertSiteSettings } from '@/lib/supabase';
import ImageUpload from '@/components/ImageUpload';

export default function PengaturanPage() {
    const [settings, setSettings] = useState<Partial<SiteSettings>>({
        site_name: '',
        logo_url: '',
        slogan: '',
        whatsapp_number: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [oldLogoUrl, setOldLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await getSiteSettings();
            if (data) {
                setSettings({
                    site_name: data.site_name || '',
                    logo_url: data.logo_url || '',
                    slogan: data.slogan || '',
                    whatsapp_number: data.whatsapp_number || '',
                });
                // Remember the current logo URL to delete later if changed
                setOldLogoUrl(data.logo_url || null);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Extract storage file path from a Supabase public URL
    const getStoragePathFromUrl = (url: string, bucket: string): string | null => {
        try {
            const marker = `/storage/v1/object/public/${bucket}/`;
            const idx = url.indexOf(marker);
            if (idx === -1) return null;
            return url.substring(idx + marker.length);
        } catch {
            return null;
        }
    };

    // Delete old logo file from Supabase Storage
    const deleteOldLogo = async (oldUrl: string) => {
        const filePath = getStoragePathFromUrl(oldUrl, 'product-images');
        if (!filePath) return;

        try {
            const { error } = await supabase.storage
                .from('product-images')
                .remove([filePath]);
            if (error) {
                console.error('Error deleting old logo:', error.message);
            }
        } catch (err) {
            console.error('Failed to delete old logo:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);

        try {
            const newLogoUrl = settings.logo_url || null;

            // If logo changed, delete the old one from storage
            if (oldLogoUrl && newLogoUrl !== oldLogoUrl) {
                await deleteOldLogo(oldLogoUrl);
            }

            await upsertSiteSettings({
                site_name: settings.site_name || 'Pesan Warung',
                logo_url: newLogoUrl,
                slogan: settings.slogan || null,
                whatsapp_number: settings.whatsapp_number || null,
            });

            // Clear all site settings cache
            localStorage.removeItem('siteSettings');

            // Write fresh data to cache
            const freshSettings = {
                site_name: settings.site_name || 'Pesan Warung',
                logo_url: newLogoUrl,
                slogan: settings.slogan || null,
                whatsapp_number: settings.whatsapp_number || null,
            };
            localStorage.setItem('siteSettings', JSON.stringify(freshSettings));

            // Notify layout and other listeners to refresh
            window.dispatchEvent(new Event('siteSettingsUpdated'));

            // Update old logo reference to the new one
            setOldLogoUrl(newLogoUrl);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert('Gagal menyimpan pengaturan: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengaturan Situs</h2>
                <p className="text-gray-600">Atur informasi dasar situs web Anda</p>
            </div>

            {saved && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 animate-fadeIn flex items-center gap-2">
                    Pengaturan berhasil disimpan!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Text Inputs */}
                    <div className="space-y-6">
                        {/* Site Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Situs / Warung
                            </label>
                            <input
                                type="text"
                                value={settings.site_name || ''}
                                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                placeholder="Contoh: Warung Makan Barokah"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Slogan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slogan / Tagline
                            </label>
                            <input
                                type="text"
                                value={settings.slogan || ''}
                                onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                                placeholder="Contoh: Makanan Enak & Terjangkau"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nomor WhatsApp
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={settings.whatsapp_number || ''}
                                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                    placeholder="Contoh: 08123456789"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Nomor ini digunakan untuk menerima konfirmasi pesanan dari pelanggan via WhatsApp
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Logo & Preview */}
                    <div className="space-y-6">
                        {/* Logo */}
                        <div>
                            <ImageUpload
                                currentImageUrl={settings.logo_url}
                                onImageUploaded={(url) => setSettings({ ...settings, logo_url: url })}
                                bucket="product-images"
                                folder="site"
                                label="Logo Situs"
                                compact={true}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Disarankan ukuran 200x200px, rasio 1:1
                            </p>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sticky top-4">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3">Preview Header</h3>
                            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    {settings.logo_url ? (
                                        <img
                                            src={settings.logo_url}
                                            alt="Logo"
                                            className="w-10 h-10 rounded-xl object-cover border-2 border-white/30"
                                        />
                                    ) : (
                                        <span className="text-3xl">🍜</span>
                                    )}
                                    <div>
                                        <h4 className="text-lg font-bold text-white">
                                            {settings.site_name || 'Pesan Warung'}
                                        </h4>
                                        <p className="text-xs text-white/80">
                                            {settings.slogan || 'Makanan Enak & Terjangkau'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin text-xl">⏳</span> Menyimpan...
                            </>
                        ) : (
                            <>
                                Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
