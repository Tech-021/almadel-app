export type Product = {
  id: number;
  barcode: string;
  name: string;
  price: number;
  stock: number;
};

export type ProductDraft = {
  barcode: string;
  name: string;
  price: string;
  stock: string;
};

export type SaleRecord = {
  id: number;
  total_amount: number | null;
  total_items: number | null;
  created_at: string | null;
};

export type StockAdjustmentDraft = {
  barcode: string;
  quantity: string;
  note: string;
};
