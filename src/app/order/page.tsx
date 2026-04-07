// Legacy route — redirect to the new shop page
import { redirect } from "next/navigation";
export default function OrderPage() {
  redirect("/shop");
}
