import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client thông thường dùng cho giao diện web (an toàn)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mẹo lính gác: Chỉ khởi tạo Admin khi chạy trên Server (nơi không có 'window')
// Dùng "as any" để TypeScript không báo lỗi "có thể bị null"
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (null as any);