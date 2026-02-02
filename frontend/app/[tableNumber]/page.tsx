import { RoleSelection } from "@/components/role-selection"

interface TablePageProps {
  params: Promise<{
    tableNumber: string
  }>
}

export default async function TablePage({ params }: TablePageProps) {
  const { tableNumber } = await params
  
  // Extract the number from the URL (e.g., "table1" -> "01", "table12" -> "12")
  const tableNumberMatch = tableNumber.match(/table(\d+)/i)
  const tableNum = tableNumberMatch 
    ? tableNumberMatch[1].padStart(2, "0") 
    : "01"

  return (
    <main className="min-h-screen bg-background">
      <RoleSelection tableNumber={tableNum} tableSlug={tableNumber} />
    </main>
  )
}
