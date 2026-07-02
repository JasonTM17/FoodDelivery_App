export const PROMOTION_NOTIFICATION_BATCH_SIZE = 50

export async function settlePromotionNotificationBatches(
  customerIds: readonly string[],
  notify: (customerId: string) => Promise<unknown>,
): Promise<PromiseSettledResult<unknown>[]> {
  const results: PromiseSettledResult<unknown>[] = []

  for (let offset = 0; offset < customerIds.length; offset += PROMOTION_NOTIFICATION_BATCH_SIZE) {
    const batch = customerIds.slice(offset, offset + PROMOTION_NOTIFICATION_BATCH_SIZE)
    results.push(...await Promise.allSettled(batch.map(customerId => notify(customerId))))
  }

  return results
}
