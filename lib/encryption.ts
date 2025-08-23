'use server'

import type { DatabaseConfig } from '@/components/database-configs'
import { DbType } from '@/types/database-type'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
// A strong secret key for encryption — store this securely, e.g., env var
const IV_LENGTH = 16 // For AES, this is always 16 bytes

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY!
  // interpret the env var as hex:
  const key = Buffer.from(raw, 'hex')
  if (key.length !== 32) {
    throw new Error(`Invalid key length ${key.length}, expected 32`)
  }
  return key
}

function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? `__bigint__:${value.toString()}` : value,
  )
}

function safeParse(jsonStr: string): any {
  return JSON.parse(jsonStr, (_, value) => {
    if (typeof value === 'string' && value.startsWith('__bigint__:')) {
      return BigInt(value.split(':')[1])
    }
    return value
  })
}

// Convert a database config to JSON and then encrypt.
// Note: the dbType is not encrypted
export async function encryptConfig(dbConfig: DatabaseConfig): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const jsonString = JSON.stringify(dbConfig.config)

  let encrypted = cipher.update(jsonString)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export async function decryptConfig(
  db_type: DbType,
  encryptedString: string,
): Promise<DatabaseConfig> {
  const textParts = encryptedString.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)

  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  const jsonString = decrypted.toString()
  const configObject = JSON.parse(jsonString)

  return {
    type: db_type,
    config: configObject,
  } as DatabaseConfig
}

export async function encryptJSONToURLSafeStr(json: object): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

  let encrypted = cipher.update(safeStringify(json))
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const ivEncoded = iv.toString('base64url')
  const encryptedEncoded = encrypted.toString('base64url')

  return `${ivEncoded}.${encryptedEncoded}`
}

export async function decryptURLSafeStrToJSON(
  encrypted: string,
): Promise<object> {
  const [ivEncoded, encryptedEncoded] = encrypted.split('.')

  if (!ivEncoded || !encryptedEncoded) {
    throw new Error('Invalid encrypted format')
  }

  const iv = Buffer.from(ivEncoded, 'base64url')
  const encryptedData = Buffer.from(encryptedEncoded, 'base64url')

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)

  let decrypted = decipher.update(encryptedData)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  const jsonStr = decrypted.toString('utf-8')
  return safeParse(jsonStr)
}
