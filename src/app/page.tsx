// Customer homepage — redirects to the order page
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/order");
}
