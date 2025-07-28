import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantProfile } from './useMerchantProfile';

interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_returns: number;
  return_rate: number;
  last_sale_date: string | null;
  average_price: number;
}

export const useRealProductSalesData = () => {
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useMerchantProfile();

  const fetchProductSalesData = async () => {
    if (!profile?.merchant_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get returns data first
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select(`
          id,
          return_items (
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('merchant_id', profile.merchant_id);

      if (returnsError) throw returnsError;

      // Get order data to calculate sales
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          order_items (
            product_id,
            product_name,
            price,
            quantity
          )
        `);

      if (ordersError) throw ordersError;

      // Aggregate the data by product
      const productMap = new Map<string, ProductSalesData>();

      // Process order items to get sales data
      ordersData?.forEach(order => {
        order.order_items?.forEach(item => {
          const existing = productMap.get(item.product_id) || {
            product_id: item.product_id,
            product_name: item.product_name,
            total_sold: 0,
            total_revenue: 0,
            total_returns: 0,
            return_rate: 0,
            last_sale_date: null,
            average_price: 0
          };

          existing.total_sold += item.quantity || 1;
          existing.total_revenue += (item.price || 0) * (item.quantity || 1);
          existing.last_sale_date = order.created_at;
          existing.average_price = existing.total_revenue / existing.total_sold;

          productMap.set(item.product_id, existing);
        });
      });

      // Process return items to get return data
      returnsData?.forEach(returnRecord => {
        returnRecord.return_items?.forEach(item => {
          const existing = productMap.get(item.product_id);
          if (existing) {
            existing.total_returns += item.quantity || 1;
          } else {
            // If product has returns but no sales in our data, create entry
            productMap.set(item.product_id, {
              product_id: item.product_id,
              product_name: item.product_name,
              total_sold: 0, // No sales data available
              total_revenue: 0,
              total_returns: item.quantity || 1,
              return_rate: 100, // 100% return rate if no sales
              last_sale_date: null,
              average_price: item.price || 0
            });
          }
        });
      });

      // Calculate return rates and prepare final data
      const finalData = Array.from(productMap.values()).map(product => ({
        ...product,
        return_rate: product.total_sold > 0 
          ? (product.total_returns / product.total_sold) * 100 
          : product.total_returns > 0 ? 100 : 0
      }));

      setSalesData(finalData);

    } catch (err) {
      console.error('Error fetching product sales data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductSalesData();
  }, [profile?.merchant_id]);

  return {
    salesData,
    loading,
    error,
    refetch: fetchProductSalesData
  };
};