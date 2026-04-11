'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff, Mail, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { API_ROUTES } from '@/lib/constants'

export default function SettingsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [provider, setProvider] = useState<'gmail' | 'resend'>('gmail')
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Gmail settings
  const [gmailHost, setGmailHost] = useState('smtp.gmail.com')
  const [gmailPort, setGmailPort] = useState('587')
  const [gmailUser, setGmailUser] = useState('')
  const [gmailPassword, setGmailPassword] = useState('')
  const [gmailFromEmail, setGmailFromEmail] = useState('')
  const [gmailFromName, setGmailFromName] = useState('Subscribly')

  // Resend settings
  const [resendApiKey, setResendApiKey] = useState('')
  const [resendFromEmail, setResendFromEmail] = useState('')
  const [resendFromName, setResendFromName] = useState('Subscribly')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_ROUTES.ADMIN_SETTINGS}?category=email`)
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          })
          return
        }
        throw new Error('Failed to load settings')
      }
      
      const data = await response.json()

      if (data.settings) {
        data.settings.forEach((setting: any) => {
          switch (setting.key) {
            case 'email.provider':
              setProvider(setting.value as 'gmail' | 'resend')
              break
            case 'email.gmail.host':
              setGmailHost(setting.value || 'smtp.gmail.com')
              break
            case 'email.gmail.port':
              setGmailPort(setting.value || '587')
              break
            case 'email.gmail.user':
              setGmailUser(setting.value || '')
              break
            case 'email.gmail.from_email':
              setGmailFromEmail(setting.value || '')
              break
            case 'email.gmail.from_name':
              setGmailFromName(setting.value || 'Subscribly')
              break
            case 'email.resend.from_email':
              setResendFromEmail(setting.value || '')
              break
            case 'email.resend.from_name':
              setResendFromName(setting.value || 'Subscribly')
              break
          }
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsToSave = [
        { key: 'email.provider', value: provider, category: 'email' },
      ]

      if (provider === 'gmail') {
        settingsToSave.push(
          { key: 'email.gmail.host', value: gmailHost, category: 'email' },
          { key: 'email.gmail.port', value: gmailPort, category: 'email' },
          { key: 'email.gmail.user', value: gmailUser, category: 'email' },
          { key: 'email.gmail.from_email', value: gmailFromEmail, category: 'email' },
          { key: 'email.gmail.from_name', value: gmailFromName, category: 'email' }
        )
        if (gmailPassword) {
          settingsToSave.push({
            key: 'email.gmail.password',
            value: gmailPassword,
            category: 'email',
          } as any)
        }
      } else if (provider === 'resend') {
        settingsToSave.push(
          { key: 'email.resend.from_email', value: resendFromEmail, category: 'email' },
          { key: 'email.resend.from_name', value: resendFromName, category: 'email' }
        )
        if (resendApiKey) {
          settingsToSave.push({
            key: 'email.resend.api_key',
            value: resendApiKey,
            category: 'email',
          } as any)
        }
      }

      for (const setting of settingsToSave) {
        const encrypted = setting.key.includes('password') || setting.key.includes('api_key')
        await fetch(API_ROUTES.ADMIN_SETTINGS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...setting, encrypted }),
        })
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const testConfiguration = async () => {
    setTesting(true)
    try {
      let config: any

      if (provider === 'gmail') {
        if (!gmailHost || !gmailPort || !gmailUser || !gmailPassword || !gmailFromEmail) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in all Gmail configuration fields',
            variant: 'destructive',
          })
          return
        }
        config = {
          host: gmailHost,
          port: parseInt(gmailPort, 10),
          user: gmailUser,
          password: gmailPassword,
          fromEmail: gmailFromEmail,
          fromName: gmailFromName,
        }
      } else if (provider === 'resend') {
        if (!resendApiKey || !resendFromEmail) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in all Resend configuration fields',
            variant: 'destructive',
          })
          return
        }
        config = {
          apiKey: resendApiKey,
          fromEmail: resendFromEmail,
          fromName: resendFromName,
        }
      }

      const response = await fetch(API_ROUTES.TEST_EMAIL_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Test Successful',
          description: data.message,
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error testing configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to test email configuration',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage application settings and configurations
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>
                Choose your email service provider for sending invoices and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={provider} onValueChange={(value) => setProvider(value as 'gmail' | 'resend')}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="gmail" id="gmail" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="gmail" className="font-semibold cursor-pointer">
                      Gmail SMTP
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use your own Gmail account with SMTP. Requires app password (2FA required).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="resend" id="resend" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="resend" className="font-semibold cursor-pointer">
                      Resend
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modern email API with free tier (100 emails/day, 3,000/month).
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {provider === 'gmail' && (
            <Card>
              <CardHeader>
                <CardTitle>Gmail SMTP Configuration</CardTitle>
                <CardDescription>
                  Configure Gmail SMTP settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Setup Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Enable 2-factor authentication on your Google account</li>
                      <li>
                        Go to{' '}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline inline-flex items-center"
                        >
                          App Passwords
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                      <li>Generate a new app password for "Mail"</li>
                      <li>Copy the 16-character password and paste below</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gmailHost">SMTP Host</Label>
                    <Input
                      id="gmailHost"
                      value={gmailHost}
                      onChange={(e) => setGmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gmailPort">SMTP Port</Label>
                    <Input
                      id="gmailPort"
                      type="number"
                      value={gmailPort}
                      onChange={(e) => setGmailPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmailUser">Gmail Username (Email)</Label>
                  <Input
                    id="gmailUser"
                    type="email"
                    value={gmailUser}
                    onChange={(e) => setGmailUser(e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmailPassword">App Password</Label>
                  <div className="relative">
                    <Input
                      id="gmailPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={gmailPassword}
                      onChange={(e) => setGmailPassword(e.target.value)}
                      placeholder="16-character app password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gmailFromEmail">From Email</Label>
                    <Input
                      id="gmailFromEmail"
                      type="email"
                      value={gmailFromEmail}
                      onChange={(e) => setGmailFromEmail(e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gmailFromName">From Name</Label>
                    <Input
                      id="gmailFromName"
                      value={gmailFromName}
                      onChange={(e) => setGmailFromName(e.target.value)}
                      placeholder="Subscribly"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {provider === 'resend' && (
            <Card>
              <CardHeader>
                <CardTitle>Resend Configuration</CardTitle>
                <CardDescription>
                  Configure Resend API settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Setup Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>
                        Sign up at{' '}
                        <a
                          href="https://resend.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline inline-flex items-center"
                        >
                          resend.com
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                      <li>Verify your email domain (or use resend.dev for testing)</li>
                      <li>Generate an API key from the dashboard</li>
                      <li>Free tier: 100 emails/day, 3,000 emails/month</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="resendApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="resendApiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendFromEmail">From Email</Label>
                    <Input
                      id="resendFromEmail"
                      type="email"
                      value={resendFromEmail}
                      onChange={(e) => setResendFromEmail(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resendFromName">From Name</Label>
                    <Input
                      id="resendFromName"
                      value={resendFromName}
                      onChange={(e) => setResendFromName(e.target.value)}
                      placeholder="Subscribly"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={testConfiguration} variant="outline" disabled={testing || saving}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test Configuration
                </>
              )}
            </Button>

            <Button onClick={saveSettings} disabled={saving || testing}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
