export type Category = 'Barchasi' | 'Kiyim' | 'Aksessuar' | 'Idish' | 'Oyoq kiyim';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  description: string;
}

export type CustomizationSize = 'A6/A5' | 'A4' | 'A3';
export type CustomizationType = 'Text/Logo' | 'Graphic/Cartoon' | 'Portrait';

export interface CustomizationOption {
  size: CustomizationSize;
  type: CustomizationType;
  price: number;
}

export interface Order {
  productId: string;
  customization: {
    size: CustomizationSize;
    type: CustomizationType;
    image?: string; // URL or base64
  };
  totalPrice: number;
}

export interface CartItem {
  id: string;
  product: Product;
  customSize: CustomizationSize;
  customType: CustomizationType;
  uploadedImage: string | null;
  totalPrice: number;
}

export interface CompleteOrder {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  date: string;
  status: 'Kutilmoqda' | 'Tayyorlanmoqda' | 'Yetkazilmoqda' | 'Yetkazilgan' | 'Tasdiqlandi' | "To'langan";
  customerName?: string;
  customerPhone?: string;
  receiptImage?: string | null;
}
