declare module 'nodemailer' {
  interface SmtpTransportOptions {
    host?: string
    port?: number
    secure?: boolean
    auth?: { user?: string; pass?: string }
    service?: string
  }

  interface MailOptions {
    from: string
    to: string
    subject: string
    html: string
    text?: string
  }

  interface SentMessageInfo {
    messageId: string
    accepted?: string[]
    rejected?: string[]
  }

  interface Transporter {
    sendMail(options: MailOptions): Promise<SentMessageInfo>
    close(): void
  }

  function createTransport(options: SmtpTransportOptions | string): Transporter
}
