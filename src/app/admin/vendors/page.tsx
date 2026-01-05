'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PendingVendors } from '../../../components/admin/vendor-management/pending-vendors';
import { ActiveVendors } from '../../../components/admin/vendor-management/active-vendors';
import { RejectedVendors } from '../../../components/admin/vendor-management/rejected-vendors';
import { DebugAuth } from '@/components/debug-auth';

export default function VendorsPage() {
    const [activeTab, setActiveTab] = useState('pending');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Store className="h-8 w-8" />
                    Vendor Management
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage vendor applications, approvals, and discount configurations
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Active
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Applications</CardTitle>
                            <CardDescription>
                                Review and approve vendor applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PendingVendors />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Vendors</CardTitle>
                            <CardDescription>
                                Manage approved vendors and their discounts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActiveVendors />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rejected Applications</CardTitle>
                            <CardDescription>
                                View rejected vendor applications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RejectedVendors />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
