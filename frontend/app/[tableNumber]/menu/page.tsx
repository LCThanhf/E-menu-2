import { MenuPage } from "@/components/menu-page"

interface MenuPageProps {
  params: Promise<{
    tableNumber: string
  }>
}

export default async function CustomerMenuPage({ params }: MenuPageProps) {
  const { tableNumber } = await params
  
  // Extract the number from the URL (e.g., "table1" -> "01", "table12" -> "12")
  const tableNumberMatch = tableNumber.match(/table(\d+)/i)
  const tableNum = tableNumberMatch 
    ? tableNumberMatch[1].padStart(2, "0") 
    : "01"

  return (
    <main className="min-h-screen bg-background">
      <MenuPage tableNumber={tableNum} tableSlug={tableNumber} />
    </main>
  )
}
