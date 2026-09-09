import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.join(__dirname, '.env');
let url = process.env.VITE_SUPABASE_URL;
let key = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      url = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      key = trimmed.split('=')[1].trim();
    }
  }
}

console.log('====================================================');
console.log('  🔍 Testing Supabase Database Tables & Permissions');
console.log('====================================================');
console.log('Project URL:', url || '(missing)');

if (!url || !key) {
  console.error('\n❌ ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in client/.env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  let needsRlsFix = false;

  try {
    // 1. Check users
    const usersRes = await supabase.from('users').select('*');
    if (usersRes.error) {
      console.log('❌ "users" table error:', usersRes.error.message);
    } else {
      console.log(`✅ "users" table: Connected & Authorized! Found ${usersRes.data.length} record(s).`);
    }

    // 2. Check orders read & write
    const ordersRes = await supabase.from('orders').select('*');
    if (ordersRes.error) {
      console.log('❌ "orders" table select error:', ordersRes.error.message);
    } else {
      // Test insert permission
      const testOrd = await supabase.from('orders').insert({
        order_number: 'TEST-' + Date.now(),
        customer_name: 'Test Customer',
        total_amount: 100,
        status: 'pending',
      }).select();

      if (testOrd.error) {
        console.log(`⚠️  "orders" table: Found ${ordersRes.data.length} records, BUT Inserts are blocked by RLS!`);
        needsRlsFix = true;
      } else {
        console.log(`✅ "orders" table: Fully Authorized (Read & Write)! Found ${ordersRes.data.length} record(s).`);
        if (testOrd.data?.[0]?.id) {
          await supabase.from('orders').delete().eq('id', testOrd.data[0].id);
        }
      }
    }

    // 3. Check reviews read & write
    const reviewsRes = await supabase.from('reviews').select('*');
    if (reviewsRes.error) {
      console.log('❌ "reviews" table select error:', reviewsRes.error.message);
    } else {
      // Test insert permission
      const testRev = await supabase.from('reviews').insert({
        customer_name: 'Test Customer',
        product_name: 'Test Item',
        rating: 5,
        comment: 'Testing RLS permissions',
        status: 'pending',
      }).select();

      if (testRev.error) {
        console.log(`⚠️  "reviews" table: Found ${reviewsRes.data.length} records, BUT Inserts are blocked by RLS!`);
        needsRlsFix = true;
      } else {
        console.log(`✅ "reviews" table: Fully Authorized (Read & Write)! Found ${reviewsRes.data.length} record(s).`);
        if (testRev.data?.[0]?.id) {
          await supabase.from('reviews').delete().eq('id', testRev.data[0].id);
        }
      }
    }

    if (needsRlsFix) {
      console.log('\n====================================================');
      console.log('👉 FINAL STEP: RUN THIS IN YOUR SUPABASE SQL EDITOR:');
      console.log('====================================================');
      console.log(`
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.orders TO anon, authenticated;

ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.reviews TO anon, authenticated;
      `);
      console.log('Link: https://supabase.com/dashboard/project/bxiiobfaqcocloxexqfi/sql\n');
    } else {
      console.log('\n🎉 ALL TABLES ARE 100% CONNECTED AND AUTHORIZED!');
    }
  } catch (err) {
    console.error('\n❌ Network error connecting to Supabase:', err.message);
  }
}

check();
