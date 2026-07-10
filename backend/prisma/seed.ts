import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { SeedPriceRange, toDatabasePriceRange } from './seed-database-values'
import { ensureDemoOrdersAndTickets } from './seed-demo-content'

const prisma = new PrismaClient()

let seedState = 0x1234abcd

function seededRandom(): number {
  seedState = (seedState * 1664525 + 1013904223) >>> 0
  return seedState / 0x100000000
}

function chance(probability: number): boolean {
  return seededRandom() < probability
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run prisma/seed.ts in production because it creates demo users, restaurants, drivers, customers, and sample orders. Use a reviewed production data import/bootstrap instead.',
    )
  }

  console.log('Seeding FoodFlow database...')

  // ── Admin User ──
  const adminHash = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodflow.vn' },
    update: {},
    create: {
      email: 'admin@foodflow.vn',
      passwordHash: adminHash,
      fullName: 'Admin FoodFlow',
      role: 'admin',
      phone: '0900000000',
      isActive: true,
    },
  })
  console.log(`Admin: ${admin.email}`)

  // ── Restaurant Owners + Restaurants ──
  const restaurants = [
    { name: 'Phở 24', slug: 'pho-24', cuisine: ['Vietnamese'], price: 'low', lat: 10.7769, lng: 106.7009, prep: 10, minOrder: 20000 },
    { name: 'Bún Bò Huế 3A3', slug: 'bun-bo-hue-3a3', cuisine: ['Vietnamese'], price: 'low', lat: 10.7730, lng: 106.6985, prep: 12, minOrder: 25000 },
    { name: 'Cơm Tấm Sài Gòn', slug: 'com-tam-sai-gon', cuisine: ['Vietnamese'], price: 'low', lat: 10.7800, lng: 106.6950, prep: 10, minOrder: 20000 },
    { name: 'Bánh Mì Huỳnh Hoa', slug: 'banh-mi-huynh-hoa', cuisine: ['Vietnamese'], price: 'low', lat: 10.7745, lng: 106.6920, prep: 5, minOrder: 15000 },
    { name: 'Pizza 4Ps', slug: 'pizza-4ps', cuisine: ['Italian', 'Japanese'], price: 'high', lat: 10.7777, lng: 106.7020, prep: 20, minOrder: 100000 },
    { name: 'Sushi Kei', slug: 'sushi-kei', cuisine: ['Japanese'], price: 'high', lat: 10.7755, lng: 106.7040, prep: 15, minOrder: 150000 },
    { name: 'Bún Chả Hà Nội', slug: 'bun-cha-ha-noi', cuisine: ['Vietnamese'], price: 'low', lat: 10.7810, lng: 106.6900, prep: 10, minOrder: 30000 },
    { name: 'Gà Rán KFC', slug: 'ga-ran-kfc', cuisine: ['Fast Food'], price: 'medium', lat: 10.7720, lng: 106.6990, prep: 8, minOrder: 50000 },
  ]

  const createdRestaurants: Array<{ id: string; lat: number; lng: number }> = []

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i]
    const ownerEmail = `restaurant${i + 1}@foodflow.vn`
    const ownerHash = await bcrypt.hash('Partner@123', 12)

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        passwordHash: ownerHash,
        fullName: `${r.name} Manager`,
        role: 'restaurant',
        phone: `09000000${10 + i}`,
      },
    })

    const restaurant = await prisma.$executeRawUnsafe(
      `INSERT INTO restaurants (id, name, slug, description, logo_url, cover_url, location, address_line, city, district, phone, cuisine_types, price_range, rating, total_reviews, is_open, is_active, prep_time_avg_minutes, min_order_amount, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, 'TP. Hồ Chí Minh', 'Quận 1', $9, $10::text[], $11::"PriceRange", 4.5, ${50 + i * 23}, true, true, $12, $13, NOW())
       RETURNING id`,
      r.name, r.slug, `${r.name} - Món ngon mỗi ngày`,
      `https://picsum.photos/seed/${r.slug}/200/200`,
      `https://picsum.photos/seed/${r.slug}-cover/800/400`,
      r.lng, r.lat,
      `${100 + i} Đường Nguyễn Huệ, Phường Bến Nghé`,
      `09000001${i}`,
      `{${r.cuisine.join(',')}}`,
      toDatabasePriceRange(r.price as SeedPriceRange),
      r.prep, r.minOrder,
    )

    // Get the created restaurant
    const created = await prisma.restaurant.findFirst({ where: { slug: r.slug } })
    if (created) {
      createdRestaurants.push({ id: created.id, lat: r.lat, lng: r.lng })

      await prisma.restaurantProfile.upsert({
        where: { userId: owner.id },
        update: {},
        create: { userId: owner.id, restaurantId: created.id },
      })

      // Opening hours (7am - 9pm every day)
      for (let day = 0; day < 7; day++) {
        await prisma.restaurantOpeningHour.create({
          data: { restaurantId: created.id, dayOfWeek: day, openTime: '07:00', closeTime: '21:00' },
        })
      }
    }
  }
  console.log(`${restaurants.length} restaurants seeded`)

  // ── Drivers ──
  const driverNames = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E']
  const driverIds: string[] = []

  for (let i = 0; i < driverNames.length; i++) {
    const driverHash = await bcrypt.hash('Driver@123', 12)
    const email = `driver${i + 1}@foodflow.vn`

    const driver = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: driverHash,
        fullName: driverNames[i],
        role: 'driver',
        phone: `09000002${10 + i}`,
      },
    })

    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: {},
      create: {
        userId: driver.id,
        licenseNumber: `LIC-${10000 + i}`,
        vehicleType: 'motorbike',
        vehiclePlate: `59A1-${10000 + i}`,
        isVerified: true,
        rating: 4.0 + seededRandom() * 1.0,
        totalDeliveries: 50 + i * 30,
        totalEarnings: 5000000 + i * 2000000,
      },
    })
    driverIds.push(driver.id)
  }
  console.log(`${driverNames.length} drivers seeded`)

  // ── Customers ──
  for (let i = 0; i < 5; i++) {
    const customerHash = await bcrypt.hash('Customer@123', 12)
    const email = `customer${i + 1}@foodflow.vn`

    const customer = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: customerHash,
        fullName: `Khách Hàng ${i + 1}`,
        role: 'customer',
        phone: `09000003${10 + i}`,
      },
    })

    await prisma.customerProfile.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id, totalOrders: i * 5 },
    })

    // Add addresses (raw SQL — Address has PostGIS Unsupported column)
    const aLat = 10.7740 + seededRandom() * 0.01
    const aLng = 106.6980 + seededRandom() * 0.01
    await prisma.$executeRawUnsafe(
      `INSERT INTO addresses (id, user_id, label, address_line, location, is_default, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), true, NOW())`,
      customer.id, 'Nhà', `${100 + i * 10} Đường Lê Lợi, Phường Bến Thành, Quận 1`, aLng, aLat,
    )
  }
  console.log('5 customers seeded')

  // Update address locations with raw SQL (PostGIS points)
  await prisma.$executeRawUnsafe(`
    UPDATE addresses SET location = ST_SetSRID(ST_MakePoint(106.7030, 10.7790), 4326)
    WHERE location IS NULL
  `)

  // ── Menu Items ──
  const menuData: Record<string, Array<{ cat: string; items: Array<{ name: string; price: number; desc: string }> }>> = {
    'pho-24': [
      { cat: 'Phở', items: [
        { name: 'Phở bò tái', price: 65000, desc: 'Phở bò tái nước dùng xương hầm 12h' },
        { name: 'Phở bò chín', price: 65000, desc: 'Thịt bò chín mềm, nước dùng đậm đà' },
        { name: 'Phở gà', price: 55000, desc: 'Thịt gà ta dai ngon, nước dùng thanh' },
        { name: 'Phở tái nạm', price: 75000, desc: 'Bò tái + nạm gầu béo ngậy' },
      ]},
      { cat: 'Đồ uống', items: [
        { name: 'Trà đá', price: 5000, desc: 'Trà đá mát lạnh' },
        { name: 'Nước mía', price: 15000, desc: 'Nước mía tươi ép nguyên chất' },
      ]},
    ],
    'bun-bo-hue-3a3': [
      { cat: 'Bún Bò', items: [
        { name: 'Bún bò đặc biệt', price: 55000, desc: 'Đầy đủ chả, giò, thịt bò, gân' },
        { name: 'Bún bò thập cẩm', price: 45000, desc: 'Thịt bò + chả cua' },
        { name: 'Bún bò chay', price: 35000, desc: 'Nước dùng rau củ, nấm, đậu hũ' },
      ]},
      { cat: 'Đồ uống', items: [
        { name: 'Trà chanh', price: 10000, desc: 'Trà chanh tươi mát' },
      ]},
    ],
    'com-tam-sai-gon': [
      { cat: 'Cơm Tấm', items: [
        { name: 'Cơm tấm sườn', price: 45000, desc: 'Sườn nướng + bì + chả + trứng ốp la' },
        { name: 'Cơm tấm sườn bì chả', price: 55000, desc: 'Full topping: sườn, bì, chả, trứng' },
        { name: 'Cơm tấm gà nướng', price: 50000, desc: 'Đùi gà nướng mật ong' },
      ]},
    ],
    'banh-mi-huynh-hoa': [
      { cat: 'Bánh Mì', items: [
        { name: 'Bánh mì đặc biệt', price: 35000, desc: 'Thịt nguội, chả lụa, pate, đồ chua' },
        { name: 'Bánh mì thịt nướng', price: 30000, desc: 'Thịt heo nướng sả ớt' },
        { name: 'Bánh mì chay', price: 20000, desc: 'Đậu hũ + nấm + rau củ nướng' },
      ]},
    ],
    'pizza-4ps': [
      { cat: 'Pizza', items: [
        { name: 'Margherita', price: 199000, desc: 'Sốt cà chua San Marzano, mozzarella tươi, basil' },
        { name: 'Pepperoni', price: 249000, desc: 'Pepperoni, mozzarella, sốt cà chua' },
        { name: '4 Formaggi', price: 299000, desc: '4 loại phô mai Ý nhập khẩu' },
      ]},
      { cat: 'Mì Ý', items: [
        { name: 'Spaghetti Carbonara', price: 179000, desc: 'Trứng, pancetta, parmesan, tiêu đen' },
        { name: 'Penne Arrabiata', price: 159000, desc: 'Sốt cà chua cay, tỏi, ớt' },
      ]},
    ],
    'sushi-kei': [
      { cat: 'Sushi', items: [
        { name: 'Salmon Sashimi (5 miếng)', price: 199000, desc: 'Cá hồi Na Uy tươi sống' },
        { name: 'Maguro Nigiri (2 miếng)', price: 149000, desc: 'Cá ngừ đại dương' },
        { name: 'California Roll (8 miếng)', price: 169000, desc: 'Cua, bơ, dưa leo, trứng cá' },
      ]},
    ],
    'bun-cha-ha-noi': [
      { cat: 'Bún Chả', items: [
        { name: 'Bún chả Hà Nội', price: 45000, desc: 'Chả viên + chả miếng nướng than hoa' },
        { name: 'Bún chả que tre', price: 55000, desc: 'Chả nướng que tre truyền thống' },
      ]},
      { cat: 'Nem', items: [
        { name: 'Nem rán (4 cái)', price: 35000, desc: 'Nem Hà Nội giòn tan' },
      ]},
    ],
    'ga-ran-kfc': [
      { cat: 'Gà Rán', items: [
        { name: 'Gà rán 2 miếng', price: 55000, desc: 'Gà rán giòn tan công thức đặc biệt' },
        { name: 'Gà rán 4 miếng', price: 99000, desc: 'Combo 4 miếng tiết kiệm' },
        { name: 'Burger gà', price: 45000, desc: 'Burger gà + phô mai + rau xà lách' },
      ]},
      { cat: 'Thức uống', items: [
        { name: 'Pepsi', price: 15000, desc: 'Pepsi lon 330ml' },
        { name: '7Up', price: 15000, desc: '7Up lon 330ml' },
      ]},
    ],
  }

  let totalItems = 0
  for (const [slug, categories] of Object.entries(menuData)) {
    const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
    if (!restaurant) continue

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci]
      const category = await prisma.category.create({
        data: { restaurantId: restaurant.id, name: cat.cat, sortOrder: ci },
      })

      for (const item of cat.items) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: item.name,
            description: item.desc,
            basePrice: item.price,
            imageUrl: `https://picsum.photos/seed/${slug}-${item.name.toLowerCase().replace(/\s/g, '-')}/400/400`,
            isPopular: chance(0.3),
          },
        })
        totalItems++
      }
    }
  }
  console.log(`${totalItems} menu items seeded`)

  // ── Promotions ──
  await prisma.promotion.createMany({
    data: [
      { code: 'WELCOME20', type: 'percentage', value: 20, minOrderAmount: 50000, maxDiscount: 50000, usageLimit: 1000, usageCount: 0, startsAt: new Date('2026-01-01'), expiresAt: new Date('2026-12-31'), isActive: true },
      { code: 'FREESHIP', type: 'fixed', value: 15000, minOrderAmount: 100000, maxDiscount: 15000, usageLimit: 500, usageCount: 0, startsAt: new Date('2026-01-01'), expiresAt: new Date('2026-12-31'), isActive: true },
      { code: 'SUMMER50', type: 'percentage', value: 50, minOrderAmount: 200000, maxDiscount: 100000, usageLimit: 200, usageCount: 0, startsAt: new Date('2026-01-01'), expiresAt: new Date('2026-12-31'), isActive: true },
    ],
    skipDuplicates: true,
  })
  console.log('3 promotions seeded')

  // ── Demo order + support ticket (Admin Support + Restaurant kanban) ──
  const demo = await ensureDemoOrdersAndTickets(prisma as never)
  console.log(
    `Demo content: order=${demo.orderId ?? 'skipped'} ticket=${demo.ticketId ?? 'skipped'}`,
  )
  console.log('Seed complete!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1) })
