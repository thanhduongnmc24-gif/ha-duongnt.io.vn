import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET() {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  
  const combined = users.map((u: any) => {
    const profile = profiles?.find((p: any) => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      role: profile?.role || 'user',
      display_name: profile?.display_name || '', // Lấy tên hiển thị ra
      last_sign_in: u.last_sign_in_at
    };
  });
  return NextResponse.json(combined);
}

export async function POST(req: Request) {
  const { email, password, role, display_name } = await req.json();
  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  // Ghi thêm tên hiển thị vào profile
  await supabaseAdmin.from('profiles').upsert({ id: user!.id, role, display_name });
  return NextResponse.json({ message: 'Tạo tài khoản thành công' });
}

export async function PUT(req: Request) {
  try {
    const { id, newPassword, display_name } = await req.json();
    
    // Nếu có nhập pass mới thì đổi pass
    if (newPassword) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Nếu có truyền tên hiển thị lên thì cập nhật tên
    if (display_name !== undefined) {
      const { error: profileError } = await supabaseAdmin.from('profiles').update({ display_name }).eq('id', id);
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Cập nhật thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu ID nhân viên' }, { status: 400 });

    await supabaseAdmin.from('profiles').delete().eq('id', id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Xóa nhân sự thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}