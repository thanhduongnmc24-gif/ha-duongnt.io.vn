-- Tạo bảng profiles để lưu quyền của nhân viên
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'user'
);