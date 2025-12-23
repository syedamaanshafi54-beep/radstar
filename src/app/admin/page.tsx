'use client';
import { onSnapshot } from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, WithId, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Product, Order } from '@/lib/types';
import { collection, doc, setDoc, query, orderBy, limit, getDocs, where, deleteDoc, writeBatch, collectionGroup } from 'firebase/firestore';
import { Loader2, Package, Sparkles, Users, IndianRupee, ShoppingCart, PlusCircle, ArrowUp, Activity, ArrowDown, BarChart, FileText, Heart, ChevronDown, ArrowUpDown, Edit, Trash2, Eye, MoreVertical, Star, TrendingUp, TrendingDown, CircleDollarSign, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useState, useEffect, useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid, Legend, ComposedChart, Bar, Line, YAxis, Defs, Stop, LinearGradient } from "recharts";
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { AiReviewAnalysis } from '@/components/admin/ai-review-analysis';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProductDetails from '@/components/product-details';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { KpiCard, KpiModals, ModalType } from '@/components/admin/kpi-modals';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';


type DealsData = {
  productIds: string[];
}

type HeroSlide = {
  id: string;
  imageUrl: string;
  imageHint: string;
  headline: string;
  tagline: string;
  cta: string;
  link: string;
  slug?: string;
};
type HeroSlidesData = {
  slides: HeroSlide[];
};


type EnrichedOrder = Order & {
    id: string;
    customerName?: string;
};

type SortConfig = {
  key: keyof Product | 'sales' | 'revenue';
  direction: 'ascending' | 'descending';
};

const chartData = [
    { month: "Jan", orders: 12, sales: 18600, income: 12000, visitors: 1200 },
    { month: "Feb", orders: 35, sales: 30500, income: 22000, expenses: 10000, visitors: 2800 },
    { month: "Mar", orders: 22, sales: 23700, income: 15000, expenses: 9500, visitors: 1800 },
    { month: "Apr", orders: 41, sales: 27300, income: 20000, expenses: 11000, visitors: 3200 },
    { month: "May", orders: 52, sales: 40900, income: 28000, expenses: 12000, visitors: 4100 },
    { month: "Jun", orders: 60, sales: 41400, income: 30000, expenses: 13000, visitors: 4500 },
    { month: "Jul", orders: 55, sales: 58400, income: 40000, expenses: 15000, visitors: 5100 },
    { month: "Aug", orders: 78, sales: 61200, income: 45000, expenses: 16000, visitors: 6200 },
    { month: "Sep", orders: 65, sales: 71500, income: 50000, expenses: 18000, visitors: 5800 },
    { month: "Oct", orders: 89, sales: 85300, income: 60000, expenses: 20000, visitors: 7100 },
    { month: "Nov", orders: 95, sales: 92100, income: 65000, expenses: 22000, visitors: 7500 },
    { month: "Dec", orders: 112, sales: 125430, income: 85000, expenses: 25000, visitors: 8200 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--destructive))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  }
} satisfies import("@/components/ui/chart").ChartConfig;

const reviewData = {
  average: 4.6,
  total: 2139,
  distribution: [
    { star: 5, percentage: 75 },
    { star: 4, percentage: 12 },
    { star: 3, percentage: 5 },
    { star: 2, percentage: 3 },
    { star: 1, percentage: 5 },
  ]
}

function CustomerReviews() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Reviews</CardTitle>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-4xl font-bold">{reviewData.average.toFixed(1)}</p>
          <div className="flex flex-col">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor(reviewData.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">({reviewData.average.toFixed(1)} out of 5)</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{reviewData.total.toLocaleString()} Reviews</p>

        <div className="space-y-2">
          {reviewData.distribution.map(item => (
            <div key={item.star} className="flex items-center gap-4 text-sm">
              <span className="w-12 text-muted-foreground">{item.star} Star</span>
              <Progress value={item.percentage} className="h-2 flex-1" />
              <span className="w-8 text-right font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: firestoreProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection, { listen: false });
  
  const ordersCollectionGroup = useMemoFirebase(() => collectionGroup(firestore, 'orders'), [firestore]);
  const { data: allOrders, isLoading: allOrdersLoading } = useCollection<Order>(ordersCollectionGroup, { listen: false });

  const dealsDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'dealsOfTheDay'), [firestore]);
  const { data: dealsData, isLoading: dealInfoLoading } = useDoc<DealsData>(dealsDocRef);

  const heroSlidesDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'heroSlides'), [firestore]);
  const { data: heroSlidesData, isLoading: heroSlidesLoading } = useDoc<HeroSlidesData>(heroSlidesDocRef);
  
  const [recentOrders, setRecentOrders] = useState<EnrichedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  
  const products = firestoreProducts || [];

  // Add mock sales/revenue data for sorting
  const productsWithSales = useMemo(() => {
    return products.map((p, index) => ({
      ...p,
      stock: Math.floor(Math.random() * 200),
      dateAdded: new Date(2024, 0, index + 1).toISOString(), // Mock date
      sales: Math.floor(Math.random() * (200 - index * 5) + 50),
      revenue: Math.floor(Math.random() * (200 - index * 5) + 50) * p.defaultPrice * 0.7,
    }));
  }, [products]);


  const sortedProducts = useMemo(() => {
    let sortableItems = [...productsWithSales];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [productsWithSales, sortConfig]);

  const topSellingProducts = useMemo(() => {
    return [...productsWithSales].sort((a, b) => b.sales - a.sales).slice(0, 5);
  }, [productsWithSales]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (product: WithId<Product>) => {
    const productRef = doc(firestore, 'products', product.id);
    deleteDocumentNonBlocking(productRef);
    toast({
      title: 'Product Deleted',
      description: `${product.name} has been successfully deleted.`,
    });
  };

  useEffect(() => {
    if (dealsData) {
      setSelectedDealIds(dealsData.productIds || []);
    }
    if (heroSlidesData) {
      setHeroSlides(heroSlidesData.slides || []);
    }
  }, [dealsData, heroSlidesData]);
  
  useEffect(() => {
    if (!firestore) return;
  
    setOrdersLoading(true);
  
    const ordersRef = collection(firestore, 'orders');
  
    const q = query(
      ordersRef,
      orderBy('orderDate', 'desc'), // TEMP (see step 3)
      limit(5)
    );
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => {
          const data = doc.data() as EnrichedOrder;
          return {
            id: doc.id,
            ...data,
            customerName: data.shippingInfo?.name || 'Unknown',
          };
        });
  
        setRecentOrders(orders);
        setOrdersLoading(false);
      },
      (error) => {
        console.error('Realtime orders error:', error);
        setOrdersLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, [firestore]);
  


  const handleDealSelection = (productId: string) => {
    setSelectedDealIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };
  
  const handleHeroSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
    const newSlides = [...heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setHeroSlides(newSlides);
  };

  const handleHeroImageUpload = async (index: number, file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const storage = getStorage();
      const imageRef = storageRef(storage, `hero-slides/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);
      handleHeroSlideChange(index, 'imageUrl', imageUrl);
    } catch (error) {
      console.error("Error uploading hero image:", error);
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description: "Could not upload the new hero image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addHeroSlide = () => {
    setHeroSlides([...heroSlides, {
      id: `slide-${Date.now()}`,
      imageUrl: '',
      imageHint: '',
      headline: '',
      tagline: '',
      cta: '',
      link: ''
    }]);
  };

  const removeHeroSlide = (index: number) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== index));
  };


  const handleSaveChanges = () => {
    if (selectedDealIds) {
        setDocumentNonBlocking(dealsDocRef, { productIds: selectedDealIds }, { merge: true });
    }
    if (heroSlides) {
        setDocumentNonBlocking(heroSlidesDocRef, { slides: heroSlides }, { merge: true });
    }
    toast({
        title: 'Site Configuration Updated',
        description: 'Your changes to hero slides and deals have been saved.',
    });
  }

  const isLoading = productsLoading || dealInfoLoading || allOrdersLoading || heroSlidesLoading;

  const { totalRevenue, totalOrders, totalCustomers } = useMemo(() => {
    if (!allOrders) return { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 };
    const revenue = allOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    const customerIds = new Set(allOrders.map(o => o.userId));
    return { totalRevenue: revenue, totalOrders: allOrders.length, totalCustomers: customerIds.size };
  }, [allOrders]);
  
  const totalProducts = products.length;
  
  const { totalIncome, totalVisitors, monthlyChartData } = useMemo(() => {
    if (!allOrders) {
      return { totalIncome: 0, totalVisitors: 0, monthlyChartData: chartData };
    }
    let monthlyData = new Array(12).fill(0).map((_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      sales: 0,
      orders: 0,
      income: 0,
      visitors: 0,
    }));

    allOrders.forEach(order => {
      if (order.createdAt && typeof order.createdAt !== 'string' && order.createdAt.seconds) {
        const monthIndex = new Date(order.createdAt.seconds * 1000).getMonth();
        if (monthlyData[monthIndex]) {
          monthlyData[monthIndex].sales += order.totalAmount;
          monthlyData[monthIndex].orders += 1;
        }
      }
    });

    let cumulativeVisitors = 0;
    monthlyData = monthlyData.map((data, index) => {
        const income = data.sales * 0.7; // 70% profit margin
        const visitors = data.orders * (Math.floor(Math.random() * 6) + 5); // 5-10 visitors per order
        cumulativeVisitors += visitors;
        return {
            ...data,
            income: Math.round(income),
            visitors
        };
    });

    const totalIncome = monthlyData.reduce((acc, data) => acc + data.income, 0);
    
    return { totalIncome, totalVisitors: cumulativeVisitors, monthlyChartData: monthlyData };

  }, [allOrders]);

  const [activeMobileTab, setActiveMobileTab] = useState<'recent' | 'topSelling' | 'reviews'>('recent');
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);

  const mobileTabs: { key: 'recent' | 'topSelling' | 'reviews'; label: string }[] = [
    { key: 'recent', label: 'Recent Orders' },
    { key: 'topSelling', label: 'Top Selling Products' },
    { key: 'reviews', label: 'Customer Reviews' },
  ];

  const handleMobileTabChange = (nextKey: 'recent' | 'topSelling' | 'reviews') => {
    const currentIndex = mobileTabs.findIndex((t) => t.key === activeMobileTab);
    const nextIndex = mobileTabs.findIndex((t) => t.key === nextKey);
    if (nextIndex > currentIndex) {
      setSwipeDirection(1);
    } else if (nextIndex < currentIndex) {
      setSwipeDirection(-1);
    }
    setActiveMobileTab(nextKey);
  };

  return (
    <div className="space-y-6 px-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rad Star Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
            <Link href="/admin" className="text-primary hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span>Dashboard</span>
          </div>
          <Button asChild className="hidden md:flex">
            <Link href="/admin/products/new">
              <PlusCircle />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>
      <Dialog open={!!activeModal} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <div onClick={() => setActiveModal('sales')} className="p-0">
            <KpiCard type="sales" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Sales" value={<><span className="font-currency">₹</span>{formatPrice(totalRevenue)}</>} icon={IndianRupee} change="+15.2%" changeType="increase" />
          </div>
          <div onClick={() => setActiveModal('orders')} className="p-0">
            <KpiCard type="orders" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} change="+18.7%" changeType="increase" />
          </div>
          <div onClick={() => setActiveModal('customers')} className="p-0">
            <KpiCard type="customers" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Customers" value={totalCustomers} icon={Users} change="+8.0%" changeType="increase" />
          </div>
          <div onClick={() => setActiveModal('products')} className="p-0">
            <KpiCard type="products" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Products" value={totalProducts} icon={Package} change=" "/>
          </div>
          <div onClick={() => setActiveModal('income')} className="p-0">
            <KpiCard type="income" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Income" value={<><span className="font-currency">₹</span>{formatPrice(totalIncome)}</>} icon={TrendingUp} change="+20.1%" changeType="increase" />
          </div>
          <div onClick={() => setActiveModal('visitors')} className="p-0">
            <KpiCard type="visitors" className="h-[140px] sm:h-auto p-3 sm:p-5 text-xs sm:text-base" title="Total Visitors" value={totalVisitors.toLocaleString()} icon={Users} change="+12.4%" changeType="increase" />
          </div>
        </div>
        <KpiModals activeModal={activeModal} />
      </Dialog>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Order vs Sales</CardTitle>
            </CardHeader>
            <CardContent className="px-1 sm:px-2">
  <ChartContainer
    config={chartConfig}
    className="relative h-[180px] sm:h-[300px] w-full overflow-hidden"
  >
    
      <ComposedChart
        data={monthlyChartData}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.1} />
          </linearGradient>
          <filter id="shadowSales" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="var(--color-sales)"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        <CartesianGrid vertical={false} strokeDasharray="3 3" />

        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />

        <YAxis
          yAxisId="sales"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={60}
          domain={[0, 'dataMax + 5000']}
          tickFormatter={(value) => `₹${Number(value) / 1000}k`}
        />

        <YAxis
          yAxisId="orders"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={60}
          domain={[0, 'dataMax + 50']}
        />

        <Tooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) =>
                name === 'sales'
                  ? `₹${Number(value).toLocaleString()}`
                  : value
              }
              cursor={false}
            />
          }
        />

        <Legend />

        <Bar
          dataKey="orders"
          yAxisId="orders"
          fill="url(#colorOrders)"
          radius={4}
          barSize={20}
        />

        <Line
          type="monotone"
          yAxisId="sales"
          dataKey="sales"
          stroke="var(--color-sales)"
          strokeWidth={2}
          dot={false}
          filter="url(#shadowSales)"
        />
      </ComposedChart>
    
  </ChartContainer>
</CardContent>

        </Card>
        
         <Card className="lg:col-span-2 hidden lg:block">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>All the orders from your store.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                    {ordersLoading ? (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                        </TableRow>
                    ) : recentOrders.length > 0 ? (
                       recentOrders.map(order => (
                         <TableRow key={order.id}>
                           <TableCell>
                             <div className="font-medium">{order.customerName}</div>
                             <div className="text-sm text-muted-foreground">{order.id.substring(0, 7)}...</div>
                           </TableCell>
                           <TableCell className="text-right font-medium"><span className="font-currency">₹</span>{formatPrice(order.totalAmount || 0)}</TableCell>
                         </TableRow>
                       ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={2} className="text-center">No recent orders.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      {/* Mobile-only tabs + swipe slider */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center rounded-full bg-muted p-1">
          {mobileTabs.map((tab) => {
            const isActive = tab.key === activeMobileTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleMobileTabChange(tab.key)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-full transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={swipeDirection}>
          <motion.div
  key={activeMobileTab}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2 }}
  className="w-full"
>

              {activeMobileTab === 'recent' && (
                <Card className="hidden sm:block">
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>All the orders from your store.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        {ordersLoading ? (
                          <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                          </TableRow>
                        ) : recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.id.substring(0, 7)}...
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span className="font-currency">₹</span>
                                {formatPrice(order.totalAmount || 0)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center">
                              No recent orders.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {activeMobileTab === 'topSelling' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="text-right">Total Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsLoading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            </TableCell>
                          </TableRow>
                        ) : (
                          topSellingProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                                    <Image
                                      src={product.image.url as string}
                                      alt={product.name}
                                      width={40}
                                      height={40}
                                      className="rounded-full object-contain p-1"
                                    />
                                  </div>
                                  <span className="font-medium">{product.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {product.stock > 20 ? (
                                  <span className="text-green-600 font-medium">
                                    In Stock ({product.stock})
                                  </span>
                                ) : product.stock > 0 ? (
                                  <span className="text-yellow-600 font-medium">
                                    Low Stock ({product.stock})
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-medium">Out of Stock</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {product.sales.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {activeMobileTab === 'reviews' && <CustomerReviews />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

       <div className="hidden lg:grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : topSellingProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                           <Image
                              src={product.image.url as string}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded-full object-contain p-1"
                          />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.stock > 20 ? (
                        <span className="text-green-600 font-medium">In Stock ({product.stock})</span>
                      ) : product.stock > 0 ? (
                        <span className="text-yellow-600 font-medium">Low Stock ({product.stock})</span>
                      ) : (
                        <span className="text-red-600 font-medium">Out of Stock</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">{product.sales.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <CustomerReviews />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Content Management</CardTitle>
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
                        onClick={() => removeHeroSlide(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Image</Label>
                          {slide.imageUrl && (
                            <Image
                              src={slide.imageUrl}
                              alt="Hero Slide"
                              width={150}
                              height={150}
                              className="rounded-md object-cover"
                            />
                          )}
                          <Input
                            type="file"
                            onChange={(e) => e.target.files && handleHeroImageUpload(index, e.target.files[0])}
                            disabled={isUploading}
                          />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                              value={slide.headline}
                              onChange={(e) => handleHeroSlideChange(index, 'headline', e.target.value)}
                              placeholder="Hero Headline"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tagline</Label>
                            <Input
                              value={slide.tagline}
                              onChange={(e) => handleHeroSlideChange(index, 'tagline', e.target.value)}
                              placeholder="Catchy Tagline"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CTA Button Text</Label>
                            <Input
                              value={slide.cta}
                              onChange={(e) => handleHeroSlideChange(index, 'cta', e.target.value)}
                              placeholder="e.g., Shop Now"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CTA Link</Label>
                            <Input
                              value={slide.link}
                              onChange={(e) => handleHeroSlideChange(index, 'link', e.target.value)}
                              placeholder="e.g., /products/my-product"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={addHeroSlide} variant="outline" className="mt-4">
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
                        onCheckedChange={() => handleDealSelection(product.id)}
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
            <Button onClick={handleSaveChanges} disabled={isLoading || isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Save Changes
            </Button>
        </CardFooter>
      </Card>

      {/* Mobile-only Products List */}
<div className="sm:hidden space-y-3">
  {sortedProducts.map((product) => (
    <Card key={product.id}>
      <CardContent className="flex items-center gap-3 p-3">
        <Image
          src={product.image.url as string}
          alt={product.name}
          width={40}
          height={40}
          className="rounded-md object-cover"
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{formatPrice(product.defaultPrice)}
          </p>
        </div>

        <Button
          asChild
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <Link href={`/admin/products/edit/${product.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  ))}
</div>



       <Card className="hidden sm:block">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Products Overview</CardTitle>
            <CardDescription>An overview of all products in your store.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('dateAdded')}>
                        Date Added <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                        Product Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Product ID</TableHead>
                <TableHead className="hidden sm:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('defaultPrice')}>
                        Price <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('sales')}>
                        Sales <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('revenue')}>
                        Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : sortedProducts.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{new Date(product.dateAdded).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={product.image.url as string}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">#{product.id.substring(0, 8)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                     <span className="font-currency">₹</span>{formatPrice(product.defaultPrice)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Available
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{product.sales.toLocaleString()}</TableCell>
                  <TableCell className="text-right hidden lg:table-cell"><span className="font-currency">₹</span>{formatPrice(product.revenue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                             <DialogContent className="max-w-4xl w-full p-0">
                                <DialogHeader className="sr-only">
                                  <DialogTitle>{product.name}</DialogTitle>
                                  <DialogDescription>Details for {product.name}</DialogDescription>
                                </DialogHeader>
                                <ProductDetails product={product} />
                            </DialogContent>
                        </Dialog>
                        <Button asChild variant="ghost" className="h-8 w-8 p-0 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                            <Link href={`/admin/products/edit/${product.id}`}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" className="h-8 w-8 p-0 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product as WithId<Product>)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Yes, delete product
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
                showing {products.length} Entries
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Prev</Button>
                <Button variant="outline" size="sm" className="bg-primary/10 text-primary">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    