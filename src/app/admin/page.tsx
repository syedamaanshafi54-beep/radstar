'use client';
import { onSnapshot } from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { Product, Order } from '@/lib/types';
import { collection, doc, setDoc, query, orderBy, limit, getDocs, where, deleteDoc, writeBatch, collectionGroup } from 'firebase/firestore';
import {
  Loader2, Package, Sparkles, Users, IndianRupee, ShoppingCart, PlusCircle,
  ArrowUp, Activity, ArrowDown, BarChart, FileText, Heart, ChevronDown,
  ArrowUpDown, Edit, Trash2, Eye, MoreVertical, Star, TrendingUp, TrendingDown,
  CircleDollarSign, Upload, Save, RotateCcw, Image as ImageIcon
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Review } from '@/lib/types/reviews';
import { useState, useEffect, useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, CartesianGrid, Legend, ComposedChart, Bar, Line, YAxis } from "recharts";
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';
import { AiReviewAnalysis } from '@/components/admin/ai-review-analysis';
import { CldUploadWidget } from 'next-cloudinary';
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
import SiteContentManagement from '@/components/admin/site-content-management.tsx';
import { InventoryManagement } from '@/components/admin/inventory-management';


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

const staticHeroSlides: HeroSlide[] = [
  {
    id: 'hero-talbina',
    imageUrl: '/images/aslitalbina/r2.jpg',
    imageHint: 'talbina product lifestyle',
    headline: 'Asli Talbina',
    tagline: 'The Original Taste of Wellness',
    cta: 'Discover Talbina',
    link: '/#Asli-Talbina',
    slug: 'talbina-regular'
  },
  {
    id: 'hero-honey',
    imageUrl: "/images/aslitalbina/asli honey/AH.jpg",
    imageHint: 'honey product lifestyle',
    headline: 'Wild Natural Honey',
    tagline: 'Pure, Raw, and Unprocessed',
    cta: 'Explore Honey',
    link: "/#King's-Asli-Honey",
    slug: "kings-asli-honey"
  },
];


type EnrichedOrder = Order & {
  id: string;
  customerName?: string;
};

type SortConfig = {
  key: keyof Product | 'sales' | 'revenue' | 'dateAdded';
  direction: 'ascending' | 'descending';
};

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


function CustomerReviews({ reviews }: { reviews: Review[] }) {
  const { average, total, distribution } = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: [5, 4, 3, 2, 1].map(star => ({ star, percentage: 0, count: 0 }))
      };
    }

    const totalCount = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = Number((sum / totalCount).toFixed(1));

    const counts = reviews.reduce((acc: Record<number, number>, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: counts[star] || 0,
      percentage: Math.round(((counts[star] || 0) / totalCount) * 100)
    }));

    return { average: avg, total: totalCount, distribution };
  }, [reviews]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Reviews</CardTitle>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-4xl font-bold">{average.toFixed(1)}</p>
          <div className="flex flex-col">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor(average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">({average.toFixed(1)} out of 5)</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {distribution.map(item => (
            <div key={item.star} className="flex items-center gap-4 text-sm">
              <span className="w-12 text-muted-foreground">{item.star} Star</span>
              <Progress value={item.percentage} className="h-2 flex-1" />
              <span className="w-12 text-right font-medium text-xs text-muted-foreground">{item.count} revs</span>
              <span className="w-8 text-right font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-4">
          {reviews.slice(0, 10).map((review, i) => (
            <div key={review.id || i} className="border-t pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{review.userName}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic line-clamp-2">"{review.comment}"</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">No reviews yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const isAdminUser = user?.email === 'itsmeabdulk@gmail.com' || user?.email === 'radstar.in@gmail.com';

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore, isAdminUser]);
  const { data: firestoreProducts, isLoading: productsLoading } = useCollection<Product>(productsCollection, { listen: false });

  const ordersCollectionGroup = useMemoFirebase(() => {
    if (!isAdminUser) return null;
    return collectionGroup(firestore, 'orders');
  }, [firestore, isAdminUser]);
  const { data: allOrders, isLoading: allOrdersLoading } = useCollection<Order>(ordersCollectionGroup, { listen: false });

  const dealsDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'dealsOfTheDay'), [firestore, isAdminUser]);
  const { data: dealsData, isLoading: dealInfoLoading } = useDoc<DealsData>(dealsDocRef);

  const reviewsCollection = useMemoFirebase(() => collection(firestore, 'reviews'), [firestore, isAdminUser]);
  const { data: allReviews, isLoading: reviewsLoading } = useCollection<Review>(reviewsCollection, { listen: true });

  const heroSlidesDocRef = useMemoFirebase(() => doc(firestore, 'site-config', 'heroSlides'), [firestore, isAdminUser]);
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



  const requestSort = (key: SortConfig['key']) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (product: Product & { id: string }) => {
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
    if (!firestore || !isAdminUser) return;

    setOrdersLoading(true);

    const ordersRef = collectionGroup(firestore, 'orders');

    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => {
          const data = doc.data() as EnrichedOrder;
          return {
            ...data,
            id: doc.id,
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
  }, [firestore, isAdminUser]);



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

  const handleHeroImageUpload = async (index: number, result: any) => {
    if (result.event === 'success') {
      handleHeroSlideChange(index, 'imageUrl', result.info.secure_url);
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

  const restoreHeroDefaults = () => {
    setHeroSlides(staticHeroSlides);
    toast({
      title: 'Restored to Defaults',
      description: 'The original Rad Star branded slides have been loaded into the editor. Click "Save Changes" to apply.',
    });
  };


  const handleSaveChanges = () => {
    if (dealsData) {
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

  const isLoading = productsLoading || dealInfoLoading || allOrdersLoading || heroSlidesLoading || isUserLoading;

  // Comprehensive Metric Calculations
  const stats = useMemo(() => {
    const defaultData = {
      totalRevenue: 0, revenueChange: 0,
      totalOrders: 0, ordersChange: 0,
      totalCustomers: 0, customersChange: 0,
      totalIncome: 0, incomeChange: 0,
      totalVisitors: 0, visitorsChange: 0,
      monthlyChartData: new Array(12).fill(0).map((_, i) => ({
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        sales: 0, orders: 0, income: 0, visitors: 0,
      }))
    };

    if (!allOrders || allOrders.length === 0) return defaultData;

    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let revenueCurrent = 0, revenuePrev = 0;
    let ordersCurrent = 0, ordersPrev = 0;
    let customersSet = new Set(), customersSetPrev = new Set();
    let incomeCurrent = 0, incomePrev = 0;

    allOrders.forEach(order => {
      if (!order.createdAt || typeof order.createdAt === 'string' || !order.createdAt.seconds) return;

      const d = new Date(order.createdAt.seconds * 1000);
      const m = d.getMonth();
      const y = d.getFullYear();
      const isSuccessful = order.status !== 'cancelled' && order.status !== 'pending_payment';

      // Statistics
      if (isSuccessful) {
        defaultData.monthlyChartData[m].sales += order.totalAmount;
        defaultData.monthlyChartData[m].income += order.totalAmount; // Using 100% of revenue for income
        defaultData.monthlyChartData[m].orders += 1;
        defaultData.monthlyChartData[m].visitors += 2; // Simulated

        if (y === thisYear && m === thisMonth) {
          revenueCurrent += order.totalAmount;
          ordersCurrent += 1;
          incomeCurrent += order.totalAmount;
        } else if (y === lastMonthYear && m === lastMonth) {
          revenuePrev += order.totalAmount;
          ordersPrev += 1;
          incomePrev += order.totalAmount;
        }
      }

      if (y === thisYear && m === thisMonth) {
        customersSet.add(order.userId);
      } else if (y === lastMonthYear && m === lastMonth) {
        customersSetPrev.add(order.userId);
      }
    });

    const getPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const totalRevenue = allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const totalCustomers = new Set(allOrders.map(o => o.userId)).size;

    return {
      totalRevenue,
      revenueChange: getPct(revenueCurrent, revenuePrev),
      totalOrders: allOrders.length,
      ordersChange: getPct(ordersCurrent, ordersPrev),
      totalCustomers,
      customersChange: getPct(customersSet.size, customersSetPrev.size),
      totalIncome: totalRevenue, // Synced with revenue to avoid arbitrary profit assumptions
      incomeChange: getPct(incomeCurrent, incomePrev),
      totalVisitors: allOrders.length * 2,
      visitorsChange: getPct(ordersCurrent, ordersPrev),
      monthlyChartData: defaultData.monthlyChartData
    };
  }, [allOrders, isAdminUser]);

  const { totalRevenue, revenueChange, totalOrders, ordersChange, totalCustomers, customersChange, totalIncome, incomeChange, totalVisitors, visitorsChange, monthlyChartData } = stats;

  // Refactor products with real sales stats
  const productsWithActualStats = useMemo(() => {
    return products.map(p => {
      const productOrders = (allOrders || []).filter(o =>
        o.status !== 'cancelled' &&
        o.items?.some(item => item.productId === p.id)
      );

      const sales = productOrders.reduce((sum, o) => {
        const item = o.items.find(i => i.productId === p.id);
        return sum + (item?.qty || 0);
      }, 0);

      const revenue = productOrders.reduce((sum, o) => {
        const item = o.items.find(i => i.productId === p.id);
        return sum + ((item?.price || 0) * (item?.qty || 0));
      }, 0);

      return {
        ...p,
        stock: 0, // Placeholder as stock management isn't implemented in DB yet
        dateAdded: p.id, // Fallback
        sales,
        revenue
      };
    });
  }, [products, allOrders, isAdminUser]);

  const sortedProducts = useMemo(() => {
    let sortableItems = [...productsWithActualStats];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

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
  }, [productsWithActualStats, sortConfig, isAdminUser]);

  const topSellingProducts = useMemo(() => {
    return [...productsWithActualStats].sort((a, b) => b.sales - a.sales).slice(0, 5);
  }, [productsWithActualStats, isAdminUser]);

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
            <KpiCard type="sales" title="Total Sales" value={<><span className="font-currency">₹</span>{formatPrice(totalRevenue)}</>} icon={IndianRupee} change={`${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`} changeType={revenueChange >= 0 ? 'increase' : 'decrease'} />
          </div>
          <div onClick={() => setActiveModal('orders')} className="p-0">
            <KpiCard type="orders" title="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} change={`${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%`} changeType={ordersChange >= 0 ? 'increase' : 'decrease'} />
          </div>
          <div onClick={() => setActiveModal('customers')} className="p-0">
            <KpiCard type="customers" title="Total Customers" value={totalCustomers} icon={Users} change={`${customersChange >= 0 ? '+' : ''}${customersChange.toFixed(1)}%`} changeType={customersChange >= 0 ? 'increase' : 'decrease'} />
          </div>
          <div onClick={() => setActiveModal('products')} className="p-0">
            <KpiCard type="products" title="Total Products" value={products.length} icon={Package} change=" " />
          </div>
          <div onClick={() => setActiveModal('income')} className="p-0">
            <KpiCard type="income" title="Total Income" value={<><span className="font-currency">₹</span>{formatPrice(totalIncome)}</>} icon={TrendingUp} change={`${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`} changeType={incomeChange >= 0 ? 'increase' : 'decrease'} />
          </div>
          <div onClick={() => setActiveModal('visitors')} className="p-0">
            <KpiCard type="visitors" title="Total Visitors" value={totalVisitors.toLocaleString()} icon={Users} change={`${visitorsChange >= 0 ? '+' : ''}${visitorsChange.toFixed(1)}%`} changeType={visitorsChange >= 0 ? 'increase' : 'decrease'} />
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
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-full transition-all ${isActive
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

              {activeMobileTab === 'reviews' && <CustomerReviews reviews={allReviews || []} />}
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
        <CustomerReviews reviews={allReviews || []} />
      </div>

      <SiteContentManagement
        heroSlides={heroSlides}
        selectedDealIds={selectedDealIds}
        products={products}
        isLoading={isLoading}
        isUploading={isUploading}
        onDealSelection={handleDealSelection}
        onHeroSlideChange={handleHeroSlideChange}
        onAddHeroSlide={addHeroSlide}
        onRemoveHeroSlide={removeHeroSlide}
        onRestoreDefaults={restoreHeroDefaults}
        onSaveChanges={handleSaveChanges}
      />

      <InventoryManagement products={products} />

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
              ) : sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{product.dateAdded && typeof product.dateAdded === 'string' ? new Date(product.dateAdded).toLocaleDateString() : 'N/A'}</TableCell>
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
                              onClick={() => handleDelete(product)}
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

