import { redirect } from "next/navigation";

export default function Page() {
  redirect("/items/subcategories?modal=subcategory");
}
