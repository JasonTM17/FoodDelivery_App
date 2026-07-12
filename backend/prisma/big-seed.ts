import { OrderStatus, PaymentMethod, PrismaClient, VehicleType } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { SeedPriceRange, toDatabasePriceRange } from './seed-database-values'

const prisma = new PrismaClient()

// ─── HCMC Districts with real coordinates ───
const DISTRICTS = [
  { name: 'Quận 1', lat: 10.7757, lng: 106.7004 },
  { name: 'Quận 2', lat: 10.7869, lng: 106.7388 },
  { name: 'Quận 3', lat: 10.7791, lng: 106.6860 },
  { name: 'Quận 4', lat: 10.7628, lng: 106.7053 },
  { name: 'Quận 5', lat: 10.7540, lng: 106.6665 },
  { name: 'Quận 7', lat: 10.7340, lng: 106.7200 },
  { name: 'Quận 10', lat: 10.7740, lng: 106.6670 },
  { name: 'Phú Nhuận', lat: 10.7980, lng: 106.6800 },
  { name: 'Bình Thạnh', lat: 10.8106, lng: 106.7090 },
  { name: 'Tân Bình', lat: 10.8000, lng: 106.6500 },
  { name: 'Gò Vấp', lat: 10.8370, lng: 106.6650 },
  { name: 'Tân Phú', lat: 10.7900, lng: 106.6280 },
]

const STREETS = [
  'Nguyễn Huệ', 'Lê Lợi', 'Đồng Khởi', 'Hai Bà Trưng', 'Lý Tự Trọng',
  'Nguyễn Đình Chiểu', 'Võ Văn Tần', 'Trần Hưng Đạo', 'Nguyễn Trãi',
  'Cách Mạng Tháng 8', 'Phan Xích Long', 'Hoàng Sa', 'Trường Sa',
  'Điện Biên Phủ', 'Nam Kỳ Khởi Nghĩa', 'Nguyễn Văn Trỗi',
]

// ─── Real Vietnamese restaurant data ───
const RESTAURANT_TEMPLATES = [
  { name: 'Phở Thìn', cuisine: ['Vietnamese'], price: 'low', prep: 8, slug: 'pho-thin' },
  { name: 'Phở Hùng', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'pho-hung' },
  { name: 'Phở Lệ', cuisine: ['Vietnamese'], price: 'medium', prep: 12, slug: 'pho-le' },
  { name: 'Bún Bò Huế 123', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'bun-bo-123' },
  { name: 'Bún Bò Gốc Huế', cuisine: ['Vietnamese'], price: 'medium', prep: 12, slug: 'bun-bo-goc-hue' },
  { name: 'Cơm Tấm Mộc', cuisine: ['Vietnamese'], price: 'low', prep: 8, slug: 'com-tam-moc' },
  { name: 'Cơm Tấm Bụi Sài Gòn', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'com-tam-bui' },
  { name: 'Bánh Mì Huỳnh Hoa', cuisine: ['Vietnamese', 'Street Food'], price: 'low', prep: 5, slug: 'banh-mi-huynh-hoa' },
  { name: 'Bánh Mì Bà Năm', cuisine: ['Vietnamese', 'Street Food'], price: 'low', prep: 5, slug: 'banh-mi-ba-nam' },
  { name: 'Bún Chả Hà Nội 36', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'bun-cha-36' },
  { name: 'Bún Chả Tuyết', cuisine: ['Vietnamese'], price: 'medium', prep: 12, slug: 'bun-cha-tuyet' },
  { name: 'Cơm Gà Xối Mỡ', cuisine: ['Vietnamese'], price: 'low', prep: 15, slug: 'com-ga-xoi-mo' },
  { name: 'Cơm Gà Hải Nam', cuisine: ['Vietnamese', 'Chinese'], price: 'medium', prep: 12, slug: 'com-ga-hai-nam' },
  { name: 'Hủ Tiếu Nam Vang', cuisine: ['Vietnamese', 'Chinese'], price: 'low', prep: 8, slug: 'hu-tieu-nam-vang' },
  { name: 'Hủ Tiếu Mỹ Tho', cuisine: ['Vietnamese'], price: 'low', prep: 8, slug: 'hu-tieu-my-tho' },
  { name: 'Bánh Xèo 46A', cuisine: ['Vietnamese'], price: 'low', prep: 15, slug: 'banh-xeo-46a' },
  { name: 'Bánh Khọt Vũng Tàu', cuisine: ['Vietnamese'], price: 'medium', prep: 15, slug: 'banh-khot-vung-tau' },
  { name: 'Lẩu Dê 404', cuisine: ['Vietnamese', 'Hotpot'], price: 'high', prep: 20, slug: 'lau-de-404' },
  { name: 'Lẩu Bò 58', cuisine: ['Vietnamese', 'Hotpot'], price: 'high', prep: 20, slug: 'lau-bo-58' },
  { name: 'Ốc Đào', cuisine: ['Vietnamese', 'Seafood'], price: 'medium', prep: 15, slug: 'oc-dao' },
  { name: 'Ốc Oanh', cuisine: ['Vietnamese', 'Seafood'], price: 'medium', prep: 15, slug: 'oc-oanh' },
  { name: 'Chè Thái Ý', cuisine: ['Vietnamese', 'Desserts'], price: 'low', prep: 5, slug: 'che-thai-y' },
  { name: 'Chè Mười Sáu', cuisine: ['Vietnamese', 'Desserts'], price: 'low', prep: 5, slug: 'che-muoi-sau' },
  { name: 'Trà Sữa Gong Cha', cuisine: ['Drinks'], price: 'low', prep: 5, slug: 'gong-cha' },
  { name: 'Trà Sữa Phúc Long', cuisine: ['Drinks'], price: 'low', prep: 5, slug: 'phuc-long' },
  { name: 'Cà Phê Cộng', cuisine: ['Drinks', 'Vietnamese'], price: 'low', prep: 5, slug: 'cong-caphe' },
  { name: 'Cà Phê Đen Đá', cuisine: ['Drinks', 'Vietnamese'], price: 'low', prep: 5, slug: 'ca-phe-den-da' },
  { name: 'Pizza 4Ps', cuisine: ['Italian', 'Japanese'], price: 'high', prep: 20, slug: 'pizza-4ps' },
  { name: 'Pizza Home', cuisine: ['Italian'], price: 'medium', prep: 18, slug: 'pizza-home' },
  { name: 'Sushi Uchi', cuisine: ['Japanese'], price: 'high', prep: 15, slug: 'sushi-uchi' },
  { name: 'Sushi Nhí', cuisine: ['Japanese'], price: 'medium', prep: 15, slug: 'sushi-nhi' },
  { name: 'Mì Ramen Ipidu', cuisine: ['Japanese'], price: 'medium', prep: 12, slug: 'ramen-ipidu' },
  { name: 'Bò Né 3 Ngon', cuisine: ['Vietnamese', 'Western'], price: 'medium', prep: 15, slug: 'bo-ne-3-ngon' },
  { name: 'Gà Rán KFC Lý Tự Trọng', cuisine: ['Fast Food'], price: 'medium', prep: 8, slug: 'kfc-ly-tu-trong' },
  { name: 'Gà Rán Popeyes', cuisine: ['Fast Food'], price: 'medium', prep: 8, slug: 'popeyes' },
  { name: 'Burger King Saigon', cuisine: ['Fast Food', 'Western'], price: 'medium', prep: 10, slug: 'burger-king' },
  { name: 'Bún Đậu Mắm Tôm', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'bun-dau-mam-tom' },
  { name: 'Bánh Cuốn Nóng', cuisine: ['Vietnamese'], price: 'low', prep: 8, slug: 'banh-cuon-nong' },
  { name: 'Bánh Ướt Thịt Nướng', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'banh-uot-thit-nuong' },
  { name: 'Mì Quảng Đà Nẵng', cuisine: ['Vietnamese'], price: 'low', prep: 10, slug: 'mi-quang-da-nang' },
  { name: 'Bánh Canh Cua', cuisine: ['Vietnamese', 'Seafood'], price: 'medium', prep: 12, slug: 'banh-canh-cua' },
  { name: 'Dimsum Hà Tôn Quyền', cuisine: ['Chinese'], price: 'medium', prep: 10, slug: 'dimsum-ha-ton-quyen' },
  { name: 'Cơm Niêu Sài Gòn', cuisine: ['Vietnamese'], price: 'low', prep: 12, slug: 'com-nieu-sai-gon' },
  { name: 'Gỏi Cuốn Tôm Thịt', cuisine: ['Vietnamese'], price: 'low', prep: 8, slug: 'goi-cuon-tom-thit' },
  { name: 'Nước Mía Siêu Sạch', cuisine: ['Drinks'], price: 'low', prep: 5, slug: 'nuoc-mia-sieu-sach' },
  { name: 'Sinh Tố 142', cuisine: ['Drinks', 'Desserts'], price: 'low', prep: 8, slug: 'sinh-to-142' },
  { name: 'Yaourt Đá Xay', cuisine: ['Desserts', 'Drinks'], price: 'low', prep: 5, slug: 'yaourt-da-xay' },
  { name: 'Bò Bía Ngọt', cuisine: ['Vietnamese', 'Desserts'], price: 'low', prep: 5, slug: 'bo-bia-ngot' },
  { name: 'Kem Bạch Đằng', cuisine: ['Desserts'], price: 'low', prep: 5, slug: 'kem-bach-dang' },
  { name: 'Bánh Flan Sài Gòn', cuisine: ['Desserts'], price: 'low', prep: 8, slug: 'banh-flan-sai-gon' },
]

// ─── Menu data by restaurant type ───
type SeedMenuTemplate = {
  cat: string
  items: Array<{ name: string; price: number }>
}

const MENU_DATA: Record<string, SeedMenuTemplate> = {
  pho: {
    cat: 'Phở', items: [
      { name: 'Phở bò tái', price: 55000 }, { name: 'Phở bò chín', price: 55000 },
      { name: 'Phở tái nạm', price: 65000 }, { name: 'Phở tái gầu', price: 65000 },
      { name: 'Phở gà', price: 50000 }, { name: 'Phở đặc biệt', price: 85000 },
      { name: 'Phở không thịt', price: 35000 },
    ]
  },
  bun_bo: {
    cat: 'Bún Bò', items: [
      { name: 'Bún bò đặc biệt', price: 55000 }, { name: 'Bún bò thập cẩm', price: 45000 },
      { name: 'Bún bò chay', price: 35000 }, { name: 'Bún bò giò heo', price: 60000 },
    ]
  },
  com_tam: {
    cat: 'Cơm Tấm', items: [
      { name: 'Cơm tấm sườn', price: 40000 }, { name: 'Cơm tấm sườn bì chả', price: 50000 },
      { name: 'Cơm tấm gà nướng', price: 50000 }, { name: 'Cơm tấm đặc biệt', price: 65000 },
      { name: 'Cơm tấm sườn cốt lết', price: 55000 },
    ]
  },
  banh_mi: {
    cat: 'Bánh Mì', items: [
      { name: 'Bánh mì đặc biệt', price: 35000 }, { name: 'Bánh mì thịt nướng', price: 30000 },
      { name: 'Bánh mì chay', price: 20000 }, { name: 'Bánh mì xíu mại', price: 25000 },
      { name: 'Bánh mì bò kho', price: 40000 },
    ]
  },
  pizza: {
    cat: 'Pizza', items: [
      { name: 'Margherita', price: 199000 }, { name: 'Pepperoni', price: 249000 },
      { name: '4 Formaggi', price: 299000 }, { name: 'Hawaii', price: 229000 },
      { name: 'Diavola', price: 269000 },
    ]
  },
  sushi: {
    cat: 'Sushi', items: [
      { name: 'Salmon Sashimi 5pc', price: 199000 }, { name: 'Maguro Nigiri 2pc', price: 149000 },
      { name: 'California Roll 8pc', price: 169000 }, { name: 'Dragon Roll 8pc', price: 229000 },
      { name: 'Unagi Roll 8pc', price: 249000 },
    ]
  },
  drinks: {
    cat: 'Thức uống', items: [
      { name: 'Trà sữa trân châu', price: 45000 }, { name: 'Trà đào cam sả', price: 40000 },
      { name: 'Cà phê sữa đá', price: 35000 }, { name: 'Bạc xỉu', price: 35000 },
      { name: 'Sinh tố bơ', price: 50000 }, { name: 'Nước ép cam', price: 40000 },
    ]
  },
  fast_food: {
    cat: 'Gà Rán', items: [
      { name: 'Gà rán 2 miếng', price: 55000 }, { name: 'Gà rán 4 miếng', price: 99000 },
      { name: 'Burger gà', price: 45000 }, { name: 'Combo gà + khoai', price: 89000 },
      { name: 'Gà viên chiên', price: 35000 },
    ]
  },
  hotpot: {
    cat: 'Lẩu', items: [
      { name: 'Lẩu thập cẩm', price: 299000 }, { name: 'Lẩu riêu cua', price: 249000 },
      { name: 'Lẩu hải sản', price: 399000 },
    ]
  },
  seafood: {
    cat: 'Hải sản', items: [
      { name: 'Ốc hương rang muối', price: 89000 }, { name: 'Nghêu hấp sả', price: 69000 },
      { name: 'Sò điệp nướng mỡ hành', price: 99000 }, { name: 'Càng ghẹ rang me', price: 149000 },
    ]
  },
  desserts: {
    cat: 'Tráng miệng', items: [
      { name: 'Chè Thái', price: 30000 }, { name: 'Chè bà ba', price: 25000 },
      { name: 'Yaourt đá xay', price: 20000 }, { name: 'Kem chuối', price: 15000 },
      { name: 'Bánh flan', price: 15000 },
    ]
  },
  bun_cha: {
    cat: 'Bún Chả', items: [
      { name: 'Bún chả Hà Nội', price: 45000 }, { name: 'Bún chả que tre', price: 55000 },
      { name: 'Nem rán 4 cái', price: 35000 },
    ]
  },
}

const CATEGORY_MAP: Record<string, string[]> = {
  pho: ['Phở', 'Thức uống'],
  bun_bo: ['Bún Bò', 'Thức uống'],
  com_tam: ['Cơm Tấm', 'Thức uống'],
  banh_mi: ['Bánh Mì', 'Thức uống'],
  pizza: ['Pizza', 'Mì Ý', 'Thức uống'],
  sushi: ['Sushi', 'Sashimi', 'Thức uống'],
  drinks: ['Thức uống', 'Bánh ngọt'],
  fast_food: ['Gà Rán', 'Burger', 'Thức uống'],
  hotpot: ['Lẩu', 'Thức uống'],
  seafood: ['Hải sản', 'Thức uống'],
  desserts: ['Tráng miệng', 'Thức uống'],
  bun_cha: ['Bún Chả', 'Thức uống'],
}

// ─── Driver Vietnamese names ───
const DRIVER_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý']
const DRIVER_MIDDLE_NAMES = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Thanh', 'Quốc', 'Tuấn', 'Ngọc', 'Hồng']
const DRIVER_FIRST_NAMES = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hải', 'Hùng', 'Khang', 'Linh', 'Long', 'Mai', 'Nam', 'Phong', 'Quân', 'Tâm', 'Thảo', 'Trang', 'Tuấn', 'Việt']

let seedState = 0x5f3759df

function seededRandom(): number {
  seedState = (seedState * 1664525 + 1013904223) >>> 0
  return seedState / 0x100000000
}

function chance(probability: number): boolean {
  return seededRandom() < probability
}

function rand(min: number, max: number): number { return min + seededRandom() * (max - min) }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)) }
function pick<T>(arr: T[]): T { return arr[Math.floor(seededRandom() * arr.length)] }
function jitter(base: number, pct: number): number { return base * (1 + (seededRandom() - 0.5) * 2 * pct / 100) }

type CanonicalAiOrder = {
  orderCode: string
  status: OrderStatus
  total: number
  driverId?: string
  createdMinutesAgo: number
  note: string
}

const ACTIVE_DRIVER_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.driver_assigned,
  OrderStatus.driver_arriving_restaurant,
  OrderStatus.picked_up,
  OrderStatus.delivering,
])

async function upsertCanonicalAiSmokeOrders(
  restaurantIds: string[],
  driverIds: string[],
): Promise<number> {
  const customer = await prisma.user.findUnique({
    where: { email: 'customer1@foodflow.vn' },
    select: { id: true },
  })
  const restaurantId = restaurantIds[0]
  const smokeDriverIds = driverIds.slice(0, 6)
  if (!customer || !restaurantId || smokeDriverIds.length !== 6 || new Set(smokeDriverIds).size !== 6) {
    throw new Error('Canonical AI smoke seed requires customer1, one restaurant, and six distinct drivers')
  }

  const address = await prisma.address.findFirst({
    where: { userId: customer.id },
    select: { id: true },
  })
  const menuItem = await prisma.menuItem.findFirst({
    where: { restaurantId, isAvailable: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, basePrice: true },
  })
  if (!address || !menuItem) {
    throw new Error('Canonical AI smoke seed requires one customer address and one menu item')
  }

  const orders: CanonicalAiOrder[] = [
    { orderCode: 'FF-001', status: OrderStatus.delivering, total: 85_000, driverId: smokeDriverIds[0], createdMinutesAgo: 24, note: 'AI smoke: status happy path' },
    { orderCode: 'FF-002', status: OrderStatus.delivering, total: 120_000, driverId: smokeDriverIds[1], createdMinutesAgo: 75, note: 'AI smoke: delayed angry escalation' },
    { orderCode: 'FF-003', status: OrderStatus.completed, total: 92_000, driverId: smokeDriverIds[2], createdMinutesAgo: 5, note: 'AI smoke: short delay refund ineligible' },
    { orderCode: 'FF-004', status: OrderStatus.delivering, total: 68_000, driverId: smokeDriverIds[3], createdMinutesAgo: 18, note: 'AI smoke: multi-turn retention' },
    { orderCode: 'FF-006', status: OrderStatus.preparing, total: 50_000, createdMinutesAgo: 12, note: 'AI smoke: eligible partial refund grounding' },
    { orderCode: 'FF-007', status: OrderStatus.delivering, total: 110_000, driverId: smokeDriverIds[4], createdMinutesAgo: 45, note: 'AI smoke: driver unreachable escalation' },
    { orderCode: 'FF-008', status: OrderStatus.preparing, total: 73_000, createdMinutesAgo: 8, note: 'AI smoke: cancellation safety' },
    { orderCode: 'FF-009', status: OrderStatus.delivering, total: 77_000, driverId: smokeDriverIds[5], createdMinutesAgo: 16, note: 'AI smoke: English language match' },
    { orderCode: 'FF-010', status: OrderStatus.preparing, total: 64_000, createdMinutesAgo: 6, note: 'AI smoke: allergy support priority' },
  ]

  const activeDriverIds = orders
    .filter(order => ACTIVE_DRIVER_ORDER_STATUSES.has(order.status))
    .map(order => order.driverId)
  if (activeDriverIds.some(driverId => !driverId) || new Set(activeDriverIds).size !== activeDriverIds.length) {
    throw new Error('Canonical AI smoke seed must assign one distinct driver to each active order')
  }

  for (const canonical of orders) {
    const createdAt = new Date(Date.now() - canonical.createdMinutesAgo * 60_000)
    const deliveryFee = 10_000
    const subtotal = canonical.total - deliveryFee
    const itemQuantity = Math.max(1, Math.round(subtotal / Number(menuItem.basePrice)))
    const existing = await prisma.order.findUnique({
      where: { orderCode: canonical.orderCode },
      select: { id: true },
    })

    if (existing) {
      await prisma.orderItem.deleteMany({ where: { orderId: existing.id } })
      await prisma.order.update({
        where: { id: existing.id },
        data: {
          customerId: customer.id,
          restaurantId,
          driverId: canonical.driverId ?? null,
          deliveryAddressId: address.id,
          status: canonical.status,
          subtotal,
          deliveryFee,
          promotionDiscount: 0,
          total: canonical.total,
          paymentMethod: PaymentMethod.cash,
          notes: canonical.note,
          estimatedPrepTimeMinutes: 15,
          estimatedDeliveryTimeMinutes: 30,
          createdAt,
          updatedAt: createdAt,
          orderItems: {
            create: [{
              menuItemId: menuItem.id,
              nameSnapshot: menuItem.name,
              quantity: itemQuantity,
              unitPrice: menuItem.basePrice,
              selectedOptions: [],
            }],
          },
        },
      })
    } else {
      await prisma.order.create({
        data: {
          orderCode: canonical.orderCode,
          customerId: customer.id,
          restaurantId,
          driverId: canonical.driverId ?? null,
          deliveryAddressId: address.id,
          status: canonical.status,
          subtotal,
          deliveryFee,
          promotionDiscount: 0,
          total: canonical.total,
          paymentMethod: PaymentMethod.cash,
          notes: canonical.note,
          estimatedPrepTimeMinutes: 15,
          estimatedDeliveryTimeMinutes: 30,
          createdAt,
          updatedAt: createdAt,
          orderItems: {
            create: [{
              menuItemId: menuItem.id,
              nameSnapshot: menuItem.name,
              quantity: itemQuantity,
              unitPrice: menuItem.basePrice,
              selectedOptions: [],
            }],
          },
        },
      })
    }
  }

  const driverOrder = await prisma.order.findUnique({
    where: { orderCode: 'FF-007' },
    select: { id: true, driverId: true },
  })
  if (driverOrder?.driverId) {
    await prisma.$executeRawUnsafe(
      'DELETE FROM driver_location_history WHERE driver_id = $1::uuid AND order_id = $2::uuid',
      driverOrder.driverId,
      driverOrder.id,
    )
    await prisma.$executeRawUnsafe(
      `INSERT INTO driver_location_history (driver_id, order_id, location, recorded_at)
       VALUES ($1::uuid, $2::uuid, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, NOW())`,
      driverOrder.driverId,
      driverOrder.id,
      106.7004,
      10.7757,
    )
  }

  return orders.length
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run prisma/big-seed.ts in production because it creates demo identities and synthetic business data. Use a reviewed production data import/bootstrap instead.',
    )
  }

  console.log('🌱 FoodFlow BIG SEED — generating rich data...\n')

  // ─── 1. Admin ───
  const adminHash = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@foodflow.vn' },
    update: {}, create: { email: 'admin@foodflow.vn', passwordHash: adminHash, fullName: 'Admin FoodFlow', role: 'admin', phone: '0900000000', isActive: true },
  })
  console.log('✅ Admin created')

  // ─── 2. Restaurants (50+) ───
  const restaurantIds: string[] = []
  const restaurantLocations: Array<{ id: string; lat: number; lng: number; name: string; prep: number }> = []

  for (let i = 0; i < RESTAURANT_TEMPLATES.length; i++) {
    const t = RESTAURANT_TEMPLATES[i]
    const district = pick(DISTRICTS)
    const lat = jitter(district.lat, 2)
    const lng = jitter(district.lng, 2)
    const streetNum = randInt(1, 500)
    const street = pick(STREETS)
    const slug = `${t.slug}-${i}`

    // Create owner
    const ownerHash = await bcrypt.hash('Partner@123', 12)
    const ownerEmail = `restaurant${i + 1}@foodflow.vn`
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: { email: ownerEmail, passwordHash: ownerHash, fullName: `Quản lý ${t.name}`, role: 'restaurant', phone: `0900000${String(100 + i).slice(-3)}`, isActive: true },
    })

    // Create restaurant with PostGIS point
    await prisma.$executeRawUnsafe(
      `INSERT INTO restaurants (id, name, slug, description, logo_url, cover_url, location, address_line, city, district, phone, cuisine_types, price_range, rating, total_reviews, is_open, is_active, prep_time_avg_minutes, min_order_amount, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, 'TP. Hồ Chí Minh', $9, $10, $11::text[], $12::"PriceRange", $13, $14, true, true, $15, $16, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         logo_url = EXCLUDED.logo_url,
         cover_url = EXCLUDED.cover_url,
         location = EXCLUDED.location,
         address_line = EXCLUDED.address_line,
         city = EXCLUDED.city,
         district = EXCLUDED.district,
         phone = EXCLUDED.phone,
         cuisine_types = EXCLUDED.cuisine_types,
         price_range = EXCLUDED.price_range,
         rating = EXCLUDED.rating,
         total_reviews = EXCLUDED.total_reviews,
         is_open = EXCLUDED.is_open,
         is_active = EXCLUDED.is_active,
         prep_time_avg_minutes = EXCLUDED.prep_time_avg_minutes,
         min_order_amount = EXCLUDED.min_order_amount`,
      t.name, slug, `${t.name} - Món ngon mỗi ngày tại ${district.name}`,
      `https://picsum.photos/seed/${slug}/200/200`, `https://picsum.photos/seed/${slug}-cover/800/400`,
      lng, lat,
      `${streetNum} ${street}, ${district.name}`,
      district.name,
      `090${String(1000000 + i).slice(-7)}`,
      `{${t.cuisine.join(',')}}`,
      toDatabasePriceRange(t.price as SeedPriceRange),
      jitter(4.0, 20), randInt(10, 500),
      t.prep, randInt(0, 3) * 10000,
    )

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
    if (!restaurant) { console.log(`  ⚠️ Restaurant ${slug} not found`); continue }
    restaurantIds.push(restaurant.id)
    restaurantLocations.push({ id: restaurant.id, lat, lng, name: t.name, prep: t.prep })

    // Create restaurant profile
    await prisma.restaurantProfile.upsert({
      where: { userId: owner.id }, update: {},
      create: { userId: owner.id, restaurantId: restaurant.id },
    })

    // Opening hours (6AM-10PM, some close earlier on Sunday)
    const openingHoursCount = await prisma.restaurantOpeningHour.count({ where: { restaurantId: restaurant.id } })
    if (openingHoursCount === 0) {
      for (let day = 0; day < 7; day++) {
        const isSunday = day === 0
        await prisma.restaurantOpeningHour.create({
          data: { restaurantId: restaurant.id, dayOfWeek: day, openTime: '06:00', closeTime: isSunday ? '21:00' : '22:00' },
        })
      }
    }

    // Menu items
    const existingMenuItems = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } })
    if (existingMenuItems === 0) {
      const cuisineType = t.cuisine[0]
      let menuType = 'pho'
      if (t.slug.includes('pho')) menuType = 'pho'
      else if (t.slug.includes('bun-bo')) menuType = 'bun_bo'
      else if (t.slug.includes('com-tam') || t.slug.includes('com-ga') || t.slug.includes('com-nieu')) menuType = 'com_tam'
      else if (t.slug.includes('banh-mi')) menuType = 'banh_mi'
      else if (t.slug.includes('pizza')) menuType = 'pizza'
      else if (t.slug.includes('sushi') || t.slug.includes('ramen')) menuType = 'sushi'
      else if (t.slug.includes('che') || t.slug.includes('sinh-to') || t.slug.includes('kem') || t.slug.includes('yaourt') || t.slug.includes('flan') || t.slug.includes('bo-bia')) menuType = 'desserts'
      else if (t.slug.includes('tra-sua') || t.slug.includes('ca-phe') || t.slug.includes('nuoc-mia') || t.slug.includes('gong') || t.slug.includes('phuc-long') || t.slug.includes('cong-')) menuType = 'drinks'
      else if (t.slug.includes('kfc') || t.slug.includes('popeyes') || t.slug.includes('burger') || t.slug.includes('ga-ran')) menuType = 'fast_food'
      else if (t.slug.includes('lau')) menuType = 'hotpot'
      else if (t.slug.includes('oc') || t.slug.includes('banh-canh-cua')) menuType = 'seafood'
      else if (t.slug.includes('bun-cha')) menuType = 'bun_cha'

      const menuTemplate = MENU_DATA[menuType] ?? MENU_DATA.pho
      const cats = CATEGORY_MAP[menuType] ?? ['Món chính', 'Thức uống']

      for (let ci = 0; ci < cats.length; ci++) {
        const category = await prisma.category.create({
          data: { restaurantId: restaurant.id, name: cats[ci], sortOrder: ci },
        })

        const itemsForCat = ci === 0 ? menuTemplate.items : (MENU_DATA.drinks?.items ?? [])
        for (const item of itemsForCat.slice(0, ci === 0 ? randInt(3, 7) : randInt(1, 3))) {
          await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id, categoryId: category.id,
              name: item.name, basePrice: jitter(item.price, 15),
              description: `${item.name} thơm ngon, nguyên liệu tươi sống`,
              imageUrl: `https://picsum.photos/seed/${slug}-${item.name.toLowerCase().replace(/\s/g, '-')}/400/400`,
              isPopular: chance(0.4),
            },
          })
        }
      }
    }
  }
  console.log(`✅ ${RESTAURANT_TEMPLATES.length} restaurants with menus created`)

  // ─── 3. Drivers (50+) ───
  const driverIds: string[] = []
  for (let i = 0; i < 50; i++) {
    const lastName = pick(DRIVER_LAST_NAMES)
    const middleName = pick(DRIVER_MIDDLE_NAMES)
    const firstName = pick(DRIVER_FIRST_NAMES)
    const fullName = `${lastName} ${middleName} ${firstName}`
    const driverHash = await bcrypt.hash('Driver@123', 12)
    const email = `driver${i + 1}@foodflow.vn`

    const driver = await prisma.user.upsert({
      where: { email }, update: {},
      create: { email, passwordHash: driverHash, fullName, role: 'driver', phone: `090${String(2000000 + i).slice(-7)}`, isActive: true },
    })

    const dist = pick(DISTRICTS)
    const profileData = {
      licenseNumber: `LIC-${String(100000 + i)}`,
      vehicleType: chance(0.9) ? VehicleType.motorbike : VehicleType.car,
      vehiclePlate: `59${String.fromCharCode(65 + randInt(0, 25))}1-${String(10000 + i).slice(-5)}`,
      isVerified: i < 10 || chance(0.85),
      rating: jitter(4.2, 20),
      totalDeliveries: randInt(20, 2000),
      totalEarnings: randInt(2000000, 80000000),
      currentLat: jitter(dist.lat, 3),
      currentLng: jitter(dist.lng, 3),
    }
    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: profileData,
      create: { userId: driver.id, ...profileData },
    })
    driverIds.push(driver.id)
  }
  console.log(`✅ 50 drivers created`)

  // ─── 4. Customers (100+) ───
  const customerIds: string[] = []
  for (let i = 0; i < 100; i++) {
    const lastName = pick(DRIVER_LAST_NAMES)
    const firstName = pick(DRIVER_FIRST_NAMES)
    const fullName = `${lastName} ${firstName}`
    const customerHash = await bcrypt.hash('Customer@123', 12)
    const email = `customer${i + 1}@foodflow.vn`

    const customer = await prisma.user.upsert({
      where: { email }, update: {},
      create: { email, passwordHash: customerHash, fullName, role: 'customer', phone: `090${String(3000000 + i).slice(-7)}`, isActive: true },
    })

    await prisma.customerProfile.upsert({
      where: { userId: customer.id }, update: {},
      create: { userId: customer.id, totalOrders: randInt(0, 100) },
    })

    // 1-3 addresses per customer
    const existingAddresses = await prisma.address.count({ where: { userId: customer.id } })
    if (existingAddresses === 0) {
    const numAddresses = randInt(1, 3)
    for (let a = 0; a < numAddresses; a++) {
      const dist = pick(DISTRICTS)
      const addrLat = jitter(dist.lat, 3)
      const addrLng = jitter(dist.lng, 3)
      const labels = ['Nhà', 'Công ty', 'Trường học', 'Nhà bạn']
      await prisma.$executeRawUnsafe(
        `INSERT INTO addresses (id, user_id, label, address_line, location, is_default, created_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, NOW())`,
        customer.id, a < labels.length ? labels[a] : `Địa chỉ ${a + 1}`,
        `${randInt(1, 500)} ${pick(STREETS)}, ${dist.name}`,
        addrLng, addrLat, a === 0,
      )
    }
    }
    customerIds.push(customer.id)
  }
  console.log(`✅ 100 customers with addresses created`)

  // ─── 5. Promotions ───
  const promos = [
    { code: 'WELCOME20', type: 'percentage', value: 20, minOrder: 50000, maxDiscount: 50000, limit: 1000 },
    { code: 'WELCOME30', type: 'percentage', value: 30, minOrder: 100000, maxDiscount: 70000, limit: 500 },
    { code: 'FREESHIP', type: 'fixed', value: 15000, minOrder: 100000, maxDiscount: 15000, limit: 1000 },
    { code: 'SUMMER50', type: 'percentage', value: 50, minOrder: 200000, maxDiscount: 100000, limit: 200 },
    { code: 'NEWYEAR25', type: 'percentage', value: 25, minOrder: 150000, maxDiscount: 80000, limit: 300 },
    { code: 'LUNCH10', type: 'fixed', value: 10000, minOrder: 50000, maxDiscount: 10000, limit: 2000 },
    { code: 'DINNER20', type: 'percentage', value: 20, minOrder: 200000, maxDiscount: 60000, limit: 500 },
    { code: 'DRINKFREE', type: 'fixed', value: 15000, minOrder: 80000, maxDiscount: 15000, limit: 800 },
    { code: 'RAIN50', type: 'percentage', value: 50, minOrder: 50000, maxDiscount: 40000, limit: 100 },
    { code: 'BIGORDER', type: 'percentage', value: 15, minOrder: 300000, maxDiscount: 100000, limit: 300 },
  ]
  for (const p of promos) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO promotions (id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, starts_at, expires_at, is_active)
       VALUES (gen_random_uuid(), $1, $2::"PromotionType", $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE SET
         type = EXCLUDED.type,
         value = EXCLUDED.value,
         min_order_amount = EXCLUDED.min_order_amount,
         max_discount = EXCLUDED.max_discount,
         usage_limit = EXCLUDED.usage_limit,
         usage_count = EXCLUDED.usage_count,
         starts_at = EXCLUDED.starts_at,
         expires_at = EXCLUDED.expires_at,
         is_active = EXCLUDED.is_active`,
      p.code, p.type, p.value, p.minOrder, p.maxDiscount, p.limit, chance(0.7) ? randInt(0, p.limit) : 0,
      new Date('2026-01-01'), new Date('2026-12-31'), chance(0.8),
    )
  }
  console.log(`✅ ${promos.length} promotions created`)

  // ─── 6. Historical Orders (500+) ───
  const HISTORICAL_ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.cancelled,
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.completed,
    OrderStatus.cancelled,
  ]
  let ordersCreated = 0

  for (let i = 0; i < 500; i++) {
    const customerId = pick(customerIds)
    const restaurant = pick(restaurantLocations)
    const driverId = pick(driverIds)
    const status = pick(HISTORICAL_ORDER_STATUSES)

    // Get a random address for this customer
    const address = await prisma.address.findFirst({
      where: { userId: customerId },
      select: { id: true },
    })
    if (!address) continue

    // Get menu items for this restaurant
    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id, isAvailable: true },
      take: randInt(1, 4),
    })
    if (items.length === 0) continue

    const orderCode = `FD${String(i + 1).padStart(10, '0')}`
    const existingOrder = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true, status: true },
    })
    if (existingOrder) {
      if (ACTIVE_DRIVER_ORDER_STATUSES.has(existingOrder.status)) {
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { status: OrderStatus.completed },
        })
      }
      continue
    }

    const selectedItems = items.map(item => ({ item, quantity: randInt(1, 3) }))
    const subtotal = selectedItems.reduce(
      (sum, { item, quantity }) => sum + Number(item.basePrice) * quantity,
      0,
    )
    const deliveryFee = randInt(10000, 30000)
    const promotionDiscount = chance(0.3) ? randInt(5000, 30000) : 0
    const total = subtotal + deliveryFee - promotionDiscount
    const daysAgo = randInt(0, 60)
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - randInt(0, 86400000))

    await prisma.order.create({
      data: {
        orderCode,
        customerId,
        restaurantId: restaurant.id,
        driverId,
        deliveryAddressId: address.id,
        status,
        subtotal,
        deliveryFee,
        promotionDiscount,
        total,
        paymentMethod: PaymentMethod.cash,
        estimatedPrepTimeMinutes: restaurant.prep || 15,
        createdAt,
        updatedAt: createdAt,
        orderItems: {
          create: selectedItems.map(({ item, quantity }) => ({
            menuItemId: item.id,
            nameSnapshot: item.name,
            quantity,
            unitPrice: item.basePrice,
            selectedOptions: [],
          })),
        },
      },
    })
    ordersCreated++
  }
  console.log(`✅ ${ordersCreated} historical orders created`)

  const canonicalAiOrdersCreated = await upsertCanonicalAiSmokeOrders(restaurantIds, driverIds)
  console.log(`✅ ${canonicalAiOrdersCreated} canonical AI smoke orders upserted`)

  // ─── 7. Reviews ───
  const completedOrders = await prisma.$queryRawUnsafe<Array<{ id: string; customer_id: string; restaurant_id: string; driver_id: string | null }>>(
    `SELECT id, customer_id, restaurant_id, driver_id FROM orders WHERE status = 'completed' LIMIT 200`,
  ) as Array<{ id: string; customer_id: string; restaurant_id: string; driver_id: string | null }>

  let reviewsCreated = 0
  const reviewComments = [
    'Ngon, giao nhanh!', 'Đồ ăn ngon, đóng gói cẩn thận', 'Hơi nguội nhưng vẫn ngon',
    'Tuyệt vời!', 'Sẽ đặt lại', 'Giao hơi chậm nhưng đồ ăn ngon',
    'Rất hài lòng', 'Đồ ăn đúng mô tả', 'Tài xế thân thiện',
    'Ngon, giá hợp lý', 'Quán làm nhanh, giao đúng giờ',
  ]
  for (const order of completedOrders) {
    if (chance(0.4)) continue
    const existingReview = await prisma.review.findUnique({
      where: { orderId: order.id },
      select: { id: true },
    })
    if (existingReview) continue

    await prisma.review.create({
      data: {
        orderId: order.id, customerId: order.customer_id,
        restaurantId: order.restaurant_id, driverId: order.driver_id,
        foodRating: randInt(3, 5), deliveryRating: randInt(3, 5),
        comment: pick(reviewComments),
      },
    })
    reviewsCreated++
  }
  console.log(`✅ ${reviewsCreated} reviews created`)

  console.log(`\n🎉 BIG SEED COMPLETE!`)
  console.log(`   ${RESTAURANT_TEMPLATES.length} restaurants · 50 drivers · 100 customers`)
  console.log(`   ${ordersCreated} orders · ${reviewsCreated} reviews · ${promos.length} promotions`)
  console.log(`   Run: docker compose up -d && pnpm db:big-seed`)
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1) })
