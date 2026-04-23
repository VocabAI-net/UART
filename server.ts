import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Telegraf, Markup } from "telegraf";
import { initializeApp as initializeClient } from "firebase/app";
import { getFirestore as getClientFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs, initializeFirestore, terminate, deleteDoc, addDoc, limit, orderBy, writeBatch } from "firebase/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import sharp from "sharp";

// Helper to download and compress images from Telegram
async function compressTelegramPhoto(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  const compressedBuffer = await sharp(Buffer.from(buffer))
    .resize(600, null, { withoutEnlargement: true })
    .jpeg({ quality: 50 })
    .toBuffer();
    
  return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Client (Optimized for Server-side Node usage)
const clientApp = initializeClient(firebaseConfig);
const clientDb = initializeFirestore(clientApp, {
  localCache: undefined 
}, firebaseConfig.firestoreDatabaseId);

// Global DB alias for the bot commands to use Client SDK
const db = clientDb;

// Telegram Bot Setup
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

// Admin Session State for Wizard
const adminSession: {
  [chatId: string]: {
    step: 'PHOTO' | 'NAME' | 'PRICE',
    type: 'KATALOG' | 'GALEREYA',
    image?: string,
    name?: string,
    price?: number
  } | null
} = {};

if (bot) {
  // Middleware to check if user is admin
  const isAdmin = (ctx: any) => {
    return ctx.from.id.toString() === process.env.ADMIN_CHAT_ID;
  };

  // Handler Functions
  const showProducts = async (ctx: any) => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      if (snapshot.empty) return ctx.reply("Mahsulotlar yo'q. Qo'shish uchun: /qosh_katalog");
      
      ctx.reply("Katalogdagi mahsulotlar:");
      for (const d of snapshot.docs) {
        const data = d.data();
        await ctx.reply(
          `📦 *${data.name}*\n💰 ${data.price} so'm\n📝 ${data.description?.substring(0, 50)}...`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback("🗑 O'chirish", `ochir_katalog_${d.id}`)]
            ])
          }
        );
      }
    } catch (err) {
      ctx.reply("Xatolik yuz berdi.");
    }
  };

  const showGallery = async (ctx: any) => {
    try {
      const snapshot = await getDocs(collection(db, "gallery"));
      if (snapshot.empty) return ctx.reply("Galereya bo'sh.");
      
      ctx.reply("Galereyadagi dizaynlar:");
      for (const d of snapshot.docs) {
        const data = d.data();
        await ctx.reply(
          `🖼 *${data.name}*\n💰 ${data.price} so'm`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback("🗑 O'chirish", `ochir_galereya_${d.id}`)]
            ])
          }
        );
      }
    } catch (err) {
      ctx.reply("Xatolik.");
    }
  };

  const startAddKatalog = (ctx: any) => {
    adminSession[ctx.chat.id] = { step: 'PHOTO', type: 'KATALOG' };
    ctx.reply("📦 Yangi mahsulot (Katalog) qo'shish:\n\n1-qadam: Mahsulot rasmini yuboring (yoki buni bekor qilish uchun /cancel yozing).");
  };

  const startAddGallery = (ctx: any) => {
    adminSession[ctx.chat.id] = { step: 'PHOTO', type: 'GALEREYA' };
    ctx.reply("🖼 Yangi to'plam (Galereya) qo'shish:\n\n1-qadam: Dizayn rasmini yuboring (yoki buni bekor qilish uchun /cancel yozing).");
  };

  const showOrders = async (ctx: any) => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return ctx.reply("Yangi buyurtmalar yo'q.");
      
      for (const d of snapshot.docs) {
        const data = d.data();
        await ctx.reply(
          `💰 *BUYURTMA: ${data.id}*\n💵 Summa: ${data.totalAmount} so'm\n👤 Mijoz: ${data.customerName}\n📞 Tel: ${data.customerPhone}\n📅 Sana: ${data.date}\n✅ Status: ${data.status}`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback("✅ To'lovni tasdiqlsh", `pay_confirm_${d.id}`)],
              [Markup.button.callback("🗑 O'chirish", `order_delete_${d.id}`)]
            ])
          }
        );
      }
    } catch (err) {
      ctx.reply("Xatolik.");
    }
  };

  bot.start((ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Siz admin emassiz.");
    ctx.reply("Cosmos Art Admin Botiga xush kelibsiz!\n\n/menu - Barcha imkoniyatlar\n/mahsulotlar - Katalog boshqaruvi\n/galereya - Galereya boshqaruvi\n/buyurtmalar - Buyurtmalar va To'lovlar");
  });

  bot.command("menu", (ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply("Admin Paneli:", Markup.keyboard([
      ["📦 Mahsulotlar", "🖼 Galereya"],
      ["💰 Buyurtmalar", "📊 Statistikalar"],
      ["❓ Yordam"]
    ]).resize());
  });

  bot.hears("📦 Mahsulotlar", (ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply("📦 KATALOG BOSHQAРУВИ:", Markup.inlineKeyboard([
      [Markup.button.callback("📜 Ro'yxatni ko'rish", "katalog_list")],
      [Markup.button.callback("➕ Yangi qo'shish", "katalog_add")]
    ]));
  });

  bot.hears("🖼 Galereya", (ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply("🖼 GALEREYA BOSHQAРУВИ:", Markup.inlineKeyboard([
      [Markup.button.callback("📜 Ro'yxatni ko'rish", "galereya_list")],
      [Markup.button.callback("➕ Yangi qo'shish", "galereya_add")]
    ]));
  });

  bot.action("katalog_list", (ctx) => {
    ctx.answerCbQuery();
    return showProducts(ctx);
  });
  
  bot.action("katalog_add", (ctx) => {
    ctx.answerCbQuery();
    return startAddKatalog(ctx);
  });

  bot.action("galereya_list", (ctx) => {
    ctx.answerCbQuery();
    return showGallery(ctx);
  });

  bot.action("galereya_add", (ctx) => {
    ctx.answerCbQuery();
    return startAddGallery(ctx);
  });

  bot.hears("💰 Buyurtmalar", (ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply("💰 BUYURTMALAR BOSHQAРУВИ:", Markup.inlineKeyboard([
      [Markup.button.callback("📑 So'nggi buyurtmalar", "orders_list")]
    ]));
  });

  bot.action("orders_list", (ctx) => {
    ctx.answerCbQuery();
    return showOrders(ctx);
  });

  bot.hears("📊 Statistikalar", async (ctx) => {
    if (!isAdmin(ctx)) return;
    try {
      const pCount = (await getDocs(collection(db, "products"))).size;
      const gCount = (await getDocs(collection(db, "gallery"))).size;
      const oCount = (await getDocs(collection(db, "orders"))).size;
      const pOrders = (await getDocs(query(collection(db, "orders"), where("status", "==", "To'langan")))).size;
      
      ctx.reply(`📊 *Hozirgi Holat:*\n\n📦 Mahsulotlar: ${pCount} ta\n🖼 Galereya: ${gCount} ta\n💰 Jami Buyurtmalar: ${oCount} ta\n✅ To'langan: ${pOrders} ta`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error("Stats failed:", err);
      ctx.reply("Statistikani yuklashda xatolik.");
    }
  });

  bot.hears("❓ Yordam", (ctx) => {
    ctx.reply("Admin buyruqlari:\n/menu - Bosh menyu\n/mahsulotlar - Katalog\n/galereya - Galereya\n/buyurtmalar - Buyurtmalar");
  });

  bot.command("mahsulotlar", (ctx) => isAdmin(ctx) && showProducts(ctx));

  bot.command("qosh_katalog", (ctx) => isAdmin(ctx) && startAddKatalog(ctx));

  bot.command("qosh_galereya", (ctx) => isAdmin(ctx) && startAddGallery(ctx));

  bot.command("cancel", (ctx) => {
    if (!isAdmin(ctx)) return;
    adminSession[ctx.chat.id] = null;
    ctx.reply("❌ Jarayon bekor qilindi.");
  });

  bot.command("buyurtmalar", (ctx) => isAdmin(ctx) && showOrders(ctx));

  bot.command("galereya", (ctx) => isAdmin(ctx) && showGallery(ctx));

  bot.action(/^pay_confirm_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    const id = ctx.match[1];
    
    // DARHOL javob beramiz, shunda Telegramdagi "spinny" (aylanish) yo'qoladi
    await ctx.answerCbQuery("Tasdiqlash boshlandi...").catch(() => {});
    
    console.log(`[Bot] Processing payment for order: ${id}`);
    
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      const docRef = doc(db, "orders", id);
      
      // Firestore ulanishini tiklash uchun retry (qayta urinish) mantiqi
      let snap;
      try {
        snap = await getDoc(docRef);
      } catch (e) {
        console.warn(`[Bot] First getDoc failed for ${id}, retrying...`);
        snap = await getDoc(docRef); // Ikkinchi urinish
      }
      
      if (!snap.exists()) {
        console.error(`[Bot] Order ${id} not found.`);
        return ctx.reply(`❌ Xatolik: Buyurtma (${id}) topilmadi.`);
      }

      const orderData = snap.data();
      if (orderData.status === "To'langan") {
        return ctx.reply("ℹ️ Bu buyurtma allaqachon tasdiqlangan.");
      }

      // Statusni yangilash
      await updateDoc(docRef, { 
        status: "To'langan",
        paidAt: serverTimestamp()
      });
      
      console.log(`[Bot] Order ${id} updated to Paid.`);
      
      // Xabarni tahrirlash (Safe edit)
      try {
        const message = ctx.callbackQuery.message;
        const info = (message as any);
        
        if (info && info.caption) {
          // Agar rasm bo'lsa (caption ishlatiladi)
          await ctx.editMessageCaption(`${info.caption}\n\n✅ *TO'LANGAN*`, { parse_mode: 'Markdown' });
        } else if (info && info.text) {
          // Agar faqat matn bo'lsa
          await ctx.editMessageText(`${info.text}\n\n✅ *TO'LANGAN*`, { parse_mode: 'Markdown' });
        } else {
          await ctx.reply("✅ To'lov muvaffaqiyatli tasdiqlandi!");
        }
      } catch (editError: any) {
        if (!editError.description?.includes("message is not modified")) {
          console.error(`[Bot] Edit message error:`, editError);
          ctx.reply("✅ To'lov tasdiqlandi (lekin xabarni yangilab bo'lmadi).");
        }
      }
      
    } catch (e) {
      console.error(`[Bot] Payment confirmation error for ${id}:`, e);
      // Agar bazada allaqachon o'zgargan bo'lsa-da, nimadir xato bo'lsa:
      ctx.reply("⚠️ Bazada yangilanish bo'lgan bo'lishi mumkin, lekin Telegramdagi operatsiya xato tugadi. Iltimos tekshiring.");
    }
  });

  bot.action(/^order_delete_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    const id = ctx.match[1];
    try {
      await deleteDoc(doc(db, "orders", id));
      await ctx.answerCbQuery("O'chirildi");
      await ctx.deleteMessage();
    } catch (e) {
      ctx.reply("Xatolik.");
    }
  });

  bot.action(/^ochir_katalog_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    const id = ctx.match[1];
    try {
      await deleteDoc(doc(db, "products", id));
      await ctx.answerCbQuery("Mahsulot o'chirildi.");
      await ctx.editMessageText("✅ Mahsulot o'chirildi.");
    } catch (e) {
      ctx.reply("❌ O'chirishda xatolik.");
    }
  });

  bot.action(/^ochir_galereya_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return;
    const id = ctx.match[1];
    try {
      await deleteDoc(doc(db, "gallery", id));
      await ctx.answerCbQuery("O'chirildi.");
      await ctx.editMessageText("✅ O'chirildi.");
    } catch (e) {
      ctx.reply("Xatolik.");
    }
  });

  bot.on("photo", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const session = adminSession[ctx.chat.id];

    if (session && session.step === 'PHOTO') {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const link = await ctx.telegram.getFileLink(photo.file_id);
      
      ctx.reply("⌛ Rasmni qayta ishlash va siqish...");
      try {
        session.image = await compressTelegramPhoto(link.href);
        session.step = 'NAME';
        ctx.reply("✅ Rasm qabul qilindi va optimallashdi.\n\n2-qadam: Mahsulot NOMINI kiriting.");
      } catch (err) {
        console.error("Compression failed:", err);
        ctx.reply("❌ Rasmni siqishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      }
      return;
    }

    ctx.reply("Rasm qabul qilindi. Mahsulot qo'shish uchun avval /qosh_katalog yoki /qosh_galereya buyrug'ini bering.");
  });

  bot.on("text", async (ctx) => {
    if (!isAdmin(ctx)) {
      console.log("Ignored non-admin message from:", ctx.from?.id);
      return;
    }
    
    const chatId = ctx.chat.id;
    const session = adminSession[chatId];
    const text = ctx.message.text;

    // Wizard Flow Logic
    if (session) {
      if (session.step === 'NAME') {
        session.name = text;
        session.step = 'PRICE';
        ctx.reply("✅ Nom saqlandi.\n\n3-qadam: Mahsulot NARXINI kiriting (faqat raqamlar).");
        return;
      }
      
      if (session.step === 'PRICE') {
        const price = parseInt(text.replace(/\D/g, ''));
        if (isNaN(price)) return ctx.reply("Iltimos, faqat raqamlarda narx kiriting!");
        
        session.price = price;
        try {
          const collectionName = session.type === 'KATALOG' ? 'products' : 'gallery';
          await addDoc(collection(db, collectionName), {
            name: session.name,
            price: session.price,
            image: session.image,
            description: "", // Simple flow defaults description
            category: "Kiyim",
            createdAt: new Date().toISOString()
          });
          
          ctx.reply(`✅ Muvaffaqiyatli qo'shildi!\n\nNom: ${session.name}\nNarx: ${session.price.toLocaleString()} so'm\nJoylashuv: ${session.type}`);
          adminSession[chatId] = null;
        } catch (e) {
          ctx.reply("❌ Bazaga saqlashda xatolik yuz berdi.");
          console.error(e);
        }
        return;
      }
    }

    // Existing Price Update Logic (Original code continue here)
    const reply = (ctx.message as any).reply_to_message;

    console.log("Bot received text:", text, "Is reply:", !!reply);

    if (reply) {
      const content = reply.text || reply.caption || "";
      console.log("Reply content:", content);
      
      // Flexible regex to catch ID with or without backticks/markdown
      const idMatch = content.match(/🆔 ID: (?:`)?([a-zA-Z0-9_\-]+)(?:`)?/);
      const requestId = idMatch?.[1];
      const price = parseInt(text.replace(/\D/g, ''));
      
      console.log("Parsed result - RequestId:", requestId, "Price:", price);

      if (requestId && !isNaN(price)) {
          let retryCount = 0;
          const maxRetries = 3;
          
          const performUpdate = async () => {
            try {
              console.log(`[BOT] Updating price for request ${requestId} to ${price} (Attempt ${retryCount + 1})`);
              const docRef = doc(clientDb, "price_requests", requestId);
              
              const snap = await getDoc(docRef);
              if (!snap.exists()) {
                throw new Error(`Price request ${requestId} not found.`);
              }

              await updateDoc(docRef, {
                price: price,
                status: "completed",
                updatedAt: new Date().toISOString()
              });
              
              console.log("[BOT] Successfully updated price request.");
              ctx.reply(`✅ Narx (${price.toLocaleString()} so'm) yuborildi!`);
            } catch (err) {
              if (retryCount < maxRetries && err instanceof Error && (err.message.includes('offline') || err.message.includes('unavailable'))) {
                retryCount++;
                console.warn(`[BOT] Firebase temporary offline, retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                return performUpdate();
              }
              throw err;
            }
          };

          try {
            await performUpdate();
            return;
          } catch (err) {
            console.error(`[BOT] Update failed after retries:`, err);
            const msg = err instanceof Error ? err.message : "Noma'lum xato";
            ctx.reply(`❌ Xatolik: ${msg}\n\n(Firebase ulanishini tekshiring)`);
            return;
          }
      }
 else {
        console.log("Could not find requestId or price in reply.");
      }
    } else {
      // Fallback: If it's just a number and not a reply, try to find the LATEST pending request
      const price = parseInt(text.replace(/\D/g, ''));
      if (!isNaN(price) && text.length < 10) { // Safety check to ensure it's likely just a price
        console.log("Standalone price message detected, searching for latest pending request...");
        try {
          console.log("[BOT] Searching for latest pending requests using Client SDK...");
          const q = query(collection(clientDb, "price_requests"), where("status", "==", "pending"));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const docs = snapshot.docs.sort((a, b) => {
              const dateA = new Date(a.data().createdAt).getTime();
              const dateB = new Date(b.data().createdAt).getTime();
              return dateB - dateA;
            });

            const latestDoc = docs[0];
            const requestId = latestDoc.id;
            console.log(`[BOT] Standalone price: found request ${requestId}`);
            
            await updateDoc(latestDoc.ref, {
              price: price,
              status: "completed",
              updatedAt: new Date().toISOString()
            });
            
            ctx.reply(`✅ Eng oxirgi so'rovga narx (${price.toLocaleString()} so'm) biriktirildi!\n(ID: ${requestId})`);
          } else {
            console.log("[BOT] No pending requests.");
            ctx.reply("❌ Hozirda kutilayotgan narx so'rovlari topilmadi.");
          }
        } catch (err) {
          console.error("[BOT] Standalone update failed:", err);
          ctx.reply(`❌ Xatolik: ${err instanceof Error ? err.message : "Noma'lum xato"}`);
        }
      }
    }
  });

  // Improved bot launch with conflict handling
  const launchBot = async () => {
    try {
      // Adding a small delay to allow previous instances to clear
      await new Promise(resolve => setTimeout(resolve, 2000));
      await bot.launch({
        dropPendingUpdates: true
      });
      console.log("Telegram bot launched successfully");
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        console.warn("Telegram bot conflict (409) detected. This is usually due to multiple instances during development. The bot will try to recover automatically.");
      } else {
        console.error("Bot launch failed:", err);
      }
    }
  };

  launchBot();

  // Seed Data if empty
  const seedData = async () => {
    try {
      const metaRef = doc(db, "system_meta", "seeding");
      const metaSnap = await getDoc(metaRef);
      
      // If seed already happened once in the lifetime of this DB, skip
      if (metaSnap.exists() && metaSnap.data().completed) {
        console.log("Seeding already completed previously, skipping.");
        return;
      }

      console.log("Checking if seeding is required...");
      const q = query(collection(db, "products"), limit(1));
      const productsSnap = await getDocs(q);
      
      if (productsSnap.empty) {
        console.log("Seeding products and gallery...");
        const { BASE_PRODUCTS, READY_DESIGNS } = await import("./src/constants.ts");
        
        const batch = writeBatch(db);
        BASE_PRODUCTS.forEach((p: any) => {
          const ref = doc(db, "products", p.id);
          batch.set(ref, p);
        });
        
        READY_DESIGNS.forEach((p: any) => {
          const ref = doc(db, "gallery", p.id);
          batch.set(ref, p);
        });
        
        // Mark as completed
        batch.set(metaRef, { completed: true, timestamp: new Date().toISOString() });
        
        await batch.commit();
        console.log("Seeding completed successfully.");
      } else {
        // Even if not empty, mark as completed if someone added manual data
        await updateDoc(metaRef, { completed: true, timestamp: new Date().toISOString() }).catch(async () => {
             // If update fails because doc doesn't exist, set it
             const { setDoc } = await import("firebase/firestore");
             await setDoc(metaRef, { completed: true, timestamp: new Date().toISOString() });
        });
        console.log("Database not empty, marked seeding as completed to avoid future overwrites.");
      }
    } catch (err) {
      console.error("Seeding error:", err);
    }
  };
  // seedData();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  console.log("TELEGRAM_BOT_TOKEN topilmadi, bot ishga tushmadi.");
}

async function startServer() {
  console.log("Server starting...");
  // Increase limit for base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    console.log("Health check received");
    res.json({ status: "ok" });
  });

  // Fetch all data for initial load
  app.get("/api/init", async (req, res) => {
    try {
      const productsSnap = await getDocs(collection(db, "products"));
      const gallerySnap = await getDocs(collection(db, "gallery"));
      
      const products = productsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      const gallery = gallerySnap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      res.json({ products, gallery });
    } catch (err) {
      console.error("Init API failed:", err);
      res.status(500).json({ error: "Failed to fetch production data" });
    }
  });

  app.post("/api/request-price", async (req, res) => {
    const { requestId, productName, size, type, image } = req.body;
    if (bot && process.env.ADMIN_CHAT_ID) {
      try {
        const msg = await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, 
          `🚨 *YANGI NARX SO'ROVI!*\n\n🆔 ID: \`${requestId}\`\n📦 *Mahsulot:* ${productName}\n📏 *O'lcham:* ${size}\n🎨 *Tur:* ${type}\n\n_Narxni yuborish uchun ushbu xabarga raqam bilan javob bering._`,
          { parse_mode: 'Markdown' }
        );
        const caption = `🖼 *Dizayn rasmi*\n🆔 ID: \`${requestId}\``;
        if (image && image.includes('base64')) {
          await bot.telegram.sendPhoto(process.env.ADMIN_CHAT_ID, { 
            source: Buffer.from(image.split(',')[1], 'base64') 
          }, { 
            caption, 
            parse_mode: 'Markdown',
            reply_parameters: { message_id: msg.message_id } 
          });
        } else if (image) {
            await bot.telegram.sendPhoto(process.env.ADMIN_CHAT_ID, image, { 
              caption, 
              parse_mode: 'Markdown',
              reply_parameters: { message_id: msg.message_id } 
            });
        }
      } catch (err) {
        console.error("Bot notification failed:", err);
      }
    }
    res.json({ success: true });
  });

  app.post("/api/notify-order", async (req, res) => {
    const order = req.body;
    console.log(`[API] Order notification received for ID: ${order.id}`);
    
    if (bot && process.env.ADMIN_CHAT_ID) {
      try {
        const totalAmountStr = order.totalAmount ? order.totalAmount.toLocaleString() : '0';
        const itemsCount = order.items ? order.items.length : 0;
        const text = `💰 *YANGI BUYURTMA!*\n\n🆔 ID: ${order.id}\n💵 Summa: ${totalAmountStr} so'm\n📦 Mahsulotlar soni: ${itemsCount}\n👤 Mijoz: ${order.customerName || 'Nomalum'}\n📞 Tel: ${order.customerPhone || 'Nomalum'}\n\n_To'lovni tasdiqlash uchun pastdagi tugmani bosing._`;
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback("✅ To'lovni tasdiqlash", `pay_confirm_${order.id}`)]
        ]);

        if (order.receiptImage && order.receiptImage.startsWith('data:image')) {
          console.log(`[API] Sending receipt photo to admin for order ${order.id}`);
          await bot.telegram.sendPhoto(process.env.ADMIN_CHAT_ID, { 
            source: Buffer.from(order.receiptImage.split(',')[1], 'base64') 
          }, { 
            caption: text, 
            parse_mode: 'Markdown',
            ...keyboard
          });
        } else {
          console.log(`[API] Receipt image missing or invalid format. Sending text only.`);
          await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, text, { 
            parse_mode: 'Markdown',
            ...keyboard
          });
        }
        console.log(`[API] Order notification sent successfully.`);
      } catch (err) {
        console.error("[API] Order notification failed:", err);
      }
    } else {
      console.warn("[API] Bot or ADMIN_CHAT_ID not configured.");
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
