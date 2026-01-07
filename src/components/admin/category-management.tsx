'use client';

import { useState } from 'react';
import { initialCategories } from '@/data/categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

type Category = {
    id: string;
    name: string;
    slug: string;
    order: number;
    isActive: boolean;
};

export function CategoryManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState({ name: '', order: 1 });
    const [editCategory, setEditCategory] = useState({ name: '', order: 1 });

    const categoriesCollection = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesCollection, { listen: true });

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Category name is required.',
            });
            return;
        }

        try {
            const slug = generateSlug(newCategory.name);
            await addDoc(categoriesCollection, {
                name: newCategory.name.trim(),
                slug,
                order: newCategory.order,
                isActive: true,
            });

            toast({
                title: 'Category Added',
                description: `${newCategory.name} has been added successfully.`,
            });

            setNewCategory({ name: '', order: 1 });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding category:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add category. Please try again.',
            });
        }
    };

    const handleInitializeCategories = async () => {
        try {
            // const { initialCategories } = await import('@/data/categories');
            for (const cat of initialCategories) {
                await addDoc(categoriesCollection, {
                    name: cat.name,
                    slug: cat.slug,
                    order: cat.order,
                    isActive: cat.isActive
                });
            }
            toast({
                title: 'Initialized',
                description: 'Default categories have been added.',
            });
        } catch (error) {
            console.error("Error seeding:", error);
        }
    };

    const handleUpdateCategory = async (categoryId: string) => {
        if (!editCategory.name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Category name is required.',
            });
            return;
        }

        try {
            const categoryRef = doc(firestore, 'categories', categoryId);
            const slug = generateSlug(editCategory.name);

            await updateDoc(categoryRef, {
                name: editCategory.name.trim(),
                slug,
                order: editCategory.order,
            });

            toast({
                title: 'Category Updated',
                description: `Category has been updated successfully.`,
            });

            setEditingId(null);
        } catch (error) {
            console.error('Error updating category:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update category. Please try again.',
            });
        }
    };

    const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
        try {
            const categoryRef = doc(firestore, 'categories', categoryId);
            await updateDoc(categoryRef, {
                isActive: !currentStatus,
            });

            toast({
                title: currentStatus ? 'Category Disabled' : 'Category Enabled',
                description: `Category is now ${!currentStatus ? 'visible' : 'hidden'} in the navbar.`,
            });
        } catch (error) {
            console.error('Error toggling category:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update category status.',
            });
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const categoryRef = doc(firestore, 'categories', categoryId);
            await deleteDoc(categoryRef);

            toast({
                title: 'Category Deleted',
                description: `${categoryName} has been deleted.`,
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete category. Please try again.',
            });
        }
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setEditCategory({ name: category.name, order: category.order });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditCategory({ name: '', order: 1 });
    };

    const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Category Management</CardTitle>
                        <CardDescription>
                            Manage product categories. Categories are used in the navbar and product filtering.
                        </CardDescription>
                    </div>
                    {!isAdding && (
                        <Button onClick={() => setIsAdding(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isAdding && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold mb-4">Add New Category</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="new-category-name">Category Name</Label>
                                <Input
                                    id="new-category-name"
                                    placeholder="e.g., Asli Talbina"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="new-category-order">Display Order</Label>
                                <Input
                                    id="new-category-order"
                                    type="number"
                                    min="1"
                                    value={newCategory.order}
                                    onChange={(e) => setNewCategory({ ...newCategory, order: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleAddCategory} size="sm">
                                <Check className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                            <Button onClick={() => { setIsAdding(false); setNewCategory({ name: '', order: 1 }); }} variant="outline" size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No categories found. Add your first category to get started.
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" onClick={handleInitializeCategories}>
                                                Load Defaults
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            {editingId === category.id ? (
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={editCategory.order}
                                                    onChange={(e) => setEditCategory({ ...editCategory, order: parseInt(e.target.value) || 1 })}
                                                    className="w-20"
                                                />
                                            ) : (
                                                category.order
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingId === category.id ? (
                                                <Input
                                                    value={editCategory.name}
                                                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                                                />
                                            ) : (
                                                <span className="font-medium">{category.name}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={category.isActive}
                                                onCheckedChange={() => handleToggleActive(category.id, category.isActive)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingId === category.id ? (
                                                    <>
                                                        <Button onClick={() => handleUpdateCategory(category.id)} size="icon" variant="ghost">
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button onClick={cancelEdit} size="icon" variant="ghost">
                                                            <X className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button onClick={() => startEdit(category)} size="icon" variant="ghost">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button onClick={() => handleDeleteCategory(category.id, category.name)} size="icon" variant="ghost">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
