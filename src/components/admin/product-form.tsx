
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, WithId } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, PlusCircle, Upload, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  tagline: z.string().min(3, 'Tagline must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  defaultPrice: z.coerce.number().min(0, 'Price must be a positive number.'),
  salePrice: z.coerce.number().optional(),
  category: z.string().min(1, 'Category is required.'),
  benefits: z.string().min(3, 'Please list at least one benefit.'),
  ingredients: z.string().optional(),
  nutritionFacts: z.string().optional(),
  image: z.any().optional(), // Allow file or URL string
  imageHint: z.string().optional(),
  variants: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Variant name is required.'),
      price: z.coerce.number().min(0, 'Price must be positive.'),
      salePrice: z.coerce.number().optional(),
    })
  ).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: WithId<Product>;
}

export function ProductForm({ product }: ProductFormProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image.url as string || null);

  const defaultValues = product
    ? {
        ...product,
        benefits: Array.isArray(product.benefits) ? product.benefits.join(', ') : '',
        ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : '',
        nutritionFacts: product.nutritionFacts || '',
        image: product.image.url as string,
        imageHint: product.image.hint || '',
        salePrice: product.salePrice,
      }
    : {
        name: '',
        tagline: '',
        description: '',
        defaultPrice: 0,
        salePrice: undefined,
        category: '',
        benefits: '',
        ingredients: '',
        nutritionFacts: '',
        image: undefined,
        imageHint: '',
        variants: [],
      };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    let imageUrl = product?.image.url as string || '';

    // Handle image upload if a new file is selected
    if (values.image && typeof values.image !== 'string') {
      const file = values.image[0];
      if (file) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `products/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Could not upload the new image. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }
      }
    }


    const slug = product?.slug || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const productData: Omit<Product, 'id'> = {
      name: values.name,
      slug,
      tagline: values.tagline,
      description: values.description,
      defaultPrice: values.defaultPrice,
      salePrice: values.salePrice,
      variants: values.variants?.map(v => ({ ...v })) || [],
      category: values.category as Product['category'],
      benefits: values.benefits.split(',').map(s => s.trim()),
      ingredients: values.ingredients?.split(',').map(s => s.trim()) || [],
      nutritionFacts: values.nutritionFacts || '',
      image: {
        id: product?.image.id || slug,
        url: imageUrl,
        hint: values.imageHint || '',
      },
    };

    try {
      if (product?.id) {
        const productRef = doc(firestore, 'products', product.id);
        await setDoc(productRef, productData, { merge: true });
        toast({
          title: 'Product Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        const productsCollection = collection(firestore, 'products');
        await addDoc(productsCollection, productData);
        toast({
          title: 'Product Created',
          description: `${values.name} has been successfully created.`,
        });
      }
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while saving the product. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Talbina Regular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Original Super Breakfast" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-8">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Asli Talbina" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a category. You can create a new one by typing it in.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (&lt;span className="font-currency"&gt;₹&lt;/span&gt;)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (&lt;span className="font-currency"&gt;₹&lt;/span&gt;)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <div>
                <FormLabel>Product Image</FormLabel>
                {imagePreview && (
                  <div className="mt-2 mb-4 relative w-full aspect-square max-w-xs mx-auto">
                    <Image
                      src={imagePreview}
                      alt="Image Preview"
                      fill
                      className="rounded-md object-contain border p-2"
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files);
                            handleImageChange(e);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Upload an image from your computer.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="imageHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image AI Hint</FormLabel>
              <FormControl>
                <Input placeholder="e.g., product package" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Provide one or two keywords for AI-assisted image searching.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benefits</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated benefits" {...field} />
              </FormControl>
              <FormDescription>
                Separate each benefit with a comma (e.g., Benefit 1, Benefit 2).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ingredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredients</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter comma-separated ingredients" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Separate each ingredient with a comma.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nutritionFacts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nutritional Facts</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Serving Size: 30g, Calories: 110" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Product Variants</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4 p-4 border rounded-md">
              <FormField
                control={form.control}
                name={`variants.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Variant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 500g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 599" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.salePrice`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant="ghost" size="icon" onClick={() => remove(index)} className="self-end">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: `variant-${Date.now()}`, name: '', price: 0, salePrice: undefined })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : product ? (
            'Update Product'
          ) : (
            'Create Product'
          )}
        </Button>
      </form>
    </Form>
  );
}
