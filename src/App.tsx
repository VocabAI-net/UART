/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, setDoc, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { db } from './lib/firebase';
import { 
  ShoppingBag, 
  Palette, 
  Upload, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Image as ImageIcon,
  CreditCard,
  X,
  Sparkles,
  Wand2,
  Menu,
  Filter,
  Plus,
  Brush,
  Zap,
  Layers,
  Trash2,
  Calendar,
  Box,
  Clock,
  History,
  ShoppingBasket,
  Copy,
  RefreshCcw,
  AlertTriangle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { READY_DESIGNS, BASE_PRODUCTS, SIZE_PRICES, TYPE_PRICES, CATEGORIES } from './constants';
import { Product, CustomizationSize, CustomizationType, Category, CartItem, CompleteOrder } from './types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Helper to convert and compress images
const compressImage = (file: File | string, maxWidth = 600, quality = 0.5): Promise<string> => {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');
      
      // Paint background white for transparency conversion
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    if (typeof file === 'string') {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => processImage(img);
      img.onerror = reject;
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
};

// Legacy shim for Gemini API (uses the new compressor)
const toBase64 = async (file: File | string): Promise<string> => {
  const dataUrl = await compressImage(file);
  return dataUrl.split(',')[1];
};

// --- Components ---

const CosmosBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cosmos-void">
    <div className="absolute inset-0 starfield opacity-30" />
    <div className="absolute inset-0 art-grain opacity-10 sm:opacity-20" />
    
    {/* Optimized Splatters for Mobile */}
    <div className="splatter splatter-orange top-[5%] left-[5%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] animate-float" />
    <div className="splatter splatter-lime bottom-[5%] right-[5%] w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] animate-float hidden sm:block" style={{ animationDelay: '1s' }} />
    <div className="splatter splatter-pink top-[35%] right-[10%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] animate-float" style={{ animationDelay: '2s' }} />
    <div className="splatter splatter-cyan bottom-[25%] left-[15%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] animate-float hidden sm:block" style={{ animationDelay: '3s' }} />
    
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.05, 0.15, 0.05],
      }}
      transition={{ duration: 30, repeat: Infinity }}
      className="absolute top-[-10%] left-[-5%] w-[100%] h-[100%] bg-cosmos-purple/10 nebula blur-[80px] sm:blur-[120px]"
    />
    <motion.div 
      animate={{ 
        scale: [1.3, 0.9, 1.3],
        rotate: [0, -120, 0],
        opacity: [0.05, 0.25, 0.05],
      }}
      transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-20%] right-[-10%] w-[90%] h-[90%] bg-cosmos-cyan/15 nebula blur-[100px]"
    />
  </div>
);

const Header = ({ onHome, onCatalog, onGallery, onOrders, onCart, cartCount, onMenuToggle, showMobileMenu }: { 
  onHome: () => void; 
  onCatalog: () => void;
  onGallery: () => void;
  onOrders: () => void;
  onCart: () => void;
  cartCount: number;
  onMenuToggle: () => void;
  showMobileMenu: boolean;
}) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/5 h-[72px]">
    <div className="max-w-7xl mx-auto px-4 sm:px-10 h-full flex items-center justify-between relative overflow-hidden">
      {/* Decorative splatter in header */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-art-pink/20 blur-[40px] rounded-full pointer-events-none" />
      
      <button 
        onClick={onHome}
        className="text-xl sm:text-2xl font-display font-bold tracking-tighter cursor-pointer flex items-center gap-2 group relative z-10"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-art-orange via-art-pink to-cosmos-purple flex items-center justify-center rounded-lg sm:rounded-xl text-white group-hover:shadow-[0_0_20px_#FF3366] transition-all transform group-hover:rotate-12 font-black">U</div>
        <span className="text-white tracking-widest text-lg sm:text-xl font-black">ART</span>
      </button>
      
      <nav className="hidden md:flex items-center gap-8">
        <button 
          onClick={onCatalog}
          className="text-[12px] font-bold text-white/60 uppercase tracking-widest hover:text-cosmos-cyan transition-colors"
        >
          Katalog
        </button>
        <button 
          onClick={onGallery}
          className="text-[12px] font-bold text-white/60 uppercase tracking-widest hover:text-cosmos-cyan transition-colors"
        >
          Galereya
        </button>
        <button 
          onClick={onOrders}
          className="text-[12px] font-bold text-white/60 uppercase tracking-widest hover:text-cosmos-cyan transition-colors"
        >
          Buyurtmalarim
        </button>
      </nav>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onCart}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all relative"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-art-pink text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
        <button onClick={onMenuToggle} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-all relative z-50">
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[72px] bg-cosmos-void/98 backdrop-blur-3xl z-40 md:hidden flex flex-col p-4 sm:p-6 pb-safe"
          >
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar py-2">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1 px-3">Katalog & Galereya</div>
              {[
                { name: 'Katalog', action: onCatalog, icon: <Layers className="w-5 h-5" />, color: 'text-art-orange', desc: 'Asos tanlash' },
                { name: 'Galereya', action: onGallery, icon: <ImageIcon className="w-5 h-5" />, color: 'text-cosmos-cyan', desc: 'Tayyor dizaynlar' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    onMenuToggle();
                  }}
                  className="flex items-center justify-between p-4 rounded-[22px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 ${item.color} transition-all`}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-base font-display font-black text-white uppercase tracking-tight">{item.name}</div>
                      <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                </button>
              ))}

              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-6 mb-1 px-3">Shaxsiy bo'lim</div>
              {[
                { name: 'Buyurtmalar', action: onOrders, icon: <History className="w-5 h-5" />, color: 'text-art-pink', desc: 'Tarix' },
                { name: 'Savat', action: onCart, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-cosmos-purple', desc: 'Tanlanganlar' }
              ].map((item, idx) => (
                <button
                  key={idx + 2}
                  onClick={() => {
                    item.action();
                    onMenuToggle();
                  }}
                  className="flex items-center justify-between p-4 rounded-[22px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 ${item.color} transition-all`}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-base font-display font-black text-white uppercase tracking-tight">{item.name}</div>
                      <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mt-1">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
            
            <div className="mt-auto pt-6 border-t border-white/5 pb-6">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Uart Studio Social</div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-art-orange opacity-50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-art-pink opacity-50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cosmos-purple opacity-50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 px-1">
                {['Instagram', 'Telegram', 'TikTok'].map(s => (
                  <button key={s} className="py-4 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-all">{s}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </header>
);

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section className="pt-16 sm:pt-24 pb-6 sm:pb-12 px-4 sm:px-10">
    <div className="max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[48px] bg-cosmos-void sm:aspect-[21/9] min-h-[350px] sm:min-h-[500px] flex items-center px-6 sm:px-16 group border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] art-grain">
        <CosmosBackground />
        <div className="absolute inset-0 bg-gradient-to-r from-cosmos-void via-transparent to-transparent z-[1]" />
        <img 
          src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=60&w=1200" 
          alt="Abstract Art" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-[5s]"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
        />
        <div className="relative z-10 max-w-2xl py-10 sm:py-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block px-4 py-1.5 bg-cosmos-purple/20 border border-cosmos-purple/30 backdrop-blur-md text-cosmos-cyan text-[10px] font-bold uppercase tracking-[0.3em] mb-4 sm:mb-6 rounded-full"
          >
            Digital San'at Studiyasi
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl xs:text-5xl sm:text-7xl md:text-9xl font-display font-black text-white mb-4 sm:mb-6 leading-[0.9] tracking-tighter"
          >
            Sizning <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-art-orange via-art-pink via-cosmos-purple to-art-lime animate-flow bg-[length:200%_auto]">SAN'ATINGIZ.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-base sm:text-xl mb-8 sm:mb-12 max-w-lg font-medium leading-relaxed"
          >
            Professional studiyada o'z tasavvuringizni real mahsulotlarga aylantiring. <br className="hidden sm:block" />
            <span className="text-art-lime font-bold">Har bir buyurtma — bu eksklyuziv art.</span>
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onStart}
            className="flow-button px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-3"
          >
            O'z san'atingni yarat
            <Zap className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  </section>
);

interface ProductCardProps {
  product: Product;
  onSelect: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => (
  <motion.div 
    whileHover={{ y: -8, scale: 1.01 }}
    className="group cursor-pointer cosmos-card art-grain p-3 sm:p-5 rounded-2xl sm:rounded-[32px] transition-all h-full flex flex-col relative"
    onClick={() => onSelect(product)}
  >
    <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 mb-3 sm:mb-5 relative border border-white/10 paint-border">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-4 py-1 sm:py-1.5 bg-cosmos-purple/80 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">
        {product.category}
      </div>
    </div>
    <div className="flex-1">
      <h3 className="font-display font-black text-sm sm:text-xl mb-1 sm:mb-2 text-white group-hover:text-cosmos-cyan transition-colors tracking-tight leading-tight">{product.name}</h3>
      <p className="text-white/50 text-[9px] sm:text-[11px] mb-3 sm:mb-4 line-clamp-2 leading-relaxed font-medium tracking-wide uppercase">{product.description}</p>
    </div>
    <div className="flex items-center justify-between pt-3 sm:pt-5 border-t border-white/10">
      <span className="font-display font-black text-sm sm:text-xl text-art-lime">{product.price.toLocaleString()} so'm</span>
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gradient-to-br from-art-pink to-cosmos-purple group-hover:text-white group-hover:rotate-12 transition-all">
        <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    </div>
  </motion.div>
);

// --- Main App ---

type View = 'home' | 'customize' | 'checkout' | 'catalog' | 'gallery' | 'cart' | 'orders';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');

  const navigateTo = (newView: View) => {
    setPreviousView(view);
    setView(newView);
    window.scrollTo(0, 0);
  };
  const [selectedCategory, setSelectedCategory] = useState<Category>('Barchasi');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState<CustomizationSize>('A6/A5');
  const [customType, setCustomType] = useState<CustomizationType>('Graphic/Cartoon');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [perspective, setPerspective] = useState(500);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isTextureEnabled, setIsTextureEnabled] = useState(true);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isPriceRequested, setIsPriceRequested] = useState(false);
  const [priceRequestId, setPriceRequestId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placedOrders, setPlacedOrders] = useState<CompleteOrder[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>(BASE_PRODUCTS);
  const [dbGallery, setDbGallery] = useState<Product[]>(READY_DESIGNS);
  
  // User identification for order history (without login)
  const [customerId] = useState(() => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem('uart_customer_id');
    if (saved) return saved;
    const newId = `CUST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    localStorage.setItem('uart_customer_id', newId);
    return newId;
  });

  // Real-time synchronization for core data
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data() as Product, id: doc.id }));
      if (data.length > 0) setDbProducts(data);
    });
    
    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snap) => {
      const data = snap.docs.map(doc => ({ ...doc.data() as Product, id: doc.id }));
      if (data.length > 0) setDbGallery(data);
    });

    const unsubOrders = onSnapshot(
      query(
        collection(db, 'orders'), 
        where('customerId', '==', customerId)
      ), 
      (snap) => {
        const data = snap.docs.map(doc => ({ ...doc.data() as CompleteOrder, id: doc.id }));
        // Sort manually in memory to avoid index requirement
        const sorted = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setPlacedOrders(sorted);
      }
    );

    return () => {
      unsubProducts();
      unsubGallery();
      unsubOrders();
    };
  }, [customerId]);

  // Real-time synchronization for specific price requests
  useEffect(() => {
    if (!priceRequestId) return;

    const unsubPrice = onSnapshot(doc(db, 'price_requests', priceRequestId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'completed' && data.price) {
          setCustomPrice(data.price);
          setIsPriceRequested(false);
        }
      }
    });

    return () => unsubPrice();
  }, [priceRequestId]);

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (customPrice) return customPrice;
    return selectedProduct.price + SIZE_PRICES[customSize] + TYPE_PRICES[customType];
  }, [selectedProduct, customSize, customType, customPrice]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Barchasi') return dbProducts;
    return dbProducts.filter(p => p.category === selectedCategory);
  }, [selectedCategory, dbProducts]);

  const refreshPriceManually = async () => {
    if (!priceRequestId) return;
    try {
      console.log("Manually refreshing price for:", priceRequestId);
      const snap = await getDoc(doc(db, 'price_requests', priceRequestId));
      if (snap.exists()) {
        const data = snap.data();
        console.log("Doc data received:", data);
        if (data.status === 'completed' && data.price) {
          setCustomPrice(data.price);
          setIsPriceRequested(false);
        }
      }
    } catch (err) {
      console.error("Manual refresh failed:", err);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setUploadedImage(null);
    setIsAiGenerated(false);
    setIsPriceRequested(false);
    setCustomPrice(null);
    setPriceRequestId(null);
    setView('customize');
    window.scrollTo(0, 0);
  };

  const handleGallerySelect = (product: Product) => {
    setSelectedProduct(product);
    setUploadedImage(null);
    setIsAiGenerated(false);
    setIsPriceRequested(false);
    setCustomPrice(null);
    setPriceRequestId(null);
    setView('checkout');
    window.scrollTo(0, 0);
  };

  const [priceRequestError, setPriceRequestError] = useState<string | null>(null);

  const handleRequestPrice = async () => {
    if (!selectedProduct) return;
    setPriceRequestError(null);
    setIsPriceRequested(true);
    
    try {
      // 1. Create Firestore document
      const reqRef = await addDoc(collection(db, 'price_requests'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        size: customSize,
        type: customType,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setPriceRequestId(reqRef.id);
      setCustomPrice(null);

      // 2. Prepare compressed image for Bot
      let botImage = selectedProduct.image;
      if (uploadedImage) {
        try {
          console.log("Compressing image for bot...");
          botImage = await toBase64(uploadedImage);
          // Add data prefix if missing (toBase64 returns raw base64)
          if (!botImage.startsWith('data:')) {
            botImage = 'data:image/jpeg;base64,' + botImage;
          }
        } catch (e) {
          console.error("Compression failed, using original:", e);
          botImage = uploadedImage;
        }
      }

      // 3. Notify Admin Bot
      const response = await fetch('/api/request-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqRef.id,
          productName: selectedProduct.name,
          size: customSize,
          type: customType,
          image: botImage
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      console.log("Price request sent successfully to bot.");
    } catch (err) {
      console.error("Price request failed:", err);
      setPriceRequestError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      // Don't reset isPriceRequested immediately to allow retry or show error
    }
  };

  const handleBack = () => {
    if (view === 'checkout') {
      if (previousView === 'cart' || previousView === 'gallery' || previousView === 'customize') {
        setView(previousView);
      } else {
        setView('home');
      }
    } else if (view === 'customize') {
      setView('home');
    } else {
      setView('home');
    }
    window.scrollTo(0, 0);
  };

  const handleOrder = () => {
    if (!selectedProduct) return;
    
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      product: selectedProduct,
      customSize,
      customType,
      uploadedImage,
      totalPrice,
    };
    
    setCart(prev => [...prev, newItem]);
    setView('cart');
    window.scrollTo(0, 0);
  };

  const handleFinalConfirm = async () => {
    if (isOrderSubmitting) return;
    const orderItems = cart.length > 0 ? cart : (selectedProduct ? [{
      id: Math.random().toString(36).substr(2, 9),
      product: selectedProduct,
      customSize,
      customType,
      uploadedImage,
      totalPrice,
    }] : []);

    if (orderItems.length === 0) return;
    setIsOrderSubmitting(true);
    
    const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newOrder: CompleteOrder = {
      id: orderId,
      customerId,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
      date: new Date().toLocaleDateString('uz-UZ'),
      status: 'Kutilmoqda',
      customerName,
      customerPhone,
      receiptImage
    };

    try {
      await setDoc(doc(db, 'orders', orderId), {
        ...newOrder,
        createdAt: new Date().toISOString(),
      });
      
      // Notify Admin via Bot
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(e => console.error("Notification failed:", e));
      
      setCart([]);
      setReceiptImage(null);
      setCustomerName('');
      setCustomerPhone('');
      setShowSuccess(true);
    } catch (err) {
      console.error("Order error:", err);
      alert("Xatolik yuz berdi");
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;
    
    setIsRemovingBg(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = uploadedImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple threshold-based white/light-gray background removal
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 235 && g > 235 && b > 235) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const output = await compressImage(canvas.toDataURL('image/png'));
      setUploadedImage(output);
    } catch (error) {
      console.error("Background removal failed:", error);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleAIRemix = async () => {
    if (!selectedProduct || !uploadedImage) return;
    
    setIsGeneratingAI(true);
    try {
      const base64Product = await toBase64(selectedProduct.image);
      let base64Design = uploadedImage;
      if (uploadedImage.startsWith('data:')) {
        base64Design = uploadedImage.split(',')[1];
      } else {
        base64Design = await toBase64(uploadedImage);
      }

      // Restore to the user's requested prompt text
      const prompt_text = "Combine the style of image1 and the subject of image2 into a new creative design.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt_text },
            { inlineData: { data: base64Product, mimeType: 'image/jpeg' } },
            { inlineData: { data: base64Design, mimeType: 'image/png' } },
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const rawImage = `data:image/png;base64,${part.inlineData.data}`;
            const compressed = await compressImage(rawImage);
            setUploadedImage(compressed);
            setIsAiGenerated(true);
            // Reset price status for new creative work
            setIsPriceRequested(false);
            setCustomPrice(null);
            setPriceRequestId(null);
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI rasm yarata olmadi. API key yoki rasm hajmini tekshiring.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetApp = () => {
    setView('home');
    setSelectedProduct(null);
    setCustomSize('A6/A5');
    setCustomType('Text/Logo');
    setUploadedImage(null);
    setIsAiGenerated(false);
    setIsPriceRequested(false);
    setCustomPrice(null);
    setPriceRequestId(null);
    setScale(1);
    setRotation(0);
    setPerspective(500);
    setRotateX(0);
    setRotateY(0);
    setIsTextureEnabled(true);
    setShowSuccess(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen font-sans bg-cosmos-deep text-white pb-20 sm:pb-0 relative overflow-hidden">
      <CosmosBackground />
      <div className="relative z-10">
        <Header 
          onHome={resetApp} 
          onCatalog={() => navigateTo('catalog')}
          onGallery={() => navigateTo('gallery')}
          onOrders={() => navigateTo('orders')}
          onCart={() => navigateTo('cart')}
          cartCount={cart.length}
          onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          showMobileMenu={showMobileMenu}
        />

        <main className="section-gap">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="section-gap"
            >
              <Hero onStart={() => {
                setSelectedProduct(dbProducts[0]);
                setView('customize');
                window.scrollTo(0, 0);
              }} />

              {/* Products Section */}
              <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-10 pb-8 sm:pb-16 relative">
                <div className="flex items-center justify-between mb-4 sm:mb-10">
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tighter uppercase leading-tight">Katalog</h2>
                    <p className="text-white/40 text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-0.5 sm:mt-1">Sizning asosingiz</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setView('catalog')}
                      className="text-[9px] sm:text-[10px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Barchasini ko'rish
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-10">
                  {filteredProducts.slice(0, 4).map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard 
                        product={product} 
                        onSelect={handleProductSelect} 
                      />
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Ready Designs Section (Classic Presentation) */}
              <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-10 pb-16 sm:pb-32">
                <div className="cosmos-card rounded-[24px] sm:rounded-[40px] p-5 sm:p-16 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cosmos-purple/10 nebula -translate-y-1/2 translate-x-1/2" />
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-16 gap-4 sm:gap-8 relative z-10">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tighter uppercase leading-tight">Tayyor To'plamlar</h2>
                      <p className="text-white/50 text-[9px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-2">Professional rassomlar ijodi</p>
                    </div>
                    <button 
                      onClick={() => setView('gallery')}
                      className="flow-button px-6 sm:px-10 py-2.5 sm:py-4 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-widest w-full sm:w-auto"
                    >
                      Barchasini ko'rish
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-8 relative z-10">
                    {dbGallery.slice(0, 2).map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onSelect={handleGallerySelect} 
                      />
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {view === 'catalog' && (
            <motion.div 
              key="catalog-view"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="pt-16 sm:pt-24 min-h-screen px-4 sm:px-10 pb-16 sm:pb-32"
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6 sm:mb-16">
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <h1 className="text-xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">Mahsulotlar</h1>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3 sm:gap-6 pb-6 sm:pb-12 overflow-x-auto no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat as Category)}
                      className={`px-4 sm:px-10 py-2 sm:py-4 rounded-lg sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] whitespace-nowrap transition-all border relative overflow-hidden group ${
                        selectedCategory === cat 
                          ? 'bg-white/10 text-white border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                          : 'bg-white/5 text-white/30 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="relative z-10">{cat}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={handleProductSelect} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div 
              key="gallery-view"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="pt-16 sm:pt-24 min-h-screen px-4 sm:px-10 pb-16 sm:pb-32"
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6 sm:mb-16">
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <h1 className="text-xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">Galereya</h1>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-10">
                  {dbGallery.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onSelect={handleGallerySelect} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div 
              key="cart-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="pt-20 sm:pt-24 min-h-screen px-4 sm:px-10 pb-20 sm:pb-32"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 sm:mb-16">
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <h1 className="text-2xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">Savat</h1>
                </div>

                {cart.length === 0 ? (
                  <div className="cosmos-card rounded-[32px] sm:rounded-[48px] p-10 sm:p-20 text-center flex flex-col items-center gap-6 border border-white/5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <ShoppingBasket className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 uppercase">Savatingiz bo'sh</h2>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">San'at asarlarini yaratishni hoziroq boshlang</p>
                    </div>
                    <button 
                      onClick={() => setView('catalog')}
                      className="flow-button px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest"
                    >
                      Katalogni ko'rish
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {cart.map(item => (
                      <motion.div 
                        layout 
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cosmos-card rounded-2xl sm:rounded-[32px] p-4 sm:p-8 flex items-center gap-4 sm:gap-10 border border-white/5 relative group"
                      >
                        <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                          <img src={item.uploadedImage || item.product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1 sm:mb-2">
                            <h3 className="text-sm sm:text-lg lg:text-xl font-display font-black text-white uppercase tracking-tight leading-tight">{item.product.name}</h3>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/5 rounded-full border border-white/10 text-white/40">{item.customSize}</span>
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/5 rounded-full border border-white/10 text-white/40">{item.customType}</span>
                          </div>
                          <div className="text-lg sm:text-2xl font-display font-black text-art-lime">{item.totalPrice.toLocaleString()} so'm</div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="cosmos-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 mt-8 sm:mt-12 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                      <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Jami summa:</div>
                        <div className="text-2xl sm:text-4xl font-display font-black text-white uppercase tracking-tighter">
                          {cart.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()} so'm
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedProduct(cart[0].product);
                          setView('checkout');
                        }}
                        className="w-full py-5 sm:py-6 flow-button text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-sm uppercase tracking-[0.3em] shadow-2xl"
                      >
                        Buyurtmani tasdiqlash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'orders' && (
            <motion.div 
              key="orders-view"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="pt-20 sm:pt-24 min-h-screen px-4 sm:px-10 pb-20 sm:pb-32"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 sm:mb-16">
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <h1 className="text-2xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter">Buyurtmalarim</h1>
                </div>

                {placedOrders.length === 0 ? (
                  <div className="cosmos-card rounded-[32px] sm:rounded-[48px] p-10 sm:p-20 text-center flex flex-col items-center gap-4 sm:gap-6 border border-white/5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <History className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 uppercase">Buyurtmalar mavjud emas</h2>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Siz hali birorta ham buyurtma bermadingiz</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {placedOrders.map(order => (
                      <div key={order.id} className="cosmos-card rounded-2xl sm:rounded-[40px] overflow-hidden border border-white/5 group">
                        <div className="p-5 sm:p-10 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 sm:gap-6 bg-white/[0.02]">
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">ID: {order.id}</div>
                            <div className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-tight">{order.date}</div>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                             <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-cosmos-cyan text-cosmos-void text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(0,242,255,0.2)] whitespace-nowrap">
                               {order.status}
                             </div>
                             <div className="text-lg sm:text-xl font-display font-black text-art-lime">{order.totalAmount.toLocaleString()} so'm</div>
                          </div>
                        </div>
                        <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                           {order.items.map(item => (
                             <div key={item.id} className="flex items-center gap-4 sm:gap-6">
                               <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                 <img src={item.uploadedImage || item.product.image} loading="lazy" className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1">
                                 <div className="text-[11px] sm:text-xs font-black text-white uppercase tracking-tight mb-0.5 sm:mb-1">{item.product.name}</div>
                                 <div className="text-[7px] sm:text-[8px] font-bold text-white/30 uppercase tracking-widest">{item.customSize} // {item.customType}</div>
                               </div>
                               <div className="text-[12px] sm:text-sm font-black text-white/80">{item.totalPrice.toLocaleString()} so'm</div>
                             </div>
                           ))}
                        </div>
                        <div className="px-5 py-4 sm:px-8 sm:py-6 bg-white/[0.01] flex items-center justify-center border-t border-white/5">
                           <button className="text-[9px] sm:text-[10px] font-black text-white/30 hover:text-cosmos-cyan uppercase tracking-[0.3em] transition-all">Qayta buyurtma berish</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'customize' && selectedProduct && (
            <motion.div 
              key="customize"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="pt-16 sm:pt-24 min-h-screen px-4 sm:px-10 pb-20 relative"
            >
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-6 sm:mb-12">
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <h1 className="text-lg sm:text-4xl font-display font-black tracking-tighter uppercase text-white">
                    ART <span className="text-transparent bg-clip-text bg-gradient-to-r from-art-orange to-art-pink">STUDIYA</span>
                  </h1>
                  <div className="w-16 h-1 bg-gradient-to-r from-art-pink to-cosmos-purple hidden sm:block rounded-full" />
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-12">
                  {/* Right: The Visualizer (Moved to top on mobile) */}
                  <div className="order-1 lg:order-2 lg:col-span-8">
                    <div className="cosmos-card rounded-[32px] sm:rounded-[56px] lg:min-h-[700px] min-h-[300px] sm:min-h-[500px] relative overflow-hidden flex items-center justify-center p-3 sm:p-12 art-grain border border-white/10 shadow-2xl">
                      <div className="absolute inset-0 bg-cosmos-void">
                        <CosmosBackground />
                        <div className="absolute inset-0 bg-gradient-to-t from-cosmos-void/60 via-transparent to-cosmos-void/20" />
                      </div>
                      
                      {/* Decorative Studio Marks */}
                      <div className="absolute bottom-4 right-6 sm:bottom-10 sm:right-10 flex items-center gap-4 text-white/10 hidden sm:flex">
                        <div className="w-8 sm:w-12 h-[1px] bg-white/10" />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Studio Edition</span>
                      </div>
                      <div className="absolute top-3 left-4 sm:top-8 sm:left-10 z-10">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex gap-1">
                            {['bg-art-orange', 'bg-art-pink', 'bg-cosmos-purple'].map(c => (
                              <div key={c} className={`w-1 h-1 sm:w-2.5 sm:h-2.5 ${c} rounded-full shadow-[0_0_8px_currentColor]`} />
                            ))}
                          </div>
                          <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                            {isAiGenerated ? 'AI // Master' : 'Live Preview'}
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-8 left-10 z-10 opacity-10 hidden lg:block">
                        <ImageIcon className="w-12 h-12 text-cosmos-purple" />
                      </div>
                      <div className="absolute top-8 right-10 z-10 opacity-10 hidden lg:block">
                        <Zap className="w-12 h-12 text-cosmos-cyan" />
                      </div>

                      <AnimatePresence mode="wait">
                        {isGeneratingAI ? (
                          <motion.div 
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center gap-6 sm:gap-10 relative z-10"
                          >
                             <div className="relative">
                               <motion.div 
                                 animate={{ x: [0, 15, 0], scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
                                 transition={{ duration: 4, repeat: Infinity }}
                                 className="w-40 h-40 sm:w-56 sm:h-56 bg-white/5 border border-white/20 rounded-[24px] sm:rounded-[32px] overflow-hidden backdrop-blur-xl relative z-10 flex items-center justify-center p-4 sm:p-6"
                               >
                                 <img src={selectedProduct.image} className="w-full h-full object-contain opacity-30 grayscale" />
                               </motion.div>
                               <motion.div 
                                 animate={{ x: [0, -15, 0], scale: [1.1, 1, 1.1], rotate: [2, -2, 2] }}
                                 transition={{ duration: 4, repeat: Infinity }}
                                 className="absolute -top-3 -left-3 sm:-top-4 -left-4 w-40 h-40 sm:w-56 sm:h-56 bg-cosmos-purple/10 border border-cosmos-purple/20 rounded-[24px] sm:rounded-[32px] z-0 flex items-center justify-center"
                               >
                                 <Sparkles className="w-16 h-16 sm:w-24 sm:h-24 text-cosmos-purple animate-pulse" />
                               </motion.div>
                             </div>
                             <div className="text-center space-y-2 sm:space-y-3">
                               <div className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.3em] sm:tracking-[0.4em] animate-pulse">San'at asari yaratilmoqda</div>
                               <div className="text-[9px] sm:text-[10px] font-bold text-cosmos-cyan uppercase tracking-[0.2em] opacity-80">AI dizayn shakllanmoqda...</div>
                             </div>
                          </motion.div>
                        ) : isAiGenerated && uploadedImage ? (
                          <motion.div 
                            key="ai-result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full h-full flex items-center justify-center z-10"
                          >
                            <div className="relative max-w-sm sm:max-w-xl w-full aspect-square bg-white/5 border border-white/20 rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-md p-6 sm:p-10">
                              <img src={uploadedImage} alt="AI Result" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
                              <div className="absolute top-4 right-4 sm:top-6 sm:right-8 bg-gradient-to-r from-cosmos-purple to-cosmos-cyan text-white px-3 py-1 sm:px-4 sm:py-1.5 font-black text-[8px] sm:text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                                Final Art Edition
                              </div>
                            </div>
                          </motion.div>
                        ) : uploadedImage ? (
                          <motion.div 
                            key="pre-ai-preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 w-full max-w-3xl relative z-10"
                          >
                            <div className="flex-1 w-full max-w-[200px] sm:max-w-none space-y-2 sm:space-y-4">
                              <div className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Tuzilma</div>
                              <div className="aspect-square bg-white/5 border border-white/20 rounded-[24px] sm:rounded-[32px] overflow-hidden p-4 sm:p-8 backdrop-blur-md">
                                <img src={selectedProduct.image} alt="Base" className="w-full h-full object-contain opacity-60" />
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                               <Plus className="w-6 h-6 sm:w-10 sm:h-10 text-white/40 animate-pulse" />
                            </div>
                            <div className="flex-1 w-full max-w-[200px] sm:max-w-none space-y-2 sm:space-y-4">
                              <div className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Tasavvur</div>
                              <div className="aspect-square bg-white/5 border border-white/20 rounded-[24px] sm:rounded-[32px] overflow-hidden p-4 sm:p-8 backdrop-blur-md">
                                <img src={uploadedImage} alt="Upload" className="w-full h-full object-contain" />
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative max-w-[280px] sm:max-w-lg w-full aspect-square z-10"
                          >
                            <img 
                              src={selectedProduct.image} 
                              alt="Product" 
                              className="w-full h-full object-contain animate-float drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)]"
                            />
                            <div className="absolute inset-0 bg-radial-gradient from-cosmos-purple/10 to-transparent pointer-events-none" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Left Controls (Stay at bottom on mobile, now order-2) */}
                  <div className="order-2 lg:order-1 lg:col-span-4 space-y-6 sm:space-y-8 pb-10 sm:pb-0">
                    {/* Block 1: Product Selection */}
                    <div className="cosmos-card rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 border border-white/5 art-grain relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-art-lime/5 blur-[40px] rounded-full pointer-events-none" />
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Box className="w-3.5 h-3.5 text-art-orange" /> 01. Asos
                        </div>
                        <button 
                          onClick={() => setView('catalog')}
                          className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors"
                        >
                          Barchasi
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {BASE_PRODUCTS.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsPriceRequested(false);
                              setCustomPrice(null);
                              setPriceRequestId(null);
                            }}
                            className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all p-1 group relative ${
                              selectedProduct.id === p.id 
                                ? 'border-art-orange shadow-[0_0_15px_rgba(255,102,0,0.3)]' 
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg sm:rounded-xl" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Block 2: Design Assets */}
                    <div className="cosmos-card rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 border border-white/5 art-grain relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-art-pink/5 blur-[40px] rounded-full pointer-events-none" />
                      <div className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-art-pink" /> 02. Grafika
                      </div>
                      {!uploadedImage ? (
                        <label className="w-full aspect-[2/1] sm:aspect-video rounded-[20px] sm:rounded-[24px] border-2 border-dashed border-white/10 bg-white/5 hover:border-art-pink cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-art-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white/20 group-hover:text-art-pink transition-all z-10" />
                          <span className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.2em] z-10">Rasm yuklash</span>
                          <input 
                            type="file" className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                              const compressed = await compressImage(file);
                              setUploadedImage(compressed);
                                  setIsAiGenerated(false);
                                  setIsPriceRequested(false);
                                  setCustomPrice(null);
                                  setPriceRequestId(null);
                                } catch (err) {
                                  console.error("Image compression failed:", err);
                                  alert("Rasmni yuklashda xatolik yuz berdi");
                                }
                              }
                            }}
                          />
                        </label>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative aspect-[2/1] sm:aspect-video rounded-[16px] sm:rounded-[20px] overflow-hidden bg-white/5 border border-white/10">
                            <img src={uploadedImage} alt="User design" className="w-full h-full object-contain" />
                            <button 
                              onClick={() => {
                                setUploadedImage(null);
                                setIsAiGenerated(false);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-cosmos-void/80 text-white rounded-full hover:bg-red-500 transition-colors backdrop-blur-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                             <button
                               onClick={handleRemoveBackground}
                               disabled={isRemovingBg}
                               className="py-3 bg-white/5 text-white/60 rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest border border-white/10 transition-all disabled:opacity-50 hover:bg-white/10 hover:text-white"
                             >
                               {isRemovingBg ? '...' : 'Fonni olib tashlash'}
                             </button>
                             <button
                               onClick={handleAIRemix}
                               disabled={isGeneratingAI}
                               className="py-3 bg-cosmos-purple text-white rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest hover:shadow-[0_0_15px_rgba(176,38,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                             >
                               {isGeneratingAI ? <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 className="w-2.5 h-2.5" />}
                               AI Remix
                             </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop Price & Action */}
                    <div className="cosmos-card rounded-[32px] p-8 border border-white/5 art-grain hidden sm:block">
                      {!isAiGenerated ? (
                        <div className="text-center py-6">
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 font-display">Studiyada ishni davom ettiring</div>
                          <div className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                            {uploadedImage 
                              ? "Narxni bilish uchun AI Remix orqali dizaynni yakunlang" 
                              : "Narxni bilish uchun rasm yuklang va AI Remix qiling"}
                          </div>
                        </div>
                      ) : !customPrice ? (
                        <div className="space-y-4">
                          <button 
                            className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 ${
                              isPriceRequested
                                ? 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed' 
                                : 'flow-button text-white shadow-[0_10px_30px_rgba(255,51,102,0.3)]'
                            }`}
                            onClick={handleRequestPrice}
                            disabled={isPriceRequested}
                          >
                            {isPriceRequested ? (
                              <>
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                Narx kutilmoqda...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 text-art-orange" />
                                Dizayn narxini bilish
                              </>
                            )}
                          </button>
                          
                          {isPriceRequested && (
                            <button 
                              onClick={refreshPriceManually}
                              className="w-full py-2 text-[10px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <RefreshCcw className="w-3 h-3" />
                              Hozir tekshirish
                            </button>
                          )}
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-art-orange/10 border border-art-orange/20 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tasdiqlangan narx:</span>
                            <span className="text-xl font-display font-black text-art-orange">{customPrice.toLocaleString()} so'm</span>
                          </div>
                          <button 
                            onClick={handleOrder}
                            className="w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 bg-art-lime text-black hover:bg-white hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(200,255,0,0.2)]"
                          >
                            <ShoppingBag className="w-5 h-5" />
                            Savatga qo'shish
                          </button>
                        </motion.div>
                      )}
                      
                      {priceRequestError && (
                        <p className="text-[9px] text-red-500 font-black uppercase text-center mt-4 animate-pulse">
                          {priceRequestError}
                        </p>
                      )}
                    </div>
                </div>
              </div>
            </div>

              {/* Mobile Order Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-cosmos-void/80 backdrop-blur-3xl border-t border-white/10 p-5 lg:hidden z-50 rounded-t-[32px] art-grain">
                {!isAiGenerated ? (
                  <div className="w-full text-center py-2">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] animate-pulse">
                      {uploadedImage ? "AI Remix orqali yakunlang" : "Dizayn yaratishni boshlang"}
                    </div>
                  </div>
                ) : !customPrice ? (
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={handleRequestPrice}
                      disabled={isPriceRequested}
                      className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl ${
                        isPriceRequested
                            ? 'bg-white/10 text-white/30 border border-white/5'
                            : 'flow-button text-white shadow-[0_10px_30px_rgba(255,51,102,0.3)]'
                      }`}
                    >
                      {isPriceRequested ? 'Narxi kutilmoqda...' : 'Dizayn Narxini Bilish'}
                    </button>
                    
                    {isPriceRequested && (
                      <button 
                        onClick={refreshPriceManually}
                        className="w-full py-1 text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Tekshirish
                      </button>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex gap-3 w-full"
                  >
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 flex flex-col justify-center">
                       <span className="text-white/40 text-[8px] uppercase font-black">Narx:</span>
                       <span className="text-art-orange text-sm font-display font-black line-clamp-1">{customPrice.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={handleOrder}
                      className="flex-[2] py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl bg-art-lime text-black shadow-[0_10px_30px_rgba(200,255,0,0.2)]"
                    >
                      Savatga qo'shish
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'checkout' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="pt-16 sm:pt-24 min-h-screen px-3 sm:px-4 pb-20 flex items-start sm:items-center justify-center p-2 sm:p-4 relative z-50"
            >
              <div className="w-full max-w-2xl cosmos-card rounded-[28px] sm:rounded-[48px] overflow-hidden group border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                <div className="p-5 sm:p-12 md:p-16">
                  <div className="flex items-center justify-between mb-6 sm:mb-16">
                    <div>
                      <h1 className="text-2xl sm:text-5xl font-display font-black text-white uppercase tracking-tighter mb-1 sm:mb-2">Tasdiqlash</h1>
                      <div className="w-12 sm:w-20 h-1 sm:h-1.5 bg-gradient-to-r from-art-orange to-art-pink rounded-full" />
                    </div>
                    <button onClick={handleBack} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white group">
                      <X className="w-5 h-5 sm:w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-16">
                    {/* Cart Items Summary */}
                    {(cart.length > 0 ? cart : (selectedProduct ? [{
                      id: 'direct',
                      product: selectedProduct,
                      customSize,
                      customType,
                      uploadedImage,
                      totalPrice
                    }] : [])).map((item, idx) => (
                      <div key={item.id + idx} className="flex items-center gap-3 sm:gap-6 p-3 sm:p-5 bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] hover:border-white/20 transition-all art-grain">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 p-0.5 sm:p-1">
                          <img src={item.uploadedImage || item.product.image} className="w-full h-full object-cover rounded-md sm:rounded-lg" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-black text-[11px] sm:text-lg text-white leading-tight uppercase tracking-tight">{item.product.name}</h4>
                          <p className="text-[8px] sm:text-[9px] font-bold text-cosmos-purple/80 uppercase tracking-widest">{item.customSize} • {item.customType}</p>
                        </div>
                        <div className="font-display font-black text-xs sm:text-lg text-cosmos-cyan">{item.totalPrice.toLocaleString()} so'm</div>
                      </div>
                    ))}

                    <div className="pt-5 sm:pt-8 mt-2 sm:mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                      <span className="text-xs sm:text-xl font-display font-black text-white/40 uppercase tracking-tighter">Jami: {(cart.length > 0 ? cart.length : 1)} ta</span>
                      <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
                        <span className="text-3xl sm:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-art-orange via-art-pink to-cosmos-purple tracking-tighter">
                          {(cart.length > 0 ? cart.reduce((sum, i) => sum + i.totalPrice, 0) : totalPrice).toLocaleString()} so'm
                        </span>
                        <p className="text-[8px] sm:text-[10px] text-art-lime uppercase font-black tracking-widest mt-1 sm:mt-2 animate-pulse">* To'lovdan so'ng buyurtma qabul qilinadi</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cosmos-void/60 border border-white/10 p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] mb-5 sm:mb-8 relative overflow-hidden">
                    <h3 className="font-display font-black text-[11px] sm:text-lg text-white uppercase tracking-widest mb-4 sm:mb-6">Bog'lanish</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">F.I.SH</label>
                        <input 
                          type="text" 
                          placeholder="Ism"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl text-white text-xs placeholder:text-white/20 focus:border-cosmos-cyan outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">Telefon</label>
                        <input 
                          type="tel" 
                          placeholder="+998"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 p-3 sm:p-4 rounded-xl text-white text-xs placeholder:text-white/20 focus:border-cosmos-cyan outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-cosmos-void/60 border border-white/10 p-5 sm:p-10 rounded-[24px] sm:rounded-[40px] mb-5 sm:mb-12 relative overflow-hidden group/payment">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cosmos-cyan/5 nebula -translate-y-1/2 translate-x-1/2" />
                     <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cosmos-cyan/20 rounded-full flex items-center justify-center text-cosmos-cyan">
                         <CreditCard className="w-4 h-4 sm:w-5 h-5" />
                       </div>
                       <h3 className="font-display font-black text-[11px] sm:text-lg text-white uppercase tracking-widest">To'lov</h3>
                     </div>
                     
                     <div className="text-[10px] sm:text-sm font-bold text-white/40 leading-relaxed mb-4 sm:mb-6">
                       Karta raqamiga o'tkazma qiling:
                     </div>
                     
                     <div className="space-y-3 sm:space-y-4">
                       <div className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex items-center justify-between group-hover/payment:border-cosmos-cyan transition-all relative">
                         <code className="font-mono font-black text-cosmos-cyan text-sm sm:text-2xl select-all tracking-wider">8600 1234 5678 9012</code>
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText('8600123456789012');
                             alert('Ko\'chirildi!');
                           }}
                           className="p-1.5 sm:p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                         >
                           <Copy className="w-3.5 h-3.5 sm:w-5 h-5" />
                         </button>
                       </div>
                       <div className="flex items-center justify-between px-1">
                         <div className="text-[8px] sm:text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">Ilyosbek Nizomov</div>
                         <div className="text-[8px] sm:text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">Humo / UzCard</div>
                       </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="cursor-pointer relative group">
                      <input 
                        type="file" className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file);
                              setReceiptImage(compressed);
                            } catch (err) {
                              console.error("Receipt compression failed:", err);
                              alert("Rasmni yuklashda xatolik yuz berdi");
                            }
                          }
                        }}
                      />
                      <div className={`py-5 border flex items-center justify-center gap-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${receiptImage ? 'bg-art-lime/20 border-art-lime text-art-lime' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                        {receiptImage ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {receiptImage ? 'Chek yuklandi' : 'Chekni yuklash'}
                      </div>
                    </label>
                    <button 
                      onClick={handleFinalConfirm}
                      disabled={!receiptImage || !customerName || !customerPhone || isOrderSubmitting}
                      className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${receiptImage && customerName && customerPhone && !isOrderSubmitting ? 'flow-button text-white shadow-[0_20px_40px_rgba(255,51,102,0.3)]' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
                    >
                      {isOrderSubmitting ? 'Yuborilmoqda...' : 'Buyurtmani yakunlash'}
                    </button>
                  </div>
                  {!receiptImage && (
                    <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-6 leading-relaxed">
                      Buyurtmani tasdiqlash uchun chek rasmini yuklash shart.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cosmos-void/90 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="cosmos-card rounded-[48px] p-12 max-w-[480px] w-full text-center relative border border-white/10 art-grain"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-art-orange via-art-pink to-cosmos-purple rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_40px_rgba(255,51,102,0.4)]">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-display font-black mb-4 text-white uppercase tracking-tighter">Muvaffaqiyatli!</h2>
              <p className="text-white/50 text-[10px] font-black mb-10 leading-relaxed uppercase tracking-[0.3em]">
                San'at asaringiz navbatga qo'shildi. Yaqin daqiqalarda siz bilan bog'lanamiz.
              </p>
              <button 
                onClick={resetApp}
                className="w-full flow-button text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Bosh sahifaga qaytish
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="pt-32 pb-16 px-4 relative overflow-hidden">
        {/* Footer Splatter */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cosmos-purple/5 blur-[100px] -z-10" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-art-orange/5 blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 items-center border-t border-white/5 pt-16 relative">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 text-white group cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-art-orange via-art-pink to-cosmos-purple flex items-center justify-center rounded-[20px] text-white shadow-lg transform group-hover:rotate-[360deg] transition-transform duration-1000">U</div>
              <span className="tracking-[0.4em] font-black">ART</span>
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed max-w-[250px] text-center md:text-left">
              Uslubingizni jahon bo'ylab tarqating. UART — bu erkinlik studiyasi.
            </p>
          </div>
          
          <div className="flex justify-center gap-12">
            {['Instagram', 'Telegram', 'TikTok'].map(social => (
              <button key={social} className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-art-pink hover:-translate-y-1 transition-all">
                {social}
              </button>
            ))}
          </div>
          
          <div className="text-center md:text-right">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
              &copy; 2026 UART STUDIO <br />
              CREATED WITHIN THE ART STUDIO
            </div>
            <div className="mt-4 flex justify-center md:justify-end">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/artist/50/50" alt="Artist" className="w-full h-full object-cover grayscale opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
