
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  returnRate: string;
  totalReturns: number;
  mainReason: string;
}

export const useProductsData = () => {
  const { profile } = useProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.merchant_id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const fetchProductsData = async () => {
      try {
        console.log('🔍 Fetching products data for merchant:', profile.merchant_id);
        setLoading(true);

        // Fetch return items with their associated returns data
        const { data: returnItemsData, error: returnItemsError } = await supabase
          .from('return_items')
          .select(`
            *,
            returns!inner(
              merchant_id,
              reason,
              created_at
            )
          `)
          .eq('returns.merchant_id', profile.merchant_id);

        if (returnItemsError) {
          console.error('❌ Error fetching products data:', returnItemsError);
          throw returnItemsError;
        }

        console.log('✅ Raw return items data:', returnItemsData?.length, 'items');

        // Group return items by product and calculate stats
        const productMap = new Map<string, {
          product_id: string;
          product_name: string;
          returns: any[];
          totalReturns: number;
          reasons: string[];
        }>();

        returnItemsData?.forEach(item => {
          const productId = item.product_id;
          
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              product_id: productId,
              product_name: item.product_name,
              returns: [],
              totalReturns: 0,
              reasons: []
            });
          }

          const product = productMap.get(productId)!;
          product.returns.push(item);
          product.totalReturns += item.quantity || 1;
          if (item.returns?.reason) {
            product.reasons.push(item.returns.reason);
          }
        });

        // Convert to Product array and calculate return rates
        const productsArray: Product[] = Array.from(productMap.values()).map((productData, index) => {
          // Calculate most common return reason
          const reasonCounts = productData.reasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const mainReason = Object.entries(reasonCounts).length > 0 
            ? Object.entries(reasonCounts).sort(([,a], [,b]) => b - a)[0][0]
            : 'N/A';

          // Simple return rate calculation (could be enhanced with actual sales data)
          const returnRate = Math.min(productData.totalReturns * 2, 25); // Mock calculation

          return {
            id: productData.product_id,
            name: productData.product_name,
            sku: `SKU-${productData.product_id.slice(-6).toUpperCase()}`,
            category: 'General', // Could be enhanced with actual category data
            returnRate: `${returnRate}%`,
            totalReturns: productData.totalReturns,
            mainReason
          };
        });

        console.log('✅ Processed products data:', productsArray.length, 'products');
        setProducts(productsArray);
        setError(null);

      } catch (err) {
        console.error('💥 Error processing products data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();

    // Set up real-time subscription for return items changes
    channel = supabase
      .channel(`products-realtime-${profile.merchant_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_items',
        },
        (payload) => {
          console.log('🔄 Return items change detected, refreshing products data:', payload.eventType);
          fetchProductsData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${profile.merchant_id}`
        },
        (payload) => {
          console.log('🔄 Returns change detected, refreshing products data:', payload.eventType);
          fetchProductsData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Products subscription status:', status);
      });

    // Listen for manual sync events
    const handleDataSync = () => {
      console.log('📢 Data sync event received in useProductsData');
      fetchProductsData();
    };

    window.addEventListener('dataSync', handleDataSync);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('dataSync', handleDataSync);
    };
  }, [profile?.merchant_id]);

  const refetch = async () => {
    if (!profile?.merchant_id) return;
    
    console.log('🔄 Manual refetch requested for products...');
    setLoading(true);
    
    try {
      // Re-run the fetch logic
      await new Promise(resolve => {
        const event = new CustomEvent('dataSync');
        window.dispatchEvent(event);
        setTimeout(resolve, 100); // Small delay to let the event propagate
      });
    } catch (err) {
      console.error('💥 Error refetching products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return {
    products,
    loading,
    error,
    refetch
  };
};
