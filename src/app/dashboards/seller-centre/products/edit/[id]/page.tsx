

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  PlusCircle,
  RefreshCcw,
  ExternalLink,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateProductMetadata } from '@/ai/flows/smart-product-tagging';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc, collection, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { generateSlug, createMarkup } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { nanoid } from 'nanoid';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useActionState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logFeatureUsage } from '@/lib/analytics';


type Variant = {
    id: string;
    price: string;
    stock: string;
    sku: string;
    weight: { value: string, unit: string };
    dimensions: { length: string, width: string, height: string, unit: string };
    attributes: Record<string, string>;
    retailPrice?: string;
    b2cStock?: number;
};

type ProductFormState = {
    name: string;
    description: string;
    imageUrl: string;
    bannerUrl: string;
    tags: string[];
    category: string;
    subcategory: string;
    options: string[];
    variants: Variant[];
    material: string;
    certifications: string;
    packagingDetails: string;
    listOnTradintaDirect: boolean;
    tradintaDirectStatus?: 'not_listed' | 'pending_setup' | 'live' | 'paused';
};

type ManufacturerData = {
    shopId?: string;
    shopName?: string;
}

type PlatformSettings = {
    enableTradintaDirect?: boolean;
}

type ProductCategory = {
  id: string;
  name: string;
  subcategories: string[];
}

const initialFormState: ProductFormState = {
  name: '',
  description: '',
  imageUrl: '',
  bannerUrl: '',
  tags: [],
  category: '',
  subcategory: '',
  options: [''],
  variants: [],
  material: '',
  certifications: '',
  packagingDetails: '',
  listOnTradintaDirect: false,
  tradintaDirectStatus: 'not_listed',
};

export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { user, role } = useUser();
  const firestore = useFirestore();
  const productId = params.id as string;
  
  const draftKey = `product-draft-${productId}`;
  const [formState, setFormState, clearFormState] = useLocalStorageState<ProductFormState>(draftKey, initialFormState);

  const productDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore || !productId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'products', productId);
  }, [firestore, user, productId]);

  const { data: productData, isLoading: isProductLoading } = useDoc(productDocRef);

  const manufacturerDocRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, 'manufacturers', user.uid);
  }, [firestore, user]);

  const { data: manufacturerData, isLoading: isManufacturerLoading } = useDoc<ManufacturerData>(manufacturerDocRef);
  
  const platformSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platformSettings', 'config') : null, [firestore]);
  const { data: platformSettings, isLoading: isLoadingSettings } = useDoc<PlatformSettings>(platformSettingsRef);

  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);

  React.useEffect(() => {
    const fetchCategories = async () => {
      if (!firestore) return;
      setIsLoadingCategories(true);
      try {
        const catCollection = collection(firestore, 'productCategories');
        const catSnapshot = await getDocs(catCollection);
        const catList = catSnapshot.docs.map(doc => doc.data() as ProductCategory);
        setCategories(catList);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast({ title: 'Error', description: 'Could not load product categories.', variant: 'destructive' });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [firestore, toast]);
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  
  // This state now controls the initial hydration from Firestore
  const [isHydrated, setIsHydrated] = React.useState(false);

  // AI State
  const [aiState, dispatch] = useActionState(
    generateProductMetadata,
    { message: '', output: null, errors: null }
  );
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Effect to hydrate the form from Firestore only ONCE.
  React.useEffect(() => {
    // Only run this if we have data and haven't hydrated yet.
    if (productData && !isHydrated) {
        const dbState = {
            name: productData.name || '',
            description: productData.description || '',
            imageUrl: productData.imageUrl || '',
            bannerUrl: productData.bannerUrl || '',
            tags: productData.tags || [],
            category: productData.category || '',
            subcategory: productData.subcategory || '',
            options: productData.options && productData.options.length > 0 ? productData.options : [''],
            variants: productData.variants?.map((v: any) => ({
              ...v,
              price: v.price?.toString() || '',
              stock: v.stock?.toString() || '',
              retailPrice: v.retailPrice?.toString() || '',
              weight: {
                  value: v.weight?.value?.toString() || '',
                  unit: v.weight?.unit || 'kg'
              },
              dimensions: {
                  length: v.dimensions?.length?.toString() || '',
                  width: v.dimensions?.width?.toString() || '',
                  height: v.dimensions?.height?.toString() || '',
                  unit: v.dimensions?.unit || 'cm'
              }
            })) || [],
            material: productData.material || '',
            certifications: productData.certifications || '',
            packagingDetails: productData.packagingDetails || '',
            listOnTradintaDirect: productData.listOnTradintaDirect || false,
            tradintaDirectStatus: productData.tradintaDirectStatus || 'not_listed',
        };
        setFormState(dbState);
        setIsHydrated(true); // Mark as hydrated
    }
  }, [productData, isHydrated, setFormState]);


  const handleFormChange = (field: keyof ProductFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formState.options];
    newOptions[index] = value;
    handleFormChange('options', newOptions);
  };
  const handleAddOption = () => handleFormChange('options', [...formState.options, '']);
  const handleRemoveOption = (index: number) => {
    const newOptions = formState.options.filter((_, i) => i !== index);
    handleFormChange('options', newOptions);
  };
  
  const handleAddVariant = () => {
    const newVariant: Variant = {
        id: nanoid(),
        price: '',
        stock: '',
        sku: '',
        weight: { value: '', unit: 'kg' },
        dimensions: { length: '', width: '', height: '', unit: 'cm' },
        attributes: formState.options.reduce((acc, option) => {
            if (option) acc[option] = '';
            return acc;
        }, {} as Record<string, string>),
        retailPrice: '',
    };
    handleFormChange('variants', [...formState.variants, newVariant]);
  };
  const handleVariantChange = (variantId: string, field: keyof Omit<Variant, 'id'|'attributes' | 'weight' | 'dimensions'>, value: string) => {
    const newVariants = formState.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v);
    handleFormChange('variants', newVariants);
  };

  const handleVariantSubfieldChange = (variantId: string, field: 'weight' | 'dimensions', subfield: string, value: string) => {
    const newVariants = formState.variants.map(v => 
        v.id === variantId 
            ? { ...v, [field]: { ...v[field], [subfield]: value } }
            : v
    );
    handleFormChange('variants', newVariants);
  };

  const handleAttributeChange = (variantId: string, attribute: string, value: string) => {
    const newVariants = formState.variants.map(v => v.id === variantId ? { ...v, attributes: { ...v.attributes, [attribute]: value } } : v);
    handleFormChange('variants', newVariants);
  };
   const handleRemoveVariant = (variantId: string) => {
    const newVariants = formState.variants.filter(v => v.id !== variantId);
    handleFormChange('variants', newVariants);
  };

  const handleCategoryChange = (value: string) => {
    handleFormChange('category', value);
    handleFormChange('subcategory', '');
  };

  const selectedCategory = React.useMemo(() => {
    return categories.find(c => c.name === formState.category) || null;
  }, [formState.category, categories]);
  
  const subcategories = React.useMemo(() => {
    return selectedCategory?.subcategories || [];
  }, [selectedCategory]);

  React.useEffect(() => {
    if (aiState.message && isGenerating) {
      setIsGenerating(false);
      if (aiState.output) {
        toast({
          title: 'AI Magic Complete!',
          description: 'Tags and description have been generated.',
        });
        handleFormChange('tags', aiState.output.tags);
        handleFormChange('description', aiState.output.description);
      } else {
        toast({
          title: 'Uh oh!',
          description: aiState.message,
          variant: 'destructive',
        });
      }
    }
  }, [aiState, toast, isGenerating]);

  const handleGenerate = (formData: FormData) => {
    if (user && role) {
        logFeatureUsage({ feature: 'product:generate_ai_metadata', userId: user.uid, userRole: role });
    }
    setIsGenerating(true);
    dispatch(formData);
  };
  
  const handleUpdateProduct = async (status: 'draft' | 'published') => {
    if (!productDocRef || !firestore || !user || !role) {
        toast({ title: 'Error', description: 'Product reference is not available.', variant: 'destructive' });
        return;
    }

    logFeatureUsage({ feature: `product:update_${status}`, userId: user.uid, userRole: role, metadata: { productId }});
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);

        let tradintaDirectStatus = formState.tradintaDirectStatus;
        if(formState.listOnTradintaDirect && formState.tradintaDirectStatus === 'not_listed') {
            tradintaDirectStatus = 'pending_setup';
        } else if (!formState.listOnTradintaDirect) {
            tradintaDirectStatus = 'not_listed';
        }

        const keywords = new Set<string>();
        const addToKeywords = (text: string | undefined | null) => {
            if (!text) return;
            text.toLowerCase().split(/\s+/).forEach(word => {
                const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                if (cleanWord) keywords.add(cleanWord);
            });
        };

        addToKeywords(formState.name);
        addToKeywords(formState.category);
        addToKeywords(formState.subcategory);
        addToKeywords(formState.material);
        formState.tags.forEach(tag => addToKeywords(tag));
        
        const updatedProductData = {
            name: formState.name,
            slug: generateSlug(formState.name),
            description: formState.description,
            category: formState.category,
            subcategory: formState.subcategory,
            imageUrl: formState.imageUrl,
            bannerUrl: formState.bannerUrl,
            tags: formState.tags,
            searchKeywords: Array.from(keywords),
            options: formState.options.filter(Boolean),
            variants: formState.variants.map(v => ({
                ...v,
                price: Number(v.price) || 0,
                stock: Number(v.stock) || 0,
                retailPrice: formState.listOnTradintaDirect ? (Number(v.retailPrice) || 0) : null,
                weight: {
                    ...v.weight,
                    value: Number(v.weight.value) || 0,
                },
                dimensions: {
                    ...v.dimensions,
                    length: Number(v.dimensions.length) || 0,
                    width: Number(v.dimensions.width) || 0,
                    height: Number(v.dimensions.height) || 0,
                }
            })),
            material: formState.material,
            certifications: formState.certifications,
            packagingDetails: formState.packagingDetails,
            listOnTradintaDirect: formState.listOnTradintaDirect,
            tradintaDirectStatus: tradintaDirectStatus,
            status,
            updatedAt: serverTimestamp(),
        };

        // Update the nested document
        batch.update(productDocRef, updatedProductData);
        
        // Also update the summary document in the top-level collection
        const rootProductRef = doc(firestore, 'products', productId);
        batch.set(rootProductRef, {
            ...updatedProductData,
            id: productId,
            manufacturerId: user?.uid,
            manufacturerName: manufacturerData?.shopName,
        }, { merge: true });

        await batch.commit();

        toast({
            title: 'Product Updated!',
            description: `Your product has been successfully updated.`,
        });
        clearFormState(); // Clear local draft on successful save
        router.push('/dashboards/seller-centre/products');

    } catch (error) {
        console.error("Error updating product:", error);
        toast({
            title: 'Update Failed',
            description: 'There was an error updating your product. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

  const isSaveDisabled = isSaving || isUploading;
  const productUrl = manufacturerData?.shopId && formState.name ? `/products/${manufacturerData.shopId}/${generateSlug(formState.name)}` : '';
  const isDirectEnabled = platformSettings?.enableTradintaDirect ?? true;


  if (isProductLoading || isManufacturerLoading || isLoadingSettings) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-48" />
             </div>
              <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
                </div>
                 <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                     <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                     <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                 </div>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/seller-centre/products">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Edit Product
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="ghost" size="sm" onClick={clearFormState} disabled={isSaveDisabled}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Clear Draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleUpdateProduct('draft')} disabled={isSaveDisabled}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Draft
          </Button>
          <Button size="sm" onClick={() => handleUpdateProduct('published')} disabled={isSaveDisabled}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save and Publish
          </Button>
        </div>
      </div>
      <Alert>
          <Save className="h-4 w-4" />
          <AlertTitle>Auto-Save Enabled</AlertTitle>
          <AlertDescription>
            Your changes are being automatically saved to this browser. You can leave and come back to resume editing.
          </AlertDescription>
      </Alert>
      {productUrl && (
        <Card>
            <CardContent className="p-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <ExternalLink className="h-4 w-4"/>
                    Your product will be available at: 
                    <Link href={productUrl} target="_blank" className="font-mono text-primary hover:underline">
                        {productUrl}
                    </Link>
                </p>
            </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Provide the essential information about your product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    type="text"
                    className="w-full"
                    placeholder="e.g. Industrial Grade Cement"
                    value={formState.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                   <p className="text-xs text-muted-foreground">This is your product's title and will be important for SEO. Make it clear and descriptive.</p>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                            <Textarea
                                id="description"
                                placeholder="Provide a detailed description of your product. You can use markdown for formatting."
                                className="min-h-32"
                                value={formState.description}
                                onChange={(e) => handleFormChange('description', e.target.value)}
                            />
                        </TabsContent>
                        <TabsContent value="preview">
                            <div className="prose min-h-32 w-full rounded-md border border-input p-4" dangerouslySetInnerHTML={createMarkup(formState.description)} />
                        </TabsContent>
                    </Tabs>
                    <p className="text-xs text-muted-foreground">A good description helps buyers make a decision and improves your product's ranking in search results.</p>
                </div>
                {formState.tags.length > 0 && (
                    <div className="grid gap-3">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                        {formState.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                            {tag}
                            </Badge>
                        ))}
                        </div>
                    </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ai-tagging">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>AI Smart-Tagging & Description</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <form action={dispatch} className="p-4">
                      <div className="grid gap-6">
                        <div className="grid gap-3">
                          <Label htmlFor="productName">Product Name</Label>
                          <Input
                            id="productName"
                            name="productName"
                            type="text"
                            className="w-full"
                            defaultValue={formState.name}
                            placeholder="e.g. Industrial Grade Cement"
                          />
                          {aiState.errors?.productName && (
                            <p className="text-sm text-destructive">
                              {aiState.errors.productName[0]}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="productDetails">
                            Product Details
                          </Label>
                          <Textarea
                            id="productDetails"
                            name="productDetails"
                            defaultValue={formState.description}
                            placeholder="Provide key details for the AI. e.g., '50kg bag of high-strength Portland cement for construction projects. KEBS certified.'"
                          />
                          {aiState.errors?.productDetails && (
                            <p className="text-sm text-destructive">
                              {aiState.errors.productDetails[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate with AI
                            </Button>
                        </div>
                      </div>
                    </form>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardFooter>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Add options like size or color to create different versions of this product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed" data-disabled={!isDirectEnabled}>
                  <Switch id="tradinta-direct-switch" checked={formState.listOnTradintaDirect} onCheckedChange={(checked) => handleFormChange('listOnTradintaDirect', checked)} disabled={!isDirectEnabled} />
                  <Label htmlFor="tradinta-direct-switch" className="flex flex-col data-[disabled=true]:cursor-not-allowed" data-disabled={!isDirectEnabled}>
                    <span className="font-semibold flex items-center gap-2"><Store className="w-4 h-4 text-primary"/>List this product on Tradinta Direct</span>
                    <span className="text-xs text-muted-foreground">{isDirectEnabled ? 'Make this product available for direct-to-consumer purchase.' : 'Tradinta Direct is currently disabled by administrators.'}</span>
                  </Label>
                </div>

                <div>
                    <Label>Variant Options</Label>
                    <p className="text-xs text-muted-foreground mt-1">Define the types of variants, e.g., "Container Size", "Color", "Weight".</p>
                    <div className="space-y-2 mt-2">
                        {formState.options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input 
                                    placeholder={`Option ${index + 1} (e.g., Size)`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                {formState.options.length > 1 && <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>}
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddOption}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add another option
                    </Button>
                </div>
                
                {formState.options.filter(Boolean).length > 0 && (
                    <div>
                         <Label>Variants List</Label>
                         <p className="text-xs text-muted-foreground mt-1">Create a specific variant for each combination of options (e.g., a "5 Litre" "Red" variant).</p>
                         <div className="space-y-4 mt-2">
                            {formState.variants.map(variant => (
                                <Card key={variant.id} className="p-4 bg-muted/50">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {Object.keys(variant.attributes).map(attr => (
                                            <div key={attr} className="grid gap-2">
                                                <Label className="text-xs">{attr}</Label>
                                                <Input placeholder={attr} value={variant.attributes[attr]} onChange={e => handleAttributeChange(variant.id, attr, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                        <div className="grid gap-2"><Label className="text-xs">B2B Price (KES)</Label><Input type="number" placeholder="0.00" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} /></div>
                                        <div className="grid gap-2"><Label className="text-xs">Stock</Label><Input type="number" placeholder="0" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)} /></div>
                                    </div>
                                     {formState.listOnTradintaDirect && (
                                        <div className="mt-4 pt-4 border-t border-dashed">
                                            <Label className="text-xs font-semibold text-primary">Tradinta Direct (B2C)</Label>
                                            <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`rrp-${variant.id}`} className="text-xs">Retail Price (RRP)</Label>
                                                    <Input id={`rrp-${variant.id}`} type="number" placeholder="e.g. 800.00" value={variant.retailPrice} onChange={e => handleVariantChange(variant.id, 'retailPrice', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 gap-4 mt-4">
                                        <div className="grid gap-2"><Label className="text-xs">SKU</Label><Input placeholder="SKU-VAR-01" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)} /></div>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <Label className="text-xs">Weight</Label>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" placeholder="0.0" value={variant.weight.value} onChange={e => handleVariantSubfieldChange(variant.id, 'weight', 'value', e.target.value)} />
                                                <Select value={variant.weight.unit} onValueChange={value => handleVariantSubfieldChange(variant.id, 'weight', 'unit', value)}>
                                                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kg">kg</SelectItem>
                                                        <SelectItem value="g">g</SelectItem>
                                                        <SelectItem value="lb">lb</SelectItem>
                                                        <SelectItem value="oz">oz</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                         <div>
                                            <Label className="text-xs">Dimensions (L x W x H)</Label>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" placeholder="L" value={variant.dimensions.length} onChange={e => handleVariantSubfieldChange(variant.id, 'dimensions', 'length', e.target.value)} />
                                                <Input type="number" placeholder="W" value={variant.dimensions.width} onChange={e => handleVariantSubfieldChange(variant.id, 'dimensions', 'width', e.target.value)} />
                                                <Input type="number" placeholder="H" value={variant.dimensions.height} onChange={e => handleVariantSubfieldChange(variant.id, 'dimensions', 'height', e.target.value)} />
                                                <Select value={variant.dimensions.unit} onValueChange={value => handleVariantSubfieldChange(variant.id, 'dimensions', 'unit', value)}>
                                                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cm">cm</SelectItem>
                                                        <SelectItem value="in">in</SelectItem>
                                                        <SelectItem value="m">m</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive" onClick={() => handleRemoveVariant(variant.id)}>Remove Variant</Button>
                                </Card>
                            ))}
                         </div>
                         <Button variant="secondary" className="mt-4" onClick={handleAddVariant}>
                             <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                         </Button>
                    </div>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Product Media</CardTitle>
              <CardDescription>
                Upload a main banner and additional images to showcase your product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <PhotoUpload
                    label="Main Banner Image"
                    onUpload={(url) => handleFormChange('bannerUrl', url)}
                    onLoadingChange={setIsUploading}
                    initialUrl={formState.bannerUrl}
                />
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <PhotoUpload
                        label="Additional Image 1"
                        onUpload={(url) => handleFormChange('imageUrl', url)}
                        onLoadingChange={setIsUploading}
                        initialUrl={formState.imageUrl}
                    />
                    <PhotoUpload label="Additional Image 2" onUpload={(url) => {}} onLoadingChange={setIsUploading} />
                    <PhotoUpload label="Additional Image 3" onUpload={(url) => {}} onLoadingChange={setIsUploading} />
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Specifications & Packaging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="material">Material</Label>
                  <Input id="material" placeholder="e.g., Portland Cement Type I" value={formState.material} onChange={(e) => handleFormChange('material', e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="certifications">Standards</Label>
                  <Input id="certifications" placeholder="e.g., KEBS Certified, ISO 9001" value={formState.certifications} onChange={(e) => handleFormChange('certifications', e.target.value)} />
                </div>
                <div className="grid gap-3 sm:col-span-2">
                  <Label htmlFor="packagingDetails">Packaging Details</Label>
                  <Textarea id="packagingDetails" placeholder="Describe the product packaging..." className="min-h-24" value={formState.packagingDetails} onChange={(e) => handleFormChange('packagingDetails', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
              <CardDescription>
                Select a category and sub-category for your product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={handleCategoryChange} value={formState.category}>
                    <SelectTrigger id="category" aria-label="Select category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCategories ? <div className="p-4 text-sm">Loading...</div> : categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="subcategory">Sub-category</Label>
                  <Select
                    value={formState.subcategory}
                    onValueChange={(val) => handleFormChange('subcategory', val)}
                    disabled={!selectedCategory || subcategories.length === 0}
                  >
                    <SelectTrigger
                      id="subcategory"
                      aria-label="Select sub-category"
                    >
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 md:hidden">
         <Button variant="outline" size="sm" onClick={() => handleUpdateProduct('draft')} disabled={isSaveDisabled}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Draft
          </Button>
          <Button size="sm" onClick={() => handleUpdateProduct('published')} disabled={isSaveDisabled}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save and Publish
          </Button>
      </div>
    </div>
  );
}
