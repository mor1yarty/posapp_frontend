export interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  color: string;
  item_code: string;
  full_name: string;
}

export interface PurchaseItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  color: string;
  item_code: string;
  full_name: string;
  quantity: number;
}

export interface PurchaseRequest {
  register_staff_code?: string;
  store_code?: string;
  pos_id?: string;
  items: Omit<PurchaseItem, 'quantity'>[];
}

export interface PurchaseResponse {
  success: boolean;
  total_amount: number;
  transaction_id?: number;
  message?: string;
}