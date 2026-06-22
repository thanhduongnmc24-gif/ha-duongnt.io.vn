import { NextResponse } from 'next/server';
// Lùi 3 cấp để ra tới gốc dự án lấy file supabase.ts
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    // Chỉ cần "chọc" nhẹ vào bảng profiles, lấy đúng 1 dòng ra để tạo tín hiệu hoạt động
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);

    if (error) {
      throw error;
    }

    // Trả về câu chào quen thuộc của anh hai
    return NextResponse.json({ 
      message: "Hello Robot!", 
      status: "Database is awake",
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}