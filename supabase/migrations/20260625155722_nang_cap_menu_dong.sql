-- Thêm các cột phân loại Menu cho bảng custom_pages
alter table public.custom_pages 
  add column if not exists icon text default '📄',
  add column if not exists group_name text default 'VẬN HÀNH SẢN XUẤT',
  add column if not exists folder_name text default null,
  add column if not exists route_url text default null,
  add column if not exists order_index int default 0;

-- Tự động nạp 3 mục Menu có sẵn của anh hai vào cơ sở dữ liệu để Admin có thể quản lý
insert into public.custom_pages (title, slug, icon, group_name, folder_name, route_url, order_index)
values 
  ('Thông số sản phẩm', 'thong-so-san-pham-system', '📦', 'VẬN HÀNH SẢN XUẤT', 'Thông số xưởng cán', '/xuong-can/san-pham', 1),
  ('Đang chờ', 'dang-cho-system', '⏳', 'VẬN HÀNH SẢN XUẤT', 'Thông số xưởng cán', '/xuong-can/dang-cho', 2),
  ('Các phần mềm', 'cac-phan-mem-system', '💻', 'CÔNG CỤ & HỆ THỐNG', null, '/phan-mem', 1)
on conflict (slug) do nothing;