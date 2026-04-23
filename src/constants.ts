import { Product, CustomizationSize, CustomizationType } from './types';

export const BASE_PRODUCTS: Product[] = [];

export const CATEGORIES = ['Barchasi', 'Kiyim', 'Aksessuar', 'Idish', 'Oyoq kiyim'];

export const READY_DESIGNS: Product[] = [];

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
