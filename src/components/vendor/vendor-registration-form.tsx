'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { createVendorApplication, hasPendingVendorApplication } from '@/firebase/vendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin } from 'lucide-react';
import type { VendorLocation } from '@/lib/types';

interface VendorRegistrationFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function VendorRegistrationForm({ onSuccess, onCancel }: VendorRegistrationFormProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState<'Retailer' | 'Wholesaler' | 'Distributor' | 'Other'>('Retailer');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [locationType, setLocationType] = useState<'manual' | 'geolocation'>('manual');
    const [address, setAddress] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({
                title: 'Error',
                description: 'Geolocation is not supported by your browser',
                variant: 'destructive',
            });
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationType('geolocation');
                setAddress(`Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`);
                setGettingLocation(false);
                toast({
                    title: 'Location Captured',
                    description: 'Your location has been captured successfully',
                });
            },
            (error) => {
                setGettingLocation(false);
                toast({
                    title: 'Error',
                    description: 'Failed to get your location. Please enter manually.',
                    variant: 'destructive',
                });
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to apply',
                variant: 'destructive',
            });
            return;
        }

        // Validation
        if (!businessName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            // Check for pending application
            const hasPending = await hasPendingVendorApplication(firestore, user.uid);
            if (hasPending) {
                toast({
                    title: 'Application Pending',
                    description: 'You already have a pending vendor application. Please wait for admin review.',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            // Parse location
            let location: VendorLocation;
            if (locationType === 'geolocation' && address.includes('Lat:')) {
                const [latPart, lngPart] = address.split(', ');
                const lat = parseFloat(latPart.split(': ')[1]);
                const lng = parseFloat(lngPart.split(': ')[1]);
                location = {
                    type: 'geolocation',
                    coordinates: { lat, lng },
                };
            } else {
                location = {
                    type: 'manual',
                    address: address.trim(),
                };
            }

            // Create application
            console.log('Creating vendor application for user:', user.uid);
            console.log('Firestore instance:', firestore);

            await createVendorApplication(
                firestore,
                user.uid,
                businessName.trim(),
                businessType,
                phone.trim(),
                email.trim(),
                location
            );

            toast({
                title: 'Application Submitted',
                description: 'Your vendor application has been submitted. Admin will review and contact you.',
            });

            onSuccess?.();
        } catch (error: any) {
            console.error('Error submitting vendor application:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = 'Failed to submit application. Please try again.';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please make sure you are logged in and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Register as Vendor</CardTitle>
                <CardDescription>
                    Fill out the form below to apply for vendor status. Admin will review your application and contact you.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                            id="businessName"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Enter your business name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="businessType">Business Type *</Label>
                        <Select value={businessType} onValueChange={(value: any) => setBusinessType(value)}>
                            <SelectTrigger id="businessType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Retailer">Retailer</SelectItem>
                                <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                                <SelectItem value="Distributor">Distributor</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <div className="flex gap-2">
                            <Input
                                id="location"
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    setLocationType('manual');
                                }}
                                placeholder="Enter your address or use location button"
                                required
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleGetLocation}
                                disabled={gettingLocation}
                            >
                                {gettingLocation ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MapPin className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            You can enter an address manually or click the location icon to use your current location
                        </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
