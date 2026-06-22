import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 1. Lấy danh sách nhân viên kèm quyền hạn
export async function GET() {
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  
  const combined = users.map((u: any) => ({
    id: u.id,
    email: u.email,
    role: profiles?.find((p: any) => p.id === u.id)?.role || 'user',
    last_sign_in: u.last_sign_in_at
  }));
  return NextResponse.json(combined);
}

// 2. Tạo nhân viên mới hoàn toàn
export async function POST(req: Request) {
  const { email, password, role } = await req.json();
  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  await supabaseAdmin.from('profiles').upsert({ id: user!.id, role });
  return NextResponse.json({ message: 'Tạo tài khoản thành comg' });
}

// 3. Ép reset mật khẩu mới không cần qua email xác nhận
export async function PUT(req: Request) {
  try {
    const { id, newPassword } = await req.json();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. Xóa sổ hoàn toàn tài khoản khỏi hệ thống
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Thiếu ID nhân viên' }, { status: 400 });

    // Xóa bảng profiles trước để tránh nghẽn khóa ngoại, sau đó xóa ở kho Auth chính
    await supabaseAdmin.from('profiles').delete().eq('id', id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Xóa nhân sự thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}