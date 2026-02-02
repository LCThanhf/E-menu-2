const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ============================================
  // Seed Admin Account
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@emenu.com' },
    update: {},
    create: {
      email: 'admin@emenu.com',
      password: hashedPassword,
      fullName: 'Administrator',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // ============================================
  // Seed Categories
  // ============================================
  const categories = [
    { slug: 'appetizer', name: 'Khai vị', sortOrder: 1 },
    { slug: 'main', name: 'Món chính', sortOrder: 2 },
    { slug: 'drink', name: 'Đồ uống', sortOrder: 3 },
    { slug: 'dessert', name: 'Tráng miệng', sortOrder: 4 },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    })
  }
  console.log('✅ Categories seeded')

  // ============================================
  // Seed Menu Items (matching frontend data)
  // ============================================
  const appetizerCategory = await prisma.category.findUnique({ where: { slug: 'appetizer' } })
  const mainCategory = await prisma.category.findUnique({ where: { slug: 'main' } })
  const drinkCategory = await prisma.category.findUnique({ where: { slug: 'drink' } })
  const dessertCategory = await prisma.category.findUnique({ where: { slug: 'dessert' } })

  const menuItems = [
    {
      name: 'Gỏi cuốn tôm thịt',
      description: 'Bánh tráng cuốn với tôm, thịt heo, rau sống, bún',
      price: 45000,
      categoryId: appetizerCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Chả giò',
      description: 'Nem rán giòn với nhân thịt heo và rau củ',
      price: 55000,
      categoryId: appetizerCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Phở bò tái nạm',
      description: 'Phở với thịt bò tái, nạm, nước dùng xương hầm',
      price: 75000,
      categoryId: mainCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Cơm tấm sườn bì chả',
      description: 'Cơm tấm với sườn nướng, bì, chả trứng',
      price: 65000,
      categoryId: mainCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Bún chả Hà Nội',
      description: 'Bún với chả thịt nướng, nước mắm pha',
      price: 70000,
      categoryId: mainCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Trà đá',
      description: 'Trà xanh ướp lạnh',
      price: 10000,
      categoryId: drinkCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Cà phê sữa đá',
      description: 'Cà phê phin pha với sữa đặc',
      price: 35000,
      categoryId: drinkCategory.id,
      image: '/placeholder-food.jpg',
    },
    {
      name: 'Chè ba màu',
      description: 'Chè đậu xanh, đậu đỏ, thạch, nước cốt dừa',
      price: 30000,
      categoryId: dessertCategory.id,
      image: '/placeholder-food.jpg',
    },
  ]

  for (const item of menuItems) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { name: item.name },
    })
    
    if (!existingItem) {
      await prisma.menuItem.create({ data: item })
    }
  }
  console.log('✅ Menu items seeded')

  // ============================================
  // Seed Tables (10 tables)
  // ============================================
  for (let i = 1; i <= 10; i++) {
    const tableNumber = i.toString().padStart(2, '0')
    await prisma.table.upsert({
      where: { tableNumber },
      update: {},
      create: {
        tableNumber,
        tableName: `Bàn ${i}`,
        status: 'AVAILABLE',
      },
    })
  }
  console.log('✅ Tables seeded')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
