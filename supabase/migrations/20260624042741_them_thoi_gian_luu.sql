-- Thêm cột updated_at để lưu thời gian cập nhật lần cuối
alter table public.products add column if not exists updated_at timestamp with time zone;