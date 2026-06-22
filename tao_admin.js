const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqtilxoaufrobnklafon.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdGlseG9hdWZyb2Jua2xhZm9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEwNTM1MywiZXhwIjoyMDk3NjgxMzUzfQ.vFniL8_RbRoQzSGk9JJReFFzZjO1lTUw7kgwKCkXDic';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function dongMoc() {
  console.log("🔍 Đang tìm tài khoản Admin trong kho...");
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const adminUser = users.find(u => u.email === 'admin@1.1');

  if (adminUser) {
    console.log("✅ Đã thấy tài khoản, đang đóng mộc...");
    
    // Dùng upsert: Nếu chưa có thì chèn vào, có rồi thì cập nhật thành 'admin'
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: adminUser.id, role: 'admin' });

    if (error) {
      console.error("❌ Lỗi đóng mộc:", error.message);
    } else {
      console.log("🎉 XUẤT SẮC! Hệ thống đã ghi nhận quyền Admin tối cao!");
    }
  } else {
    console.log("❌ Không tìm thấy tài khoản admin@ha-duongnt.io.vn");
  }
}

dongMoc();