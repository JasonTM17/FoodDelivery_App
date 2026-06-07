import { timeSince } from './date.utils'

describe('date.utils', () => {
  describe('timeSince — multi-locale', () => {
    const fixedNow = new Date('2026-06-07T12:00:00Z').getTime()
    let nowSpy: jest.SpyInstance

    beforeEach(() => {
      nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow)
    })

    afterEach(() => {
      nowSpy.mockRestore()
    })

    const cases = [
      { delta: 30_000, vi: 'vừa xong', en: 'just now', ja: 'たった今' },
      { delta: 90_000, vi: '1 phút trước', en: '1 minute ago', ja: '1分前' },
      { delta: 5 * 60_000, vi: '5 phút trước', en: '5 minutes ago', ja: '5分前' },
      { delta: 60 * 60_000, vi: '1 giờ trước', en: '1 hour ago', ja: '1時間前' },
      { delta: 3 * 60 * 60_000, vi: '3 giờ trước', en: '3 hours ago', ja: '3時間前' },
      { delta: 25 * 60 * 60_000, vi: '1 ngày trước', en: '1 day ago', ja: '1日前' },
      { delta: 5 * 24 * 60 * 60_000, vi: '5 ngày trước', en: '5 days ago', ja: '5日前' },
    ]

    for (const c of cases) {
      it(`vi: delta=${c.delta}ms returns "${c.vi}"`, () => {
        const past = new Date(fixedNow - c.delta)
        expect(timeSince(past, 'vi')).toBe(c.vi)
      })
      it(`en: delta=${c.delta}ms returns "${c.en}"`, () => {
        const past = new Date(fixedNow - c.delta)
        expect(timeSince(past, 'en')).toBe(c.en)
      })
      it(`ja: delta=${c.delta}ms returns "${c.ja}"`, () => {
        const past = new Date(fixedNow - c.delta)
        expect(timeSince(past, 'ja')).toBe(c.ja)
      })
    }

    it('defaults to vi when lang omitted', () => {
      const past = new Date(fixedNow - 90_000)
      expect(timeSince(past)).toBe('1 phút trước')
    })

    it('falls back to vi for unknown lang', () => {
      const past = new Date(fixedNow - 30_000)
      // @ts-expect-error testing fallback for invalid lang
      expect(timeSince(past, 'zh')).toBe('vừa xong')
    })
  })
})
