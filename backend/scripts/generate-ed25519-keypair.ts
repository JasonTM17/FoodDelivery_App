/**
 * One-time ops helper — generates an Ed25519 key pair and prints base64-encoded
 * DER values ready to paste into .env.
 *
 * Usage: npx ts-node scripts/generate-ed25519-keypair.ts
 */
import * as crypto from 'crypto'

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')

const privDer = privateKey.export({ type: 'pkcs8', format: 'der' }) as Buffer
const pubDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer

console.log('# Paste into .env (keep private key secret!):')
console.log(`JWT_ED25519_PRIVATE_KEY=${privDer.toString('base64')}`)
console.log(`JWT_ED25519_PUBLIC_KEY=${pubDer.toString('base64')}`)
console.log(`LEGACY_HS256_FALLBACK=true`)
console.log()
console.log(`# Key type: ${privateKey.asymmetricKeyType} (Ed25519)`)
