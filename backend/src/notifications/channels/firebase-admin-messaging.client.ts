import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app'
import {
  getMessaging,
  type BatchResponse,
  type Message,
  type Messaging,
} from 'firebase-admin/messaging'

const FCM_APP_NAME = 'foodflow-fcm'

export const FCM_MESSAGING_CLIENT = 'FCM_MESSAGING_CLIENT'

export interface FirebaseMessagingClient {
  sendEach(messages: Message[]): Promise<BatchResponse>
}

@Injectable()
export class FirebaseAdminMessagingClient implements FirebaseMessagingClient {
  private messaging?: Messaging

  constructor(private readonly config: ConfigService) {}

  sendEach(messages: Message[]): Promise<BatchResponse> {
    return this.getClient().sendEach(messages)
  }

  private getClient(): Messaging {
    if (!this.messaging) {
      this.messaging = getMessaging(this.getApp())
    }
    return this.messaging
  }

  private getApp(): App {
    const projectId = this.config.get<string>('FCM_PROJECT_ID')?.trim()
    if (!projectId) {
      throw new Error('FCM_PROJECT_ID is not configured')
    }

    const existingApp = getApps().find(app => app.name === FCM_APP_NAME)
    if (existingApp) {
      if (existingApp.options.projectId !== projectId) {
        throw new Error('FCM project changed without a process restart')
      }
      return existingApp
    }

    return initializeApp(
      {
        credential: this.resolveCredential(),
        projectId,
      },
      FCM_APP_NAME,
    )
  }

  private resolveCredential() {
    const serviceAccountJson = this.config.get<string>('FCM_SERVICE_ACCOUNT_JSON')?.trim()
    if (!serviceAccountJson) {
      return applicationDefault()
    }

    try {
      return cert(JSON.parse(serviceAccountJson) as ServiceAccount)
    } catch {
      throw new Error('FCM_SERVICE_ACCOUNT_JSON is invalid')
    }
  }
}
