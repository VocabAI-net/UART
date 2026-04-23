import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const CosmosBackground = React.memo(() => {
  const [isMobile, setIsMobile] = useState(true);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cosmos-void">
        <div className="absolute inset-0 starfield opacity-10" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cosmos-void">
      <div className="absolute inset-0 starfield opacity-20 will-change-transform" />
      <div className="absolute inset-0 art-grain opacity-5 sm:opacity-10" />
      
      <div className="splatter splatter-orange top-[5%] left-[5%] w-[300px] h-[300px] animate-float will-change-transform" />
      <div className="splatter splatter-pink top-[35%] right-[10%] w-[250px] h-[250px] animate-float will-change-transform" style={{ animationDelay: '2s' }} />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.08, 0.03],
        }}
        transition={{ duration: 25, repeat: Infinity }}
        className="absolute top-[-10%] left-[-5%] w-[100%] h-[100%] bg-cosmos-purple/10 nebula blur-[60px] will-change-transform"
      />
    </div>
  );
});

export default CosmosBackground;
