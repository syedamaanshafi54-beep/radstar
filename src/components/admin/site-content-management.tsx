'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Loader2, PlusCircle, Trash2, Upload, Save, RotateCcw,
    Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Product } from '@/lib/types';

export type HeroSlide = {
    id: string;
    imageUrl: string;
    imageHint: string;
    headline: string;
    tagline: string;
    cta: string;
    link: string;
    slug?: string;
};

interface SiteContentManagementProps {
    heroSlides: HeroSlide[];
    selectedDealIds: string[];
    products: Product[];
    isLoading: boolean;
    isUploading: boolean;
    onDealSelection: (productId: string) => void;
    onHeroSlideChange: (index: number, field: keyof HeroSlide, value: string) => void;
    onAddHeroSlide: () => void;
    onRemoveHeroSlide: (index: number) => void;
    onRestoreDefaults: () => void;
    onSaveChanges: () => void;
}

export default function SiteContentManagement({
    heroSlides,
    selectedDealIds,
    products,
    isLoading,
    isUploading,
    onDealSelection,
    onHeroSlideChange,
    onAddHeroSlide,
    onRemoveHeroSlide,
    onRestoreDefaults,
    onSaveChanges
}: SiteContentManagementProps) {
    return (
        <Card id="site-management">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle>Site Content Management</CardTitle>
                    <CardDescription>Manage your home page hero slides and deals.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRestoreDefaults}
                        className="hidden sm:flex"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore Defaults
                    </Button>
                    <Button onClick={onSaveChanges} disabled={isLoading || isUploading} size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save All Changes
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Hero Slides Management */}
                        <div>
                            <h3 className="font-semibold mb-4 text-lg">Hero Slides</h3>
                            <div className="space-y-4">
                                {heroSlides.map((slide, index) => (
                                    <div key={slide.id} className="p-4 border rounded-lg space-y-4 relative">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7"
                                            onClick={() => onRemoveHeroSlide(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Image</Label>
                                                <div className="relative aspect-video w-full max-w-[200px] rounded-md overflow-hidden bg-muted border">
                                                    {slide.imageUrl ? (
                                                        <Image
                                                            src={slide.imageUrl}
                                                            alt="Hero Slide"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                            <ImageIcon className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <CldUploadWidget
                                                    uploadPreset="products"
                                                    onSuccess={(result: any) => onHeroSlideChange(index, 'imageUrl', result.info.secure_url)}
                                                >
                                                    {({ open }) => (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => open()}
                                                        >
                                                            <Upload className="mr-2 h-3 w-3" />
                                                            {slide.imageUrl ? 'Change Image' : 'Upload Image'}
                                                        </Button>
                                                    )}
                                                </CldUploadWidget>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Headline</Label>
                                                    <Input
                                                        value={slide.headline}
                                                        onChange={(e) => onHeroSlideChange(index, 'headline', e.target.value)}
                                                        placeholder="Hero Headline"
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>Top Subtext (Tagline)</Label>
                                                    <Input
                                                        value={slide.tagline}
                                                        onChange={(e) => onHeroSlideChange(index, 'tagline', e.target.value)}
                                                        placeholder="e.g., Pure, Raw, and Unprocessed"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>CTA Link</Label>
                                                    <Input
                                                        value={slide.link}
                                                        onChange={(e) => onHeroSlideChange(index, 'link', e.target.value)}
                                                        placeholder="e.g., /products/my-product"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>CTA Text</Label>
                                                    <Input
                                                        value={slide.cta}
                                                        onChange={(e) => onHeroSlideChange(index, 'cta', e.target.value)}
                                                        placeholder="e.g., Shop Now"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={onAddHeroSlide} variant="outline" className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Hero Slide
                            </Button>
                        </div>

                        {/* Deals of the Day Management */}
                        <div>
                            <h3 className="font-semibold mb-4 text-lg">"Deal of the Day" Products</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {products.map((product) => (
                                    <div key={`deal-${product.id}`} className="flex items-center gap-3 rounded-md border p-2">
                                        <Checkbox
                                            id={`deal-${product.id}`}
                                            checked={selectedDealIds.includes(product.id)}
                                            onCheckedChange={() => onDealSelection(product.id)}
                                        />
                                        <Label htmlFor={`deal-${product.id}`} className="flex-1 cursor-pointer text-sm">
                                            {product.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={onSaveChanges} disabled={isLoading || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save All Changes
                </Button>
            </CardFooter>
        </Card>
    );
}
