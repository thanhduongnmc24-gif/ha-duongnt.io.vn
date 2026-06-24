import { redirect } from "next/navigation";

export default function Home() {
  // Tự động bẻ lái thẳng vào thẳng xưởng cán khi vừa mở web
  redirect("/xuong-can/san-pham");
}