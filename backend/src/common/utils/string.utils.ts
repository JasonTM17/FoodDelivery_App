import { nanoid } from 'nanoid'

export function generateOrderCode(): string {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `FD-${yy}${mm}${dd}-${nanoid(4).toUpperCase()}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-3)
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength - 3) + '...'
}
