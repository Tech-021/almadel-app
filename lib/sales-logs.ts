import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/inventory";

type SaleLogItem = Product & {
  quantity: number;
  total: number;
};

type SaleLogInput = {
  items: SaleLogItem[];
  totalAmount: number;
  totalItems: number;
  userId?: string;
};

export async function recordSaleLog({ items, totalAmount, totalItems, userId }: SaleLogInput) {
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      total_amount: totalAmount,
      total_items: totalItems,
      user_id: userId,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    console.log("Sale log skipped:", saleError);
    return;
  }

  const saleItems = items.map((item) => ({
    sale_id: sale.id,
    product_id: item.id,
    barcode: item.barcode,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.total,
  }));

  const { error: itemError } = await supabase.from("sale_items").insert(saleItems);

  if (itemError) {
    console.log("Sale item log skipped:", itemError);
  }
}
