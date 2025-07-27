-- Create orders table for Shopify order data
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  shopify_order_id BIGINT NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  order_number VARCHAR(100),
  financial_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
  tags TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(merchant_id, shopify_order_id)
);

-- Create order_items table for individual items in orders
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  shopify_product_id BIGINT NOT NULL,
  shopify_variant_id BIGINT,
  product_name VARCHAR(500) NOT NULL,
  variant_title VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  sku VARCHAR(255),
  vendor VARCHAR(255),
  product_type VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Merchants can view their own orders" 
ON public.orders 
FOR SELECT 
USING (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Merchants can insert their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (merchant_id = get_current_user_merchant_id());

CREATE POLICY "Merchants can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (merchant_id = get_current_user_merchant_id());

-- Create RLS policies for order_items
CREATE POLICY "Merchants can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_items.order_id 
  AND o.merchant_id = get_current_user_merchant_id()
));

CREATE POLICY "Merchants can insert their own order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_items.order_id 
  AND o.merchant_id = get_current_user_merchant_id()
));

CREATE POLICY "Merchants can update their own order items" 
ON public.order_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_items.order_id 
  AND o.merchant_id = get_current_user_merchant_id()
));

-- Create indexes for performance
CREATE INDEX idx_orders_merchant_id ON public.orders(merchant_id);
CREATE INDEX idx_orders_shopify_order_id ON public.orders(shopify_order_id);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_shopify_product_id ON public.order_items(shopify_product_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_orders_updated_at();