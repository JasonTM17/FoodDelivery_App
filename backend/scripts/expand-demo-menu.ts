import { PrismaClient } from '@prisma/client'
import { withVerifiedDatabaseTls } from '../src/database/database-tls'

const additions: Record<string, [string, number][]> = {
  'pho-24': [['Phở bò viên',65000],['Phở tái gân',75000],['Phở gà xé',60000],['Phở đặc biệt',89000],['Quẩy giòn',10000],['Trà chanh',20000]],
  'bun-bo-hue-3a3': [['Bún bò tái',65000],['Bún bò giò heo',79000],['Bún bò chả cua',75000],['Bún bò đặc biệt',89000],['Bánh bột lọc',35000],['Nước sâm',18000]],
  'com-tam-sai-gon': [['Cơm sườn trứng',65000],['Cơm sườn bì chả',75000],['Cơm gà nướng',69000],['Cơm ba rọi nướng',69000],['Canh rong biển',25000],['Trà tắc',18000]],
  'banh-mi-huynh-hoa': [['Bánh mì trứng ốp la',35000],['Bánh mì gà xé',45000],['Bánh mì thịt nướng',49000],['Bánh mì xíu mại',45000],['Bánh mì chay',35000],['Cà phê sữa đá',29000],['Bánh mì cá ngừ',45000],['Bánh mì bò xào',55000],['Bánh mì nấm sốt tiêu',39000],['Sữa đậu nành',18000]],
  'pizza-4ps': [['Pizza phô mai',159000],['Pizza nấm',179000],['Pizza gà BBQ',199000],['Mì Ý sốt cà chua',99000],['Salad rau củ',69000],['Trà đào',39000]],
  'sushi-kei': [['Cơm cuộn cá hồi',89000],['Cơm cuộn rau củ',59000],['Sushi tôm',79000],['Mì udon bò',109000],['Súp miso',29000],['Trà xanh lạnh',25000]],
  'bun-cha-ha-noi': [['Bún chả nem',75000],['Bún chả thịt nướng',65000],['Bún nem cua bể',79000],['Nem rán',35000],['Nộm đu đủ',29000],['Nước chanh',20000]],
  'ga-ran-kfc': [['Gà giòn phần đơn',49000],['Gà sốt cay',59000],['Burger gà',59000],['Khoai tây chiên',29000],['Salad bắp cải',25000],['Combo gà và khoai',89000]],
}

async function main() {
  if (process.env.FOODFLOW_CATALOG_CONFIRM !== 'ADD_DEMO_MENU') throw new Error('Explicit demo menu confirmation required')
  const db = new PrismaClient({ datasources: { db: { url: withVerifiedDatabaseTls(process.env.DATABASE_URL, process.env.DB_SSL_CA) } } })
  try {
    const result = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('foodflow-demo-menu-v1'))`
      let inserted = 0, skipped = 0
      for (const [slug, items] of Object.entries(additions)) {
        const restaurant = await tx.restaurant.findUnique({ where: { slug }, select: { id: true } })
        if (!restaurant) throw new Error('Expected seeded demo restaurant missing: '+slug)
        let category = await tx.category.findFirst({ where: { restaurantId: restaurant.id, name: 'Thực đơn mở rộng (Demo)' } })
        if (!category) category = await tx.category.create({ data: { restaurantId: restaurant.id, name: 'Thực đơn mở rộng (Demo)', sortOrder: 20 } })
        for (const [name, price] of items) {
          if (await tx.menuItem.findFirst({ where: { restaurantId: restaurant.id, name }, select: { id: true } })) { skipped++; continue }
          await tx.menuItem.create({ data: {
            restaurantId: restaurant.id, categoryId: category.id, name, basePrice: price,
            description: 'Món mẫu để trải nghiệm đặt hàng FoodFlow. Giá và tình trạng phục vụ là dữ liệu giả lập, không phải thực đơn chính thức của thương hiệu.',
            isAvailable: true, isPopular: false, sortOrder: inserted,
          } })
          inserted++
        }
      }
      return { inserted, skipped, restaurants: await tx.restaurant.count(), menuItems: await tx.menuItem.count() }
    }, { timeout: 30000 })
    console.log(JSON.stringify({ status: 'PASS', ...result, existingAccountsOrdersAndMenusPreserved: true }))
  } finally { await db.$disconnect() }
}

void main().catch(() => { console.error('Demo menu expansion failed; transaction rolled back'); process.exitCode = 1 })
