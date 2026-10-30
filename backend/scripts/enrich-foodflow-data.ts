import { PrismaClient, PromotionType } from '@prisma/client'
import { withVerifiedDatabaseTls } from '../src/database/database-tls'

interface RestaurantSeed {
  name: string
  slug: string
  cuisine: string[]
  price: 'low' | 'medium' | 'high'
  prep: number
  minOrder: number
  rating: number
  reviews: number
  lat: number
  lng: number
  district: string
  address: string
  items: Array<{ name: string; price: number; desc: string; isPopular?: boolean }>
}

const NEW_RESTAURANTS: RestaurantSeed[] = [
  {
    name: 'Phở Thìn Lò Đúc',
    slug: 'pho-thin-lo-duc',
    cuisine: ['Vietnamese'],
    price: 'medium',
    prep: 8,
    minOrder: 30000,
    rating: 4.8,
    reviews: 186,
    lat: 10.7780,
    lng: 106.6990,
    district: 'Quận 1',
    address: '12 Lê Lợi, Phường Bến Nghé',
    items: [
      { name: 'Phở bò tái lăn đặc trưng', price: 75000, desc: 'Thịt bò xào lăn tỏi gừng thơm nức mũi trên chảo lửa lớn, nước dùng béo ngọt ngập hành lá tươi.', isPopular: true },
      { name: 'Phở bò sốt vang', price: 85000, desc: 'Bò hầm rượu vang thơm nồng, gân mềm giòn đậm vị truyền thống.', isPopular: true },
      { name: 'Phở tái gân giòn', price: 75000, desc: 'Gân bò giòn sần sật kết hợp thịt bò tái mềm ngọt thanh.', isPopular: false },
      { name: 'Quẩy giòn vàng ruộm (3 cái)', price: 12000, desc: 'Quẩy nhà làm giòn xốp, nhúng nước dùng phở ăn cực bắt vị.', isPopular: false },
      { name: 'Trứng chần nước béo', price: 15000, desc: 'Trứng gà ta chần lòng đào cùng nước cốt phở đậm đà.', isPopular: false },
      { name: 'Trà sâm dứa đá', price: 15000, desc: 'Trà sâm dứa thơm thanh mát giải ngấy.', isPopular: false },
    ],
  },
  {
    name: 'Cơm Tấm Ba Ghiền',
    slug: 'com-tam-ba-ghien',
    cuisine: ['Vietnamese'],
    price: 'low',
    prep: 10,
    minOrder: 30000,
    rating: 4.7,
    reviews: 245,
    lat: 10.7950,
    lng: 106.6750,
    district: 'Phú Nhuận',
    address: '84 Đặng Văn Ngữ, Phường 10',
    items: [
      { name: 'Cơm tấm sườn cọng khổng lồ', price: 95000, desc: 'Miếng sườn nướng than hoa to che kín đĩa cơm, ướp mật ong vàng óng thơm lừng.', isPopular: true },
      { name: 'Cơm sườn bì chả ốp la', price: 85000, desc: 'Đầy đủ sườn nướng mềm ngọt, bì heo giòn bùi, chả trứng béo ngậy và trứng ốp la.', isPopular: true },
      { name: 'Cơm gà nướng ngũ vị', price: 69000, desc: 'Đùi gà góc tư nướng xém cạnh da giòn thịt mọng nước.', isPopular: false },
      { name: 'Canh khổ qua nhồi thịt', price: 28000, desc: 'Khổ qua hầm thịt nạc xay mộc nhĩ thanh mát giải nhiệt.', isPopular: false },
      { name: 'Chả trứng hấp nấm mèo', price: 20000, desc: 'Miếng chả trứng dày dặn, béo bùi từ thịt và trứng tươi.', isPopular: false },
      { name: 'Nước mía tắc nguyên chất', price: 18000, desc: 'Nước mía ép tươi cùng quả tắc chua ngọt sảng khoái.', isPopular: false },
    ],
  },
  {
    name: 'Bún Bò Gốc Huế O Mai',
    slug: 'bun-bo-goc-hue-o-mai',
    cuisine: ['Vietnamese'],
    price: 'low',
    prep: 10,
    minOrder: 25000,
    rating: 4.8,
    reviews: 142,
    lat: 10.7810,
    lng: 106.6850,
    district: 'Quận 3',
    address: '209 Nguyễn Đình Chiểu, Phường 5',
    items: [
      { name: 'Bún bò bắp hoa giò heo', price: 65000, desc: 'Bắp bò hoa giòn sần sật, móng giò heo mềm rục cùng nước dùng ruốc sả chuẩn vị Cố Đô.', isPopular: true },
      { name: 'Bún bò chả cua Huế đặc biệt', price: 75000, desc: 'Chả cua làm từ thịt cua biển tươi thơm ngọt cùng bắp bò và gân.', isPopular: true },
      { name: 'Bánh bột lọc tôm thịt (5 cái)', price: 35000, desc: 'Vỏ bánh trong suốt dai mềm bọc tôm sông và thịt ba chỉ rim đậm đà.', isPopular: false },
      { name: 'Bánh nậm lá chuối', price: 30000, desc: 'Bột gạo mịn màng nhân tôm thịt xay hấp lá chuối thơm nức.', isPopular: false },
      { name: 'Chè hạt sen long nhãn', price: 25000, desc: 'Chè hạt sen bùi béo ngọt thanh giải nhiệt ngày hè.', isPopular: false },
    ],
  },
  {
    name: 'Cơm Gà Xối Mỡ 142',
    slug: 'com-ga-xoi-mo-142',
    cuisine: ['Vietnamese'],
    price: 'low',
    prep: 12,
    minOrder: 25000,
    rating: 4.6,
    reviews: 198,
    lat: 10.7510,
    lng: 106.6690,
    district: 'Quận 5',
    address: '142 Ba Đình, Phường 10',
    items: [
      { name: 'Cơm đùi gà xối mỡ góc tư', price: 62000, desc: 'Đùi gà xối mỡ da giòn rụm màu cánh gián, thịt bên trong mềm mọng thơm ngọt.', isPopular: true },
      { name: 'Cơm cánh gà xối mỡ sốt bơ tỏi', price: 55000, desc: 'Cánh gà chiên giòn quyện sốt bơ tỏi béo ngậy thơm lừng.', isPopular: false },
      { name: 'Cơm chiên dương châu lòng đỏ trứng', price: 45000, desc: 'Hạt cơm vàng óng tơi xốp chiên cùng xá xíu, tôm khô và lạp xưởng.', isPopular: false },
      { name: 'Canh rong biển thịt bằm', price: 20000, desc: 'Canh rong biển nấu nóng sốt cùng thịt bằm tươi ngon.', isPopular: false },
      { name: 'Trà tắc xí muội', price: 18000, desc: 'Vị chua ngọt của tắc hòa cùng vị mặn mòi của xí muội đá.', isPopular: false },
    ],
  },
  {
    name: 'Hủ Tiếu Nam Vang Nhân Quán',
    slug: 'hu-tieu-nam-vang-nhan-quan',
    cuisine: ['Vietnamese', 'Chinese'],
    price: 'medium',
    prep: 8,
    minOrder: 35000,
    rating: 4.7,
    reviews: 310,
    lat: 10.7680,
    lng: 106.6920,
    district: 'Quận 1',
    address: '122 Nguyễn Trãi, Phường Bến Thành',
    items: [
      { name: 'Hủ tiếu Nam Vang khô đặc biệt', price: 79000, desc: 'Sợi hủ tiếu dai trộn sốt tỏi ớt gia truyền, đầy đủ tôm sú, thịt nạc, gan, tim và trứng cút.', isPopular: true },
      { name: 'Hủ tiếu Nam Vang nước sườn tôm', price: 75000, desc: 'Nước lèo hầm xương ống và mực khô ngọt đậm đà trong veo.', isPopular: true },
      { name: 'Xương ống tủy hầm chấm muối tiêu chanh', price: 45000, desc: 'Khúc xương ống hầm mềm thơm, hút tủy béo ngậy.', isPopular: false },
      { name: 'Bánh bao xíu mại trứng muối', price: 28000, desc: 'Bánh bao nóng hổi nhân thịt xíu mại mỡ màng cùng trứng muối bùi béo.', isPopular: false },
      { name: 'Sâm mía lau rong biển', price: 18000, desc: 'Nước sâm thảo mộc nấu đường phèn thanh ngọt mát lành.', isPopular: false },
    ],
  },
  {
    name: 'Trà Sữa Gong Cha Vietnam',
    slug: 'tra-sua-gong-cha-vietnam',
    cuisine: ['Drinks', 'Desserts'],
    price: 'low',
    prep: 5,
    minOrder: 30000,
    rating: 4.8,
    reviews: 420,
    lat: 10.7725,
    lng: 106.7015,
    district: 'Quận 1',
    address: '83 Hồ Tùng Mậu, Phường Bến Nghé',
    items: [
      { name: 'Trà sữa trân châu hoàng kim', price: 58000, desc: 'Trà đen đậm vị quyện sữa thơm béo kết hợp trân châu hoàng kim dai giòn sần sật.', isPopular: true },
      { name: 'Trà Alisan kem sữa (Milk Foam)', price: 55000, desc: 'Trà Alisan thơm thanh khiết phủ lớp kem sữa béo ngậy mặn ngọt mê ly.', isPopular: true },
      { name: 'Trà xanh xoài trân châu trắng', price: 60000, desc: 'Trà xanh hoa nhài tươi mát cùng mứt xoài ngọt lịm và trân châu trắng thủy tinh.', isPopular: false },
      { name: 'Trà đào hồng mận hạt é', price: 52000, desc: 'Vị chua ngọt sảng khoái từ đào và mận tươi, kết hợp hạt é giòn mát.', isPopular: false },
      { name: 'Bánh tart trứng nướng phô mai', price: 25000, desc: 'Vỏ bánh ngàn lớp giòn rụm bao bọc nhân trứng sữa béo thơm nức mũi.', isPopular: false },
    ],
  },
  {
    name: 'The Coffee House - Cao Thắng',
    slug: 'the-coffee-house-cao-thang',
    cuisine: ['Drinks'],
    price: 'low',
    prep: 5,
    minOrder: 25000,
    rating: 4.7,
    reviews: 380,
    lat: 10.7785,
    lng: 106.6890,
    district: 'Quận 3',
    address: '86 Cao Thắng, Phường 4',
    items: [
      { name: 'Cà phê sữa đá hạt Robusta Đắk Lắk', price: 39000, desc: 'Cà phê nguyên chất đậm đà phong vị Việt Nam hòa cùng sữa đặc sánh mịn.', isPopular: true },
      { name: 'Bạc xỉu ba tầng kem sữa', price: 39000, desc: 'Hương sữa ngọt ngào hòa quyện cùng chút đắng nhẹ của cà phê phin.', isPopular: false },
      { name: 'Trà đào cam sả trứ danh', price: 55000, desc: 'Hương sả nồng nàn quyện cùng vị ngọt của đào ngâm giòn và cam tươi mọng nước.', isPopular: true },
      { name: 'Trà sữa mắc ca trân châu dừa', price: 55000, desc: 'Trà sữa hạt mắc ca thơm bùi béo ngậy kết hợp topping trân châu cùi dừa độc đáo.', isPopular: false },
      { name: 'Bánh croissant trứng muối phô mai', price: 38000, desc: 'Bánh sừng bò nướng bơ Pháp thơm lừng nhân sốt trứng muối chảy.', isPopular: false },
    ],
  },
  {
    name: 'Bánh Mì Bảy Hổ 1930',
    slug: 'banh-mi-bay-ho-1930',
    cuisine: ['Vietnamese', 'Street Food'],
    price: 'low',
    prep: 5,
    minOrder: 20000,
    rating: 4.9,
    reviews: 290,
    lat: 10.7890,
    lng: 106.6940,
    district: 'Quận 1',
    address: '19 Huỳnh Khương Ninh, Phường Đa Kao',
    items: [
      { name: 'Bánh mì thịt luộc pate gia truyền', price: 35000, desc: 'Ổ bánh mì giòn tan, pate gan gia truyền hơn 80 năm béo ngậy cùng thịt luộc thái mỏng.', isPopular: true },
      { name: 'Bánh mì chả lụa xíu mại nước sốt', price: 35000, desc: 'Viên xíu mại mềm tan ngập trong nước sốt cà chua ngọt đậm đà.', isPopular: true },
      { name: 'Bánh mì chà bông bơ trứng tươi', price: 30000, desc: 'Bơ lòng đỏ trứng gà đánh tươi thơm ngậy cùng chà bông heo hảo hạng.', isPopular: false },
      { name: 'Sữa bắp non thanh trùng', price: 20000, desc: 'Sữa nấu từ bắp ngọt non sánh mịn thơm mát.', isPopular: false },
    ],
  },
  {
    name: 'Gà Rán Popeyes - Phú Mỹ Hưng',
    slug: 'ga-ran-popeyes-phu-my-hung',
    cuisine: ['Fast Food'],
    price: 'medium',
    prep: 10,
    minOrder: 40000,
    rating: 4.7,
    reviews: 215,
    lat: 10.7310,
    lng: 106.7120,
    district: 'Quận 7',
    address: '39 Nguyễn Thị Thập, Phường Tân Phú',
    items: [
      { name: 'Combo 2 miếng gà giòn cay kèm khoai và nước', price: 89000, desc: '2 miếng gà ướp gia vị Louisiana cay đậm đà, da giòn rụm kèm khoai tây chiên giòn.', isPopular: true },
      { name: 'Burger gà Cajun phô mai tan chảy', price: 59000, desc: 'Phi lê ức gà tẩm bột chiên giòn kẹp cùng phô mai Cheddar và sốt sốt Mayo cay.', isPopular: true },
      { name: 'Gà viên Popcorn Tender (8 viên)', price: 49000, desc: 'Thịt ức gà mềm ngọt chiên vàng thơm phức vừa miệng ăn.', isPopular: false },
      { name: 'Bánh biscuit mật ong bơ ngọt', price: 22000, desc: 'Bánh bơ nướng kiểu miền Nam nước Mỹ thơm béo quét mật ong.', isPopular: false },
    ],
  },
  {
    name: 'Sushi Hokkaido Sachi',
    slug: 'sushi-hokkaido-sachi',
    cuisine: ['Japanese'],
    price: 'high',
    prep: 18,
    minOrder: 100000,
    rating: 4.9,
    reviews: 350,
    lat: 10.7740,
    lng: 106.7030,
    district: 'Quận 1',
    address: '40 Đông Du, Phường Bến Nghé',
    items: [
      { name: 'Sashimi cá hồi Na Uy hảo hạng (5 lát)', price: 185000, desc: 'Thịt cá hồi vân mỡ đều tươi rói nhập khẩu trực tiếp từ Na Uy tan trong miệng.', isPopular: true },
      { name: 'Nigiri lươn Nhật nướng sốt Kabayaki', price: 145000, desc: 'Lươn biển Unagi nướng than hoa thơm lừng óng ả với sốt ngọt bí truyền.', isPopular: true },
      { name: 'Cơm cuộn bơ cá hồi Alaska (8 khoanh)', price: 165000, desc: 'Bơ sáp dẻo quánh cuộn cá hồi, phủ trứng cá chuồn giòn tanh tách.', isPopular: false },
      { name: 'Mì Ramen hải sản cay Hokkaido', price: 135000, desc: 'Nước dùng miso cay nồng đậm đà với tôm sú, mực tươi và trứng lòng đào Ajitsuke.', isPopular: false },
      { name: 'Súp miso rong biển đậu hũ non', price: 35000, desc: 'Súp tương đậu nành truyền thống nấu nóng hổi nhẹ nhàng.', isPopular: false },
    ],
  },
  {
    name: 'Bún Đậu Mắm Tôm Cô Khàn',
    slug: 'bun-dau-mam-tom-co-khan',
    cuisine: ['Vietnamese'],
    price: 'low',
    prep: 10,
    minOrder: 25000,
    rating: 4.8,
    reviews: 260,
    lat: 10.7710,
    lng: 106.6900,
    district: 'Quận 1',
    address: '102/26 Cống Quỳnh, Phường Phạm Ngũ Lão',
    items: [
      { name: 'Mẹt bún đậu thập cẩm đặc biệt', price: 79000, desc: 'Đầy đủ bún lá, đậu mơ chiên vàng giòn rụm, chả cốm dẻo thơm, thịt chân giò luộc và dồi sụn nướng.', isPopular: true },
      { name: 'Chả cốm Hà Nội chiên nóng hổi', price: 35000, desc: 'Chả cốm dẻo quánh làm từ nếp cái hoa vàng chuẩn vị phố cổ.', isPopular: true },
      { name: 'Nem chua rán phố cổ (4 cái)', price: 42000, desc: 'Nem chua tẩm bột chiên xù giòn tan chấm tương ớt cay nồng.', isPopular: false },
      { name: 'Dồi sụn nướng thơm lừng', price: 45000, desc: 'Dồi sụn heo giòn sần sật nướng than hoa thơm lừng cay cay.', isPopular: false },
      { name: 'Nước mơ ngâm đường phố cổ', price: 20000, desc: 'Nước mơ chua thanh ngọt dịu thơm mùi thảo mộc giải ngấy.', isPopular: false },
    ],
  },
  {
    name: 'Cơm Niêu Thiên Lý',
    slug: 'com-nieu-thien-ly',
    cuisine: ['Vietnamese'],
    price: 'medium',
    prep: 15,
    minOrder: 50000,
    rating: 4.7,
    reviews: 175,
    lat: 10.7850,
    lng: 106.6910,
    district: 'Quận 3',
    address: '16 Kỳ Đồng, Phường 9',
    items: [
      { name: 'Cơm niêu cháy giòn sốt thịt bò bằm', price: 85000, desc: 'Niêu cơm đất nướng đáy giòn rụm phủ sốt thịt bò bằm nấm thơm nức.', isPopular: true },
      { name: 'Cá bống kho tộ niêu đất', price: 95000, desc: 'Cá bống kho keo đậm vị tiêu đen ớt hiểm béo ngọt đưa cơm.', isPopular: true },
      { name: 'Thịt ba chỉ kho tàu trứng cút', price: 85000, desc: 'Thịt ba chỉ mềm tan rục màu cánh gián kho cùng nước dừa xiêm tươi.', isPopular: false },
      { name: 'Rau luộc thập cẩm chấm kho quẹt tôm thịt', price: 65000, desc: 'Đậu bắp, bầu, cà rốt xanh giòn chấm kho quẹt tóp mỡ đậm đà.', isPopular: true },
      { name: 'Canh cua đồng rau đay mồng tơi cà pháo', price: 45000, desc: 'Canh cua đồng giã tay nhiều riêu ngọt mát ăn kèm đĩa cà pháo giòn tan.', isPopular: false },
    ],
  },
]

const PROMOTIONS = [
  { code: 'FOODFLOW30', name: 'Giảm 30K mừng khai trương', desc: 'Giảm ngay 30.000đ cho đơn hàng từ 100.000đ', type: PromotionType.fixed, val: 30000, min: 100000, max: 30000 },
  { code: 'FREESHIP50', name: 'Miễn phí vận chuyển toàn sàn', desc: 'Hỗ trợ tối đa 25.000đ phí giao hàng cho đơn từ 80.000đ', type: PromotionType.free_delivery, val: 25000, min: 80000, max: 25000 },
  { code: 'BANHMI15', name: 'Bánh mì ăn vặt giảm 15K', desc: 'Giảm 15.000đ cho tất cả món bánh mì và thức ăn đường phố', type: PromotionType.fixed, val: 15000, min: 50000, max: 15000 },
  { code: 'PHOSANG20', name: 'Ăn sáng phở ngon giảm 20K', desc: 'Giảm 20.000đ cho các đơn hàng phở và bún bò buổi sáng', type: PromotionType.fixed, val: 20000, min: 65000, max: 20000 },
  { code: 'TIECGIAO50', name: 'Tiệc tùng linh đình giảm 50K', desc: 'Giảm ngay 50.000đ cho đơn đặt món nhóm từ 250.000đ', type: PromotionType.fixed, val: 50000, min: 250000, max: 50000 },
  { code: 'WEEKEND25', name: 'Cuối tuần thảnh thơi giảm 25K', desc: 'Giảm 25.000đ cho mọi đơn đặt món Thứ Bảy và Chủ Nhật', type: PromotionType.fixed, val: 25000, min: 120000, max: 25000 },
  { code: 'TRATRA20', name: 'Trà sữa giải khát giảm 20%', desc: 'Giảm 20% tối đa 35.000đ cho đồ uống và trà sữa mát lạnh', type: PromotionType.percentage, val: 20, min: 60000, max: 35000 },
  { code: 'CHAO2026', name: 'Mừng năm mới rực rỡ giảm 35K', desc: 'Mã tri ân khách hàng thân thiết giảm 35.000đ đơn từ 150.000đ', type: PromotionType.fixed, val: 35000, min: 150000, max: 35000 },
]

async function main() {
  if (process.env.FOODFLOW_CATALOG_CONFIRM !== 'ENRICH_DEMO_DATA') {
    throw new Error('Explicit confirmation FOODFLOW_CATALOG_CONFIRM=ENRICH_DEMO_DATA required')
  }

  const db = new PrismaClient({
    datasources: {
      db: { url: withVerifiedDatabaseTls(process.env.DATABASE_URL, process.env.DB_SSL_CA) },
    },
  })

  try {
    let restaurantsAdded = 0
    let menuItemsAdded = 0
    let promotionsAdded = 0

    // 1. Insert new restaurants and their menus
    for (const r of NEW_RESTAURANTS) {
      const existing = await db.restaurant.findUnique({ where: { slug: r.slug }, select: { id: true } })
      let restaurantId: string

      if (existing) {
        restaurantId = existing.id
      } else {
        const logoUrl = `https://picsum.photos/seed/${r.slug}/200/200`
        const coverUrl = `https://picsum.photos/seed/${r.slug}-cover/800/400`
        const desc = `${r.name} - Món ngon chuẩn vị Sài Gòn, giao nhanh tận nơi.`
        const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`
        const cuisineStr = `{${r.cuisine.join(',')}}`
        const priceMap = { low: '$', medium: '$$', high: '$$$' }

        await db.$executeRawUnsafe(
          `INSERT INTO restaurants (id, name, slug, description, logo_url, cover_url, location, address_line, city, district, phone, cuisine_types, price_range, rating, total_reviews, is_open, is_active, approval_status, prep_time_avg_minutes, min_order_amount, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, 'TP. Hồ Chí Minh', $9, $10, $11::text[], $12::"PriceRange", $13, $14, true, true, 'approved'::"RestaurantApprovalStatus", $15, $16, NOW(), NOW())
           ON CONFLICT (slug) DO UPDATE SET is_active=true, is_open=true, approval_status='approved'::"RestaurantApprovalStatus"`,
          r.name, r.slug, desc, logoUrl, coverUrl,
          r.lng, r.lat, r.address, r.district, phone,
          cuisineStr, priceMap[r.price], r.rating, r.reviews,
          r.prep, r.minOrder,
        )

        const created = await db.restaurant.findUnique({ where: { slug: r.slug }, select: { id: true } })
        if (!created) continue
        restaurantId = created.id
        restaurantsAdded++
      }

      // Ensure menu category
      let category = await db.category.findFirst({ where: { restaurantId, name: 'Món đặc trưng' } })
      if (!category) {
        category = await db.category.create({
          data: { restaurantId, name: 'Món đặc trưng', sortOrder: 1 },
        })
      }

      // Add dishes
      for (let i = 0; i < r.items.length; i++) {
        const item = r.items[i]
        const hasItem = await db.menuItem.findFirst({ where: { restaurantId, name: item.name }, select: { id: true } })
        if (!hasItem) {
          const itemImg = `https://picsum.photos/seed/${r.slug}-item-${i}/400/300`
          await db.menuItem.create({
            data: {
              restaurantId,
              categoryId: category.id,
              name: item.name,
              basePrice: item.price,
              description: item.desc,
              imageUrl: itemImg,
              isAvailable: true,
              isPopular: item.isPopular ?? false,
              sortOrder: i + 1,
            },
          })
          menuItemsAdded++
        }
      }
    }

    // 2. Insert active public vouchers / promotions
    for (const p of PROMOTIONS) {
      await db.promotion.upsert({
        where: { code: p.code },
        update: { isActive: true, status: 'active', value: p.val, description: p.desc },
        create: {
          code: p.code,
          name: p.name,
          description: p.desc,
          type: p.type,
          status: 'active',
          value: p.val,
          minOrderAmount: p.min,
          maxDiscount: p.max,
          usageLimit: 5000,
          startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      })
      promotionsAdded++
    }

    const totalRestaurants = await db.restaurant.count({ where: { isActive: true } })
    const totalMenuItems = await db.menuItem.count({ where: { isAvailable: true } })
    const totalPromotions = await db.promotion.count({ where: { isActive: true } })

    console.log(JSON.stringify({
      status: 'PASS',
      restaurantsAdded,
      menuItemsAdded,
      promotionsAdded,
      totalRestaurants,
      totalMenuItems,
      totalPromotions,
      existingAccountsAndOrdersPreserved: true,
    }))
  } finally {
    await db.$disconnect()
  }
}

void main().catch((err) => {
  console.error('Enrich seed failed:', err)
  process.exit(1)
})
