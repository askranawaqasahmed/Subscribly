export const APP_NAME = 'Subscribly'
export const APP_DESCRIPTION = 'Manage shared subscriptions, track payments, and generate invoices'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_NEW: '/subscriptions/new',
  SUBSCRIPTION_DETAIL: (id: string) => `/subscriptions/${id}`,
  PAYMENTS: '/payments',
  INVOICES: '/invoices',
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
  PENDING_REPORT: '/reports/pending',
} as const

export const API_ROUTES = {
  AUTH_CALLBACK: '/api/auth/callback',
  SUBSCRIPTIONS: '/api/subscriptions',
  SUBSCRIPTION_DETAIL: (id: string) => `/api/subscriptions/${id}`,
  SUBSCRIPTION_MEMBERS: (id: string) => `/api/subscriptions/${id}/members`,
  GENERATE_SUBSCRIPTION_INVOICE: (id: string) => `/api/subscriptions/${id}/generate-invoice`,
  PAYMENTS: '/api/payments',
  MARK_PAID: (id: string) => `/api/payments/${id}/mark-paid`,
  INVOICES: '/api/invoices',
  INVOICE_DETAIL: (id: string) => `/api/invoices/${id}`,
  SEND_INVOICE: (id: string) => `/api/invoices/${id}/send`,
  PENDING_REPORT: '/api/reports/pending',
  // Settings
  ADMIN_SETTINGS: '/api/admin/settings',
  TEST_EMAIL_CONFIG: '/api/admin/settings/test-email',
  // Invoice generation
  GENERATE_INVOICE_FOR_USER: '/api/invoices/generate-for-user',
  GENERATE_ALL_INVOICES: '/api/invoices/generate-all',
  USERS_WITH_UNPAID: '/api/users/with-unpaid-payments',
  // Billing
  RUN_BILLING: '/api/billing/run',
  RUN_BILLING_MANUAL: '/api/billing/run-manual',
} as const

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'equal', label: 'Equal Split' },
  { value: 'individual', label: 'Individual Amounts' },
]

export const INVOICE_STATUS_OPTIONS = [
  { value: 'generated', label: 'Generated' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
]

export const INVOICE_STATUS_COLORS = {
  generated: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  sent: 'bg-blue-100 text-blue-800 border-blue-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
}

export const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-red-100 text-red-800',
}
