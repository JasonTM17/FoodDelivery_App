import { InternalServerErrorException } from '@nestjs/common'
import { TemplateLoader } from './template.loader'

describe('TemplateLoader', () => {
  it('renders an existing localized template with interpolation', () => {
    const loader = new TemplateLoader()

    const rendered = loader.render('order_accepted', { orderCode: 'ABC001' }, 'en')

    expect(rendered.title).not.toBe('order_accepted')
    expect(rendered.body).toContain('ABC001')
    expect(rendered.supportedChannels.length).toBeGreaterThan(0)
  })

  it('fails closed when the notification template is missing', () => {
    const loader = new TemplateLoader()

    expect(() => loader.render('missing.production.event', {}, 'vi')).toThrow(InternalServerErrorException)
    expect(() => loader.render('missing.production.event', {}, 'vi')).toThrow('NOTIFICATION_TEMPLATE_NOT_FOUND')
  })
})
