/**
 * Pure builders + seed helpers for demo-ready support tickets and partner orders.
 * Used by prisma/seed.ts; unit-tested without a live database.
 */
import type { OrderStatus, PaymentMethod, TicketIssueType, TicketStatus } from '@prisma/client'

export type DemoOrderInput = {
  orderCode: string
  customerId: string
  restaurantId: string
  deliveryAddressId: string
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  notes?: string
  items: Array<{
    menuItemId: string
    nameSnapshot: string
    quantity: number
    unitPrice: number
  }>
}

export type DemoSupportTicketInput = {
  userId: string
  orderId?: string
  issueType: TicketIssueType
  summary: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: TicketStatus
  tags: string[]
}

/** Stable demo order codes for idempotent re-seed checks. */
export const DEMO_ORDER_CODE = 'FF-DEMO01'
export const DEMO_TICKET_TAG = 'seed:demo'

export function buildDemoOrderInput(params: {
  customerId: string
  restaurantId: string
  deliveryAddressId: string
  menuItemId: string
  menuItemName: string
  unitPrice: number
}): DemoOrderInput {
  const qty = 2
  const subtotal = params.unitPrice * qty
  const deliveryFee = 15000
  return {
    orderCode: DEMO_ORDER_CODE,
    customerId: params.customerId,
    restaurantId: params.restaurantId,
    deliveryAddressId: params.deliveryAddressId,
    status: 'restaurant_pending',
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    paymentMethod: 'cash',
    notes: 'Seed demo order for Restaurant kanban',
    items: [
      {
        menuItemId: params.menuItemId,
        nameSnapshot: params.menuItemName,
        quantity: qty,
        unitPrice: params.unitPrice,
      },
    ],
  }
}

export function buildDemoSupportTicketInput(params: {
  userId: string
  orderId?: string
}): DemoSupportTicketInput {
  return {
    userId: params.userId,
    orderId: params.orderId,
    issueType: 'late_delivery',
    summary: 'Seed demo ticket: khách báo đơn giao chậm (local demo)',
    priority: 'medium',
    status: 'open',
    tags: [DEMO_TICKET_TAG, 'demo'],
  }
}

export type SeedDemoPrisma = {
  order: {
    findUnique: (args: { where: { orderCode: string } }) => Promise<{ id: string } | null>
    create: (args: {
      data: Record<string, unknown>
      include?: Record<string, unknown>
    }) => Promise<{ id: string; orderCode: string }>
  }
  orderItem: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
  orderStatusHistory: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
  aiSupportTicket: {
    findFirst: (args: {
      where: { tags: { has: string } }
    }) => Promise<{ id: string } | null>
    create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>
  }
  user: {
    findUnique: (args: { where: { email: string } }) => Promise<{ id: string } | null>
  }
  restaurant: {
    findFirst: (args: { where: { slug: string } }) => Promise<{ id: string } | null>
  }
  address: {
    findFirst: (args: {
      where: { userId: string }
      orderBy?: { createdAt: 'asc' | 'desc' }
    }) => Promise<{ id: string } | null>
  }
  menuItem: {
    findFirst: (args: {
      where: { restaurantId: string }
      orderBy?: { createdAt: 'asc' | 'desc' }
    }) => Promise<{ id: string; name: string; basePrice: unknown } | null>
  }
}

/**
 * Ensures ≥1 partner order (restaurant1 / pho-24) and ≥1 support ticket exist.
 * Idempotent via DEMO_ORDER_CODE and DEMO_TICKET_TAG.
 */
export async function ensureDemoOrdersAndTickets(prisma: SeedDemoPrisma): Promise<{
  orderId: string | null
  ticketId: string | null
}> {
  const customer = await prisma.user.findUnique({ where: { email: 'customer1@foodflow.vn' } })
  const restaurant = await prisma.restaurant.findFirst({ where: { slug: 'pho-24' } })
  if (!customer || !restaurant) {
    return { orderId: null, ticketId: null }
  }

  const address = await prisma.address.findFirst({
    where: { userId: customer.id },
    orderBy: { createdAt: 'asc' },
  })
  const menuItem = await prisma.menuItem.findFirst({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: 'asc' },
  })
  if (!address || !menuItem) {
    return { orderId: null, ticketId: null }
  }

  let order = await prisma.order.findUnique({ where: { orderCode: DEMO_ORDER_CODE } })
  if (!order) {
    const unitPrice = Number(menuItem.basePrice)
    const demo = buildDemoOrderInput({
      customerId: customer.id,
      restaurantId: restaurant.id,
      deliveryAddressId: address.id,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      unitPrice,
    })
    order = await prisma.order.create({
      data: {
        orderCode: demo.orderCode,
        customerId: demo.customerId,
        restaurantId: demo.restaurantId,
        deliveryAddressId: demo.deliveryAddressId,
        status: demo.status,
        subtotal: demo.subtotal,
        deliveryFee: demo.deliveryFee,
        total: demo.total,
        paymentMethod: demo.paymentMethod,
        notes: demo.notes,
      },
    })
    for (const item of demo.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      })
    }
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: demo.status,
        changedBy: 'seed',
        note: 'Demo seed order',
      },
    })
  }

  let ticket = await prisma.aiSupportTicket.findFirst({
    where: { tags: { has: DEMO_TICKET_TAG } },
  })
  if (!ticket) {
    const demoTicket = buildDemoSupportTicketInput({
      userId: customer.id,
      orderId: order.id,
    })
    ticket = await prisma.aiSupportTicket.create({
      data: {
        userId: demoTicket.userId,
        orderId: demoTicket.orderId,
        issueType: demoTicket.issueType,
        summary: demoTicket.summary,
        priority: demoTicket.priority,
        status: demoTicket.status,
        tags: demoTicket.tags,
      },
    })
  }

  return { orderId: order.id, ticketId: ticket.id }
}
