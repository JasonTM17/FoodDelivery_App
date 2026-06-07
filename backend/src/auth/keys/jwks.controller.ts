import { Controller, Get } from '@nestjs/common'
import { Public } from '../public.decorator'
import { Ed25519Service, JwkPublicKey } from './ed25519.service'

@Controller('.well-known')
export class JwksController {
  constructor(private readonly ed25519: Ed25519Service) {}

  @Public()
  @Get('jwks.json')
  getJwks(): { keys: JwkPublicKey[] } {
    const key = this.ed25519.getPublicKeyAsJwk()
    return { keys: key ? [key] : [] }
  }
}
