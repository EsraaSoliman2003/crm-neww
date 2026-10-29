import { redirect } from "next/navigation";

export default function Page() {
  redirect("/tests/subcategories?modal=subcategory");
}
