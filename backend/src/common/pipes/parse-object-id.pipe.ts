import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  transform(value: string): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`)
    }
    return value
  }
}
