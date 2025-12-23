
'use client';

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { IndianRupee, ShoppingCart, Users, Package, Activity, ArrowUp, ArrowDown, BarChart3, PieChart as PieChartIcon, Loader2, TrendingUp, Clock } from 'lucide-react';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import { Area, AreaChart, Bar, BarChart, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell, Label, ResponsiveContainer, Sector } from 'recharts';
import { useCollection, useFirestore, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, where, collectionGroup } from 'firebase/firestore';
import type { Product, Order, UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';


export type ModalType = 'sales' | 'orders' | 'customers' | 'products' | 'income' | 'expenses' | 'visitors';


const chartConfig = {
  value: { label: 'Value' },
  income: { label: 'Income', color: 'hsl(var(--chart-1))' },
  today: { label: 'Today', color: 'hsl(var(--chart-1))' },
  lastWeek: { label: 'Last Week', color: 'hsl(var(--chart-2))' },
  lastMonth: { label: 'Last Month', color: 'hsl(var(--destructive))' },
  visitors: { label: 'Visitors', color: 'hsl(var(--chart-1))' },
};

export function KpiCard({
    type,
    title,
    value,
    icon: Icon,
    change,
    changeType,
    className
  }: {
    type: ModalType;
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    change?: string;
    changeType?: 'increase' | 'decrease';
    className?: string;
  }) {
    const iconColor =
      changeType === 'increase'
        ? 'text-green-600 bg-green-100'
        : changeType === 'decrease'
        ? 'text-red-600 bg-red-100'
        : 'text-blue-600 bg-blue-100';
  
    return (
      <Card
        className={cn(
          "cursor-pointer hover:border-primary transition-colors h-full",
          className,
        )}
        data-modal-type={type}
      >
        <CardHeader className="pl-0 pr-3 py-3 sm:p-5">
          <div className="flex items-center justify-between w-full">
            
            {/* LEFT TEXT BLOCK */}
            <div className="flex flex-col space-y-1">
              {/* TITLE → Make bold */}
              <CardTitle className="text-sm font-semibold text-muted-foreground leading-tight">
                {title}
              </CardTitle>
  
              {/* VALUE → Bigger + Bold */}
              <div className="text-lg sm:text-2xl font-extrabold leading-tight whitespace-nowrap">
                {value}
              </div>
            </div>
  
            {/* ICON */}
            <div className={`p-1.5 sm:p-2 rounded-md ${iconColor}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardHeader>
  
        {change && (
          <CardContent className="pt-1">
            <div className="text-xs text-muted-foreground flex items-center">
              {changeType === 'increase' ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span>{change} from last month</span>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
  
  

function ProductListModalContent() {
    const firestore = useFirestore();
    const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
    const { data: products, isLoading } = useCollection<Product>(productsCollection, { listen: false });

    const productsWithStock = products?.map(p => ({
        ...p,
        stock: Math.floor(Math.random() * 200) // Mock stock
    }));

    return (
        <DialogContent className="sm:max-w-4xl" data-modal-content="products">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Package/> Product List</DialogTitle>
                <DialogDescription>Complete list of available products in your inventory.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock Status</TableHead>
                            <TableHead>SKU/ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : productsWithStock && productsWithStock.length > 0 ? (
                            productsWithStock.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={product.image.url as string}
                                                alt={product.name}
                                                width={40}
                                                height={40}
                                                className="rounded-md object-cover"
                                            />
                                            <span>{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell><span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>
                                        {product.stock > 0 ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                In Stock ({product.stock})
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">Out of Stock</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">#{product.id.substring(0, 12)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
    )
}

type EnrichedOrder = Order & {
    id: string;
    customerName: string;
    customerEmail: string;
};

type CustomerData = {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
}

function OrderListModalContent() {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(
      () => query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(50)),
      [firestore]
    );
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const enrichedOrders: EnrichedOrder[] = (orders || []).map(order => ({
      ...order,
      customerName: order.shippingInfo?.name || 'Unknown User',
      customerEmail: order.shippingInfo?.email || 'No Email',
    }));

    return (
        <DialogContent className="sm:max-w-4xl" data-modal-content="orders">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ShoppingCart/> Recent Orders</DialogTitle>
                <DialogDescription>A list of the most recent orders from your store.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
                 <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : enrichedOrders && enrichedOrders.length > 0 ? (
                            enrichedOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-xs">#{order.orderNumber || order.id.substring(0, 7)}</TableCell>
                                    <TableCell>
                                         <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{order.customerName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{order.customerName}</div>
                                                <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.createdAt && typeof order.createdAt !== 'string' ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium"><span className="font-currency">₹</span>{formatPrice(order.totalAmount)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
    );
}

function CustomerListModalContent() {
    const firestore = useFirestore();
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
    
    const ordersQuery = useMemoFirebase(() => collectionGroup(firestore, 'orders'), [firestore]);
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);


    useEffect(() => {
        if (usersLoading || ordersLoading) {
            setIsLoading(true);
            return;
        }

        if (!users || !orders) {
            setIsLoading(false);
            return;
        }

        const usersMap = new Map<string, UserProfile>();
        users.forEach(user => {
            usersMap.set(user.id, user);
        });

        const customerDataMap = new Map<string, CustomerData>();

        orders.forEach(order => {
            if (!order.userId || !usersMap.has(order.userId)) return;

            const userProfile = usersMap.get(order.userId)!;
            let customer = customerDataMap.get(order.userId);

            const orderDate = order.createdAt ? (typeof order.createdAt === 'string' ? order.createdAt : order.createdAt.toDate().toISOString()) : new Date(0).toISOString();

            if (!customer) {
                customer = {
                    id: order.userId,
                    name: userProfile.displayName,
                    email: userProfile.email,
                    photoURL: userProfile.photoURL,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: '1970-01-01T00:00:00.000Z',
                };
            }

            customer.totalOrders += 1;
            customer.totalSpent += order.totalAmount;
            
            if (new Date(orderDate) > new Date(customer.lastOrderDate)) {
                customer.lastOrderDate = orderDate;
            }
            
            customerDataMap.set(order.userId, customer);
        });
        
        const aggregatedCustomers = Array.from(customerDataMap.values())
                                        .sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());

        setCustomers(aggregatedCustomers);
        setIsLoading(false);
    }, [users, orders, usersLoading, ordersLoading]);

    return (
        <DialogContent className="sm:max-w-4xl" data-modal-content="customers">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Users /> Customer Details</DialogTitle>
                <DialogDescription>Details of customers who have placed orders.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
                 <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total Orders</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Last Order</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : customers && customers.length > 0 ? (
                            customers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                {customer.photoURL && <AvatarImage src={customer.photoURL} alt={customer.name} />}
                                                <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-sm text-muted-foreground">{customer.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{customer.totalOrders}</TableCell>
                                    <TableCell className="font-medium"><span className="font-currency">₹</span>{formatPrice(customer.totalSpent)}</TableCell>
                                    <TableCell>{new Date(customer.lastOrderDate).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No customers found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </div>
        </DialogContent>
    );
}

function IncomeModalContent() {
    const firestore = useFirestore();
    const ordersQuery = useMemoFirebase(() => query(collectionGroup(firestore, 'orders'), where('status', '==', 'delivered')), [firestore]);
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery, { listen: false });

    const incomeData = useMemo(() => {
        if (!orders) return null;

        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const yesterday = new Date(new Date().setDate(today.getDate() - 1));
        const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 6));
        const fourteenDaysAgo = new Date(new Date().setDate(today.getDate() - 13));
        const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 29));
        const sixtyDaysAgo = new Date(new Date().setDate(today.getDate() - 59));
        
        let todayIncome = 0;
        let yesterdayIncome = 0;
        let last7DaysIncome = 0;
        let prev7DaysIncome = 0;
        let last30DaysIncome = 0;
        let prev30DaysIncome = 0;

        const dailyIncome: { [key: string]: number } = {};

        orders.forEach(order => {
            if (!order.createdAt || typeof order.createdAt === 'string') return;
            const orderDate = order.createdAt.toDate();
            const orderDateStr = orderDate.toISOString().split('T')[0];

            if (orderDate >= today) {
                todayIncome += order.totalAmount;
            }
            if (orderDate.toDateString() === yesterday.toDateString()) {
                yesterdayIncome += order.totalAmount;
            }
            if (orderDate >= sevenDaysAgo) {
                last7DaysIncome += order.totalAmount;
            }
            if (orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo) {
                prev7DaysIncome += order.totalAmount;
            }
            if (orderDate >= thirtyDaysAgo) {
                last30DaysIncome += order.totalAmount;
                dailyIncome[orderDateStr] = (dailyIncome[orderDateStr] || 0) + order.totalAmount;
            }
            if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
                prev30DaysIncome += order.totalAmount;
            }
        });
        
        const getChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const chartData = Object.entries(dailyIncome)
            .map(([date, income]) => ({ date, income }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            today: { value: todayIncome, change: getChange(todayIncome, yesterdayIncome) },
            last7Days: { value: last7DaysIncome, change: getChange(last7DaysIncome, prev7DaysIncome) },
            last30Days: { value: last30DaysIncome, change: getChange(last30DaysIncome, prev30DaysIncome) },
            chartData
        };

    }, [orders]);
    
    if (isLoading) {
        return (
             <DialogContent className="sm:max-w-xl flex items-center justify-center h-96" data-modal-content="income-loading">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><TrendingUp/> Income Overview</DialogTitle>
                </DialogHeader>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </DialogContent>
        );
    }

    if (!incomeData) return null;

    const renderChange = (change: number) => {
        if (change === 0) return <span className="text-muted-foreground">(0%)</span>;
        const isIncrease = change > 0;
        return (
            <span className={`flex items-center text-xs font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {isIncrease ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    return (
        <DialogContent className="sm:max-w-2xl" data-modal-content="income">
             <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl"><TrendingUp/> Income Overview</DialogTitle>
                <DialogDescription>Performance metrics based on delivered orders.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Today</CardDescription>
                        <CardTitle className="text-2xl font-bold"><span className="font-currency">₹</span>{formatPrice(incomeData.today.value)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {renderChange(incomeData.today.change)} vs yesterday
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Last 7 Days</CardDescription>
                        <CardTitle className="text-2xl font-bold"><span className="font-currency">₹</span>{formatPrice(incomeData.last7Days.value)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                             {renderChange(incomeData.last7Days.change)} vs previous week
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Last 30 Days</CardDescription>
                        <CardTitle className="text-2xl font-bold"><span className="font-currency">₹</span>{formatPrice(incomeData.last30Days.value)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {renderChange(incomeData.last30Days.change)} vs previous month
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <h3 className="text-lg font-semibold mb-2">Last 30 Days Income Trend</h3>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={incomeData.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                         />
                         <YAxis 
                            tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                            tickLine={false}
                            axisLine={false}
                         />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                            content={<ChartTooltipContent 
                                formatter={(value) => `₹${formatPrice(Number(value))}`}
                                indicator="dot"
                            />}
                        />
                        <Bar 
                            dataKey="income" 
                            fill="hsl(var(--chart-1))" 
                            radius={4}
                            animationDuration={500}
                         />
                    </BarChart>
                </ChartContainer>
            </div>
        </DialogContent>
    );
}

function VisitorInsightsModalContent() {
    // Since we don't have a real analytics backend, we'll generate mock data.
    const visitorData = useMemo(() => {
        const today = new Date();
        const dailyVisitors: { date: string; visitors: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dailyVisitors.push({
                date: date.toISOString().split('T')[0],
                visitors: Math.floor(Math.random() * (350 - 50 + 1) + 50) + i * 5,
            });
        }

        const todayVisitors = dailyVisitors[dailyVisitors.length - 1].visitors;
        const yesterdayVisitors = dailyVisitors[dailyVisitors.length - 2].visitors;
        
        const last7DaysVisitors = dailyVisitors.slice(-7).reduce((acc, day) => acc + day.visitors, 0);
        const prev7DaysVisitors = dailyVisitors.slice(-14, -7).reduce((acc, day) => acc + day.visitors, 0);

        const last30DaysVisitors = dailyVisitors.reduce((acc, day) => acc + day.visitors, 0);
        
        const getChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const mostVisitedPages = [
            { path: '/', visits: 12050 },
            { path: '/products', visits: 9870 },
            { path: '/products/talbina-dry-fruits', visits: 7654 },
            { path: '/about', visits: 4321 },
            { path: '/contact', visits: 2109 },
        ];

        return {
            today: { value: todayVisitors, change: getChange(todayVisitors, yesterdayVisitors) },
            last7Days: { value: last7DaysVisitors, change: getChange(last7DaysVisitors, prev7DaysVisitors) },
            last30Days: { value: last30DaysVisitors },
            avgSessionDuration: "3m 45s",
            chartData: dailyVisitors,
            topPages: mostVisitedPages,
        };
    }, []);

    const renderChange = (change: number) => {
        if (change === 0) return <span className="text-muted-foreground">(0%)</span>;
        const isIncrease = change > 0;
        return (
            <span className={`flex items-center text-xs font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {isIncrease ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    return (
        <DialogContent className="sm:max-w-3xl" data-modal-content="visitors">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl"><Users /> Visitor Insights</DialogTitle>
                <DialogDescription>An overview of your website traffic and user engagement.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Today</CardDescription>
                        <CardTitle className="text-2xl font-bold">{visitorData.today.value.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {renderChange(visitorData.today.change)} vs yesterday
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Last 7 Days</CardDescription>
                        <CardTitle className="text-2xl font-bold">{visitorData.last7Days.value.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                             {renderChange(visitorData.last7Days.change)} vs previous week
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Last 30 Days</CardDescription>
                        <CardTitle className="text-2xl font-bold">{visitorData.last30Days.value.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Session</CardDescription>
                        <CardTitle className="text-2xl font-bold flex items-center gap-1">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            {visitorData.avgSessionDuration}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                     <CardHeader>
                        <CardTitle>Visitor Trend (Last 30 Days)</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <AreaChart data={visitorData.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="chart-gradient-visitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={<ChartTooltipContent 
                                        formatter={(value, name) => `${Number(value).toLocaleString()} ${name}`}
                                        indicator="dot"
                                    />}
                                />
                                <Area
                                    dataKey="visitors"
                                    type="natural"
                                    fill="url(#chart-gradient-visitors)"
                                    stroke="hsl(var(--chart-1))"
                                    stackId="a"
                                />
                            </AreaChart>
                        </ChartContainer>
                     </CardContent>
                </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>Most Visited Pages</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <Table>
                            <TableBody>
                                {visitorData.topPages.map((page, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="font-medium">{page.path}</div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{page.visits.toLocaleString()} visits</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </CardContent>
                </Card>
            </div>
        </DialogContent>
    );
}

function SalesModalContent() {
    return (
        <DialogContent className="sm:max-w-2xl" data-modal-content="sales">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><IndianRupee/> Total Sales Details</DialogTitle>
                <DialogDescription>A breakdown of sales performance over different periods.</DialogDescription>
            </DialogHeader>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ComposedChart data={[
                    { period: 'Today', value: 5230 },
                    { period: 'Last Week', value: 45210 },
                    { period: 'Last Month', value: 189340 },
                ]}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                    <Tooltip 
                        content={<ChartTooltipContent formatter={(value) => `₹${formatPrice(Number(value))}`} />} 
                    />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} />
                </ComposedChart>
            </ChartContainer>
        </DialogContent>
    );
}

const renderModalContent = (type: ModalType | null) => {
    switch(type) {
        case 'sales':
            return <SalesModalContent />;
        case 'orders':
            return <OrderListModalContent />;
        case 'customers':
            return <CustomerListModalContent />;
        case 'products':
            return <ProductListModalContent />;
        case 'income':
            return <IncomeModalContent />;
        case 'visitors':
            return <VisitorInsightsModalContent />;
        default:
            return null;
    }
}

export function KpiModals({ activeModal }: { activeModal: ModalType | null }) {
    return renderModalContent(activeModal);
}
