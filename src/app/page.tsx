// Customer homepage — redirects to the shop
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/shop");
}
