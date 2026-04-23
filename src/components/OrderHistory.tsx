import React from 'react';
import { motion } from 'motion/react';
import { History, ArrowLeft, ChevronRight } from 'lucide-react';
import { CompleteOrder } from '../types';

interface OrderHistoryProps {
  placedOrders: CompleteOrder[];
  onBack: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ placedOrders, onBack }) => {
  return (
    <motion.div 
      key="orders-view"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="pt-20 sm:pt-24 min-h-screen px-4 sm:px-10 pb-20 sm:pb-32"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 sm:mb-16">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors">
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
  );
};

export default OrderHistory;
