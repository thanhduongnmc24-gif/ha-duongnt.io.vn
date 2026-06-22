-- Tạo bảng cài đặt hệ thống để lưu các thông số dùng chung
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

-- Tắt khiên bảo vệ để anh em đọc ghi thoải mái
alter table public.app_settings disable row level security;

-- Nhét thông số độ rộng cột Sản phẩm mặc định (250px) vào trước
insert into public.app_settings (key, value) values ('firstColWidth', '250') on conflict do nothing;