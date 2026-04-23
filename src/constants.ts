import { Product, CustomizationSize, CustomizationType } from './types';

export const BASE_PRODUCTS: Product[] = [
  {
    id: 'b1',
    name: 'Premium Oq Futbolka',
    category: 'Kiyim',
    price: 189000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    description: '100% paxta, premium oq futbolka'
  },
  {
    id: 'b2',
    name: 'Vintage Qora Xudi',
    category: 'Kiyim',
    price: 349000,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
    description: 'Issiq va qulay oversize xudi'
  },
  {
    id: 'b3',
    name: 'Retrox Kepka',
    category: 'Aksessuar',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800',
    description: 'Zamonaviy streetstyle kepka'
  },
  {
    id: 'b4',
    name: 'Eco Shopping Bag',
    category: 'Aksessuar',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    description: 'Ekologik toza matoli sumka'
  },
  {
    id: 'b5',
    name: 'Dizaynerlik Krujkasi',
    category: 'Idish',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
    description: 'Minimalistik keramika krujka'
  },
  {
    id: 'b9',
    name: 'Oq Klassik Shlepkalar',
    category: 'Oyoq kiyim',
    price: 245000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    description: 'Minimalizm uslubidagi oq krossovkalar'
  },
  {
    id: 'b10',
    name: 'Bazaviy Svishot',
    category: 'Kiyim',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
    description: 'Sifatli matodan tayyorlangan bazaviy kiyim'
  },
  {
    id: 'b11',
    name: 'Qora Matli Idish',
    category: 'Idish',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1517256011271-101ad9d4c5c7?auto=format&fit=crop&q=80&w=800',
    description: 'Elegand qora matli keramika'
  }
];

export const CATEGORIES = ['Barchasi', 'Kiyim', 'Aksessuar', 'Idish', 'Oyoq kiyim'];

export const READY_DESIGNS: Product[] = [
  {
    id: 'r1',
    name: 'Green Art Edition',
    category: 'Kiyim',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    description: 'Eksklyuziv neonli yashil art dizayni'
  },
  {
    id: 'r2',
    name: 'Samurai Warrior',
    category: 'Kiyim',
    price: 480000,
    image: 'https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=800',
    description: 'Yapon samuray uslubidagi mahobatli dizayn'
  },
  {
    id: 'r3',
    name: 'Rabbit Samurai Ukiyo-e',
    category: 'Kiyim',
    price: 420000,
    image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=800',
    description: 'An\'anaviy ukiyo-e uslubidagi quyon samuray'
  },
  {
    id: 'r4',
    name: 'Color Splash AF1',
    category: 'Oyoq kiyim',
    price: 890000,
    image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=800',
    description: 'Ranglar portlashi aks etgan poyabzal'
  },
  {
    id: 'r5',
    name: 'Watercolor AF1',
    category: 'Oyoq kiyim',
    price: 850000,
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=800',
    description: 'Nafis akvarel uslubidagi dizayn'
  },
  {
    id: 'r6',
    name: 'CR7 Studio Mug',
    category: 'Idish',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
    description: 'Cristiano Ronaldo watercolor portreti'
  }
];

export const SIZE_PRICES: Record<CustomizationSize, number> = {
  'A6/A5': 20000,
  'A4': 50000,
  'A3': 100000
};

export const TYPE_PRICES: Record<CustomizationType, number> = {
  'Text/Logo': 30000,
  'Graphic/Cartoon': 80000,
  'Portrait': 150000
};
