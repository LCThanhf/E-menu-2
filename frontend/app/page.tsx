import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to table1 by default when accessing the root URL
  redirect("/table1")
}
