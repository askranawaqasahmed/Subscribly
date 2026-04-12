import { prisma } from '@/lib/prisma'
import { AppSettings } from '@prisma/client'
import crypto from 'crypto'

const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'default-key-change-this-in-production-32'
const IV_LENGTH = 16

interface EmailConfig {
  provider: 'gmail' | 'resend' | null
  gmail?: {
    host: string
    port: number
    user: string
    password: string
    fromEmail: string
    fromName: string
  }
  resend?: {
    apiKey: string
    fromEmail: string
    fromName: string
  }
}

interface SettingOptions {
  encrypted?: boolean
  category?: string
  description?: string
}

class SettingsService {
  private cache: Map<string, { value: string | null; timestamp: number }>
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.cache = new Map()
  }

  private encrypt(text: string): string {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  private decrypt(text: string): string {
    try {
      const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
      const parts = text.split(':')
      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = parts[1]
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      return text
    }
  }

  private getCachedValue(key: string): string | null | undefined {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value
    }
    return undefined
  }

  private setCachedValue(key: string, value: string | null): void {
    this.cache.set(key, { value, timestamp: Date.now() })
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const cached = this.getCachedValue(key)
    if (cached !== undefined) {
      return cached
    }

    try {
      const setting = await prisma.appSettings.findUnique({
        where: { key },
      })

      if (!setting || !setting.value) {
        this.setCachedValue(key, null)
        return null
      }

      const value = setting.encrypted ? this.decrypt(setting.value) : setting.value
      this.setCachedValue(key, value)
      return value
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return null
    }
  }

  async getSettings(category?: string): Promise<AppSettings[]> {
    try {
      const settings = await prisma.appSettings.findMany({
        where: category ? { category } : undefined,
        orderBy: { key: 'asc' },
      })

      return settings.map((setting) => ({
        ...setting,
        value: setting.encrypted && setting.value ? '********' : setting.value,
      }))
    } catch (error) {
      console.error('Error getting settings:', error)
      return []
    }
  }

  async setSetting(
    key: string,
    value: string,
    userId: string,
    options?: SettingOptions
  ): Promise<AppSettings> {
    const encrypted = options?.encrypted || false
    const category = options?.category || 'general'
    const description = options?.description

    const finalValue = encrypted ? this.encrypt(value) : value

    try {
      const setting = await prisma.appSettings.upsert({
        where: { key },
        update: {
          value: finalValue,
          encrypted,
          category,
          description,
          createdBy: userId,
        },
        create: {
          key,
          value: finalValue,
          encrypted,
          category,
          description,
          createdBy: userId,
        },
      })

      this.clearCache(key)
      return setting
    } catch (error) {
      console.error(`Error setting ${key}:`, error)
      throw error
    }
  }

  async deleteSetting(key: string): Promise<void> {
    try {
      await prisma.appSettings.delete({
        where: { key },
      })
      this.clearCache(key)
    } catch (error) {
      console.error(`Error deleting setting ${key}:`, error)
      throw error
    }
  }

  async getEmailProvider(): Promise<'gmail' | 'resend' | null> {
    const provider = await this.getSetting('email.provider')
    if (provider === 'gmail' || provider === 'resend') {
      return provider
    }
    return null
  }

  async getEmailConfig(): Promise<EmailConfig> {
    const provider = await this.getEmailProvider()

    const config: EmailConfig = { provider }

    if (provider === 'gmail') {
      const host = await this.getSetting('email.gmail.host')
      const port = await this.getSetting('email.gmail.port')
      const user = await this.getSetting('email.gmail.user')
      const password = await this.getSetting('email.gmail.password')
      const fromEmail = await this.getSetting('email.gmail.from_email')
      const fromName = await this.getSetting('email.gmail.from_name')

      if (host && port && user && password && fromEmail) {
        config.gmail = {
          host,
          port: parseInt(port, 10),
          user,
          password,
          fromEmail,
          fromName: fromName || 'Subscribly',
        }
      }
    } else if (provider === 'resend') {
      const apiKey = await this.getSetting('email.resend.api_key')
      const fromEmail = await this.getSetting('email.resend.from_email')
      const fromName = await this.getSetting('email.resend.from_name')

      if (apiKey && fromEmail) {
        config.resend = {
          apiKey,
          fromEmail,
          fromName: fromName || 'Subscribly',
        }
      }
    }

    return config
  }

  async isEmailConfigured(): Promise<boolean> {
    const config = await this.getEmailConfig()
    return (config.provider === 'gmail' && !!config.gmail) || 
           (config.provider === 'resend' && !!config.resend)
  }
}

export const settingsService = new SettingsService()
export type { EmailConfig, SettingOptions }
