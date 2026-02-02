import { redirect } from "next/navigation"

export default function CustomerMenuPage() {
  // Redirect to table1/menu by default when accessing /menu directly
  redirect("/table1/menu")
}
