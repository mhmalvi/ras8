
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Returns data hook - fetches from Supabase
export const useReturnsData = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items!fk_return_items_return(*),
          ai_suggestions!fk_ai_suggestions_return(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the expected format
      const transformedReturns = data?.map(returnItem => ({
        id: returnItem.id,
        orderNumber: `#${returnItem.shopify_order_id}`,
        customer: {
          name: returnItem.customer_email.split('@')[0], // Extract name from email
          email: returnItem.customer_email,
          avatar: ""
        },
        product: returnItem.return_items?.[0]?.product_name || "Unknown Product",
        reason: returnItem.reason,
        value: `$${returnItem.total_amount.toString()}`,
        status: returnItem.status,
        aiSuggestion: returnItem.ai_suggestions?.[0]?.suggested_product_name || "No suggestion",
        date: new Date(returnItem.created_at).toLocaleDateString(),
        confidence: returnItem.ai_suggestions?.[0]?.confidence_score || 0,
        numericValue: returnItem.total_amount,
        created_at: returnItem.created_at
      })) || [];
      
      setReturns(transformedReturns);
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError('Failed to fetch returns data');
      
      // Fallback to mock data if there's an error or no data
      const mockReturns = [
        {
          id: "RT-001",
          orderNumber: "#ORD-2024-001",
          customer: { name: "Sarah Johnson", email: "sarah.j@email.com", avatar: "" },
          product: "Wireless Headphones",
          reason: "Defective item",
          value: "$129.99",
          status: "requested",
          aiSuggestion: "Premium Wireless Earbuds",
          confidence: 92,
          date: new Date().toLocaleDateString(),
          numericValue: 129.99,
          created_at: new Date().toISOString()
        }
      ];
      setReturns(mockReturns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const refetch = () => {
    fetchReturns();
  };

  return {
    returns,
    loading,
    error,
    refetch
  };
};
