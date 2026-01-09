'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { createVendorApplication, hasPendingVendorApplication } from '@/firebase/vendors';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [status, setStatus] = useState<'none' | 'pending' | 'approved'>('none');
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check application status on mount
    useEffect(() => {
        async function checkStatus() {
            if (!user) {
                setCheckingStatus(false);
                return;
            }

            try {
                // Check if already approved (check if vendor context says so, or from firestore)
                // For simplicity, let's just check firestore here
                const hasPending = await hasPendingVendorApplication(firestore, user.uid);
                if (hasPending) {
                    setStatus('pending');
                } else {
                    // Check if approved
                    const q = query(
                        collection(firestore, 'vendors'),
                        where('userId', '==', user.uid),
                        where('status', '==', 'approved')
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        setStatus('approved');
                    }
                }
            } catch (err) {
                console.error('Error checking vendor status:', err);
            } finally {
                setCheckingStatus(false);
            }
        }
        checkStatus();
    }, [user, firestore]);

    // Update email when user is available
    useEffect(() => {
        if (user?.email && !email) {
            setEmail(user.email);
        }
    }, [user, email]);

    const handleGetLocation = () => {
        console.log('Location button clicked. Initiating geolocation request...');
        if (!navigator.geolocation) {
            toast({
                title: 'Not Supported',
                description: 'Geolocation is not supported by your browser.',
                variant: 'destructive',
            });
            return;
        }

        setGettingLocation(true);

        const tryGetPosition = (highAccuracy: boolean) => {
            console.log(`Attempting geolocation (highAccuracy: ${highAccuracy})...`);

            const options = {
                enableHighAccuracy: highAccuracy,
                timeout: highAccuracy ? 8000 : 12000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocationType('geolocation');
                    setCoordinates({ lat, lng });
                    setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
                    setGettingLocation(false);
                    toast({
                        title: 'Location Captured',
                        description: `Successfully captured ${highAccuracy ? 'precise' : 'approximate'} coordinates.`,
                    });
                },
                (error) => {
                    console.warn(`Geolocation error (highAccuracy: ${highAccuracy}): Code ${error.code} - ${error.message}`);

                    // IF high accuracy failed, try once more with standard accuracy
                    if (highAccuracy && (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT)) {
                        console.log('High accuracy failed/unavailable, falling back to standard accuracy...');
                        tryGetPosition(false);
                        return;
                    }

                    setGettingLocation(false);
                    let errorMessage = 'Failed to get your location. Please enter manually.';

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location permission denied. Please enable it in browser settings.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location info is unavailable. Your device might not have a location sensor.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Location request timed out. Check your internet/GPS signal.";
                            break;
                    }

                    toast({
                        title: 'Location Error',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                },
                options
            );
        };

        tryGetPosition(true);
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

        if (!businessName.trim() || !phone.trim() || !email.trim() || !address.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (phone.length !== 10) {
            toast({
                title: 'Error',
                description: 'Phone number must be exactly 10 digits',
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
            if (locationType === 'geolocation' && coordinates) {
                location = {
                    type: 'geolocation',
                    coordinates: coordinates,
                    address: address.trim(), // Save the lat/lng string as address too
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

            setStatus('pending');
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

    if (checkingStatus) {
        return (
            <Card className="w-full max-w-2xl mx-auto p-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    if (status === 'approved') {
        return (
            <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50/50">
                <CardHeader>
                    <CardTitle className="text-green-700">Vendor Account Active</CardTitle>
                    <CardDescription>
                        You are already a registered vendor. You can see your special pricing across the store.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-green-600">
                        Visit your account page to see more details about your vendor status and discounts.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (status === 'pending') {
        return (
            <Card className="w-full max-w-2xl mx-auto border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                    <CardTitle className="text-yellow-700">Application Pending</CardTitle>
                    <CardDescription>
                        Your vendor application has been submitted and is currently being reviewed by our team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-yellow-600">
                        We will contact you via email or phone once your application has been processed.
                    </p>
                </CardContent>
            </Card>
        );
    }

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
                            <SelectTrigger id="businessType" className="w-full">
                                <SelectValue placeholder="Select business type" />
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
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 10) setPhone(value);
                            }}
                            placeholder="Enter 10-digit phone number"
                            maxLength={10}
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
