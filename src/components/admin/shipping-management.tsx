
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type ShippingStrategy = 'flat' | 'pincode';

interface ShippingConfig {
    strategy: ShippingStrategy;
    flatRate: number;
    defaultPincodeRate: number;
    freeShippingThreshold: number; // 0 means disabled
    pincodeRates: Record<string, number>;
}

const DEFAULT_CONFIG: ShippingConfig = {
    strategy: 'flat',
    flatRate: 0,
    defaultPincodeRate: 50,
    freeShippingThreshold: 0,
    pincodeRates: {}
};

export function ShippingManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const shippingDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'shipping'), [firestore]);
    const { data: config, isLoading } = useDoc<ShippingConfig>(shippingDocRef);

    // Local state for editing
    const [localConfig, setLocalConfig] = useState<ShippingConfig>(DEFAULT_CONFIG);
    const [newPincode, setNewPincode] = useState('');
    const [newRate, setNewRate] = useState('');

    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(shippingDocRef, localConfig, { merge: true });
            toast({
                title: 'Settings Saved',
                description: 'Shipping configuration has been updated.',
            });
        } catch (error) {
            console.error('Error saving shipping config:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save settings.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const addPincodeRate = () => {
        if (!newPincode || !newRate) return;

        setLocalConfig(prev => ({
            ...prev,
            pincodeRates: {
                ...prev.pincodeRates,
                [newPincode]: parseFloat(newRate)
            }
        }));

        setNewPincode('');
        setNewRate('');
    };

    const removePincodeRate = (pincode: string) => {
        const newRates = { ...localConfig.pincodeRates };
        delete newRates[pincode];
        setLocalConfig(prev => ({
            ...prev,
            pincodeRates: newRates
        }));
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Shipping Configuration</CardTitle>
                <CardDescription>Manage shipping charges and calculation strategies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Global Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Calculation Strategy</Label>
                        <Select
                            value={localConfig.strategy}
                            onValueChange={(val: ShippingStrategy) => setLocalConfig(prev => ({ ...prev, strategy: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flat">Flat Rate (Simple)</SelectItem>
                                <SelectItem value="pincode">Pincode Based (Advanced)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            {localConfig.strategy === 'flat'
                                ? 'Charge a single flat rate for all orders.'
                                : 'Charge specific rates for defined pincodes, and a default rate for others.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Free Shipping Threshold (<span className="font-currency">₹</span>)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={localConfig.freeShippingThreshold}
                            onChange={(e) => setLocalConfig(prev => ({ ...prev, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                            placeholder="0 to disable"
                        />
                        <p className="text-xs text-muted-foreground">Orders above this amount get free shipping. Set to 0 to disable.</p>
                    </div>
                </div>

                {/* Strategy Specific Settings */}
                {localConfig.strategy === 'flat' ? (
                    <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                        <Label>Flat Rate Charge (<span className="font-currency">₹</span>)</Label>
                        <Input
                            type="number"
                            min="0"
                            value={localConfig.flatRate}
                            onChange={(e) => setLocalConfig(prev => ({ ...prev, flatRate: parseFloat(e.target.value) || 0 }))}
                            className="max-w-[200px]"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                            <Label>Default Rate (<span className="font-currency">₹</span>)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={localConfig.defaultPincodeRate}
                                onChange={(e) => setLocalConfig(prev => ({ ...prev, defaultPincodeRate: parseFloat(e.target.value) || 0 }))}
                                className="max-w-[200px]"
                            />
                            <p className="text-xs text-muted-foreground">Applied when a customer's pincode is not listed below.</p>
                        </div>

                        <div className="space-y-4">
                            <Label>Pincode Specific Rates</Label>

                            <div className="flex gap-2 items-end">
                                <div className="space-y-1">
                                    <Label className="text-xs">Pincode</Label>
                                    <Input
                                        value={newPincode}
                                        onChange={(e) => setNewPincode(e.target.value)}
                                        placeholder="e.g. 500001"
                                        className="w-32"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Rate (<span className="font-currency">₹</span>)</Label>
                                    <Input
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value)}
                                        type="number"
                                        placeholder="50"
                                        className="w-24"
                                    />
                                </div>
                                <Button onClick={addPincodeRate} size="icon" variant="secondary">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pincode</TableHead>
                                            <TableHead>Shipping Rate</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(localConfig.pincodeRates).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">No specific rates defined.</TableCell>
                                            </TableRow>
                                        ) : (
                                            Object.entries(localConfig.pincodeRates).map(([code, rate]) => (
                                                <TableRow key={code}>
                                                    <TableCell className="font-medium">{code}</TableCell>
                                                    <TableCell><span className="font-currency">₹</span>{rate}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removePincodeRate(code)}
                                                            className="h-8 w-8 text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardContent>
        </Card>
    );
}
