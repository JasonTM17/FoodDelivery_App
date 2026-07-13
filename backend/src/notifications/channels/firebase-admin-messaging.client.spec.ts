jest.mock('firebase-admin/app', () => ({
  applicationDefault: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}))

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}))

import { ConfigService } from '@nestjs/config'
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { getMessaging, type Message } from 'firebase-admin/messaging'
import { FirebaseAdminMessagingClient } from './firebase-admin-messaging.client'

const mockApplicationDefault = jest.mocked(applicationDefault)
const mockCert = jest.mocked(cert)
const mockGetApps = jest.mocked(getApps)
const mockInitializeApp = jest.mocked(initializeApp)
const mockGetMessaging = jest.mocked(getMessaging)

describe('FirebaseAdminMessagingClient', () => {
  const firebaseApp = {
    name: 'foodflow-fcm',
    options: { projectId: 'foodflow-production' },
  }
  const messaging = { sendEach: jest.fn() }
  const adcCredential = { getAccessToken: jest.fn() }
  const serviceAccountCredential = { getAccessToken: jest.fn() }
  const messages: Message[] = [{
    token: 'registration-token',
    notification: { title: 'Title', body: 'Body' },
  }]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetApps.mockReturnValue([])
    mockInitializeApp.mockReturnValue(firebaseApp as never)
    mockGetMessaging.mockReturnValue(messaging as never)
    mockApplicationDefault.mockReturnValue(adcCredential as never)
    mockCert.mockReturnValue(serviceAccountCredential as never)
    messaging.sendEach.mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
  })

  it('uses ADC with an explicit target project ID when no service account JSON is supplied', async () => {
    const config = configFor({ FCM_PROJECT_ID: 'foodflow-production' })
    const client = new FirebaseAdminMessagingClient(config)

    await client.sendEach(messages)

    expect(mockApplicationDefault).toHaveBeenCalledWith()
    expect(mockInitializeApp).toHaveBeenCalledWith(
      { credential: adcCredential, projectId: 'foodflow-production' },
      'foodflow-fcm',
    )
    expect(messaging.sendEach).toHaveBeenCalledWith(messages)
  })

  it('uses a parsed service account from secret-managed JSON instead of ADC', async () => {
    const serviceAccount = {
      project_id: 'foodflow-production',
      client_email: 'fcm@foodflow-production.iam.gserviceaccount.com',
      private_key: 'not-a-real-key',
    }
    const config = configFor({
      FCM_PROJECT_ID: 'foodflow-production',
      FCM_SERVICE_ACCOUNT_JSON: JSON.stringify(serviceAccount),
    })
    const client = new FirebaseAdminMessagingClient(config)

    await client.sendEach(messages)

    expect(mockCert).toHaveBeenCalledWith(serviceAccount)
    expect(mockApplicationDefault).not.toHaveBeenCalled()
  })

  it('fails closed when the target project or service account JSON is invalid', () => {
    expect(() => new FirebaseAdminMessagingClient(configFor({})).sendEach(messages))
      .toThrow('FCM_PROJECT_ID is not configured')
    expect(() => new FirebaseAdminMessagingClient(configFor({
      FCM_PROJECT_ID: 'foodflow-production',
      FCM_SERVICE_ACCOUNT_JSON: '{invalid-json}',
    })).sendEach(messages)).toThrow('FCM_SERVICE_ACCOUNT_JSON is invalid')
  })
})

function configFor(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}
