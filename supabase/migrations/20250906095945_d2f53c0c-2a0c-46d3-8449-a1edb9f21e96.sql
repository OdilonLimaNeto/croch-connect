-- Create expenses table for material costs tracking
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL, -- 'materials', 'equipment', 'other'
  date DATE NOT NULL,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales table for payment tracking
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'installments'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'cancelled'
  installments_count INTEGER DEFAULT 1,
  sale_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create installments table for tracking installment payments
CREATE TABLE public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  payment_method TEXT, -- payment method used for this specific installment
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sale_items table to link sales with products
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- store name in case product is deleted
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can manage expenses" ON public.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admin can manage sales" ON public.sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admin can manage installments" ON public.installments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admin can manage sale_items" ON public.sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'::user_role
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_status ON public.sales(payment_status);
CREATE INDEX idx_installments_sale_id ON public.installments(sale_id);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_installments_status ON public.installments(status);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

-- Create triggers for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create installments when a sale is created
CREATE OR REPLACE FUNCTION public.create_sale_installments()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create installments if payment_method is 'installments' and installments_count > 1
  IF NEW.payment_method = 'installments' AND NEW.installments_count > 1 THEN
    -- Insert installments
    FOR i IN 1..NEW.installments_count LOOP
      INSERT INTO public.installments (
        sale_id,
        installment_number,
        amount,
        due_date,
        status
      ) VALUES (
        NEW.id,
        i,
        ROUND(NEW.total_amount / NEW.installments_count, 2),
        NEW.sale_date + INTERVAL '1 month' * (i - 1),
        'pending'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic installment creation
CREATE TRIGGER create_installments_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sale_installments();