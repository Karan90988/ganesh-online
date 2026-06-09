import { redirect } from "next/navigation";

// Generic "Products" entry point — defaults to the retail storefront.
export default function ProductsPage() {
  redirect("/retail");
}
