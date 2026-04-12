// ============================================
// ENUMS
// ============================================

export enum PaymentType {
  EQUAL = 'equal',
  INDIVIDUAL = 'individual',
}

export enum InvoiceStatus {
  GENERATED = 'generated',
  SENT = 'sent',
  PAID = 'paid',
}

// ============================================
// DATABASE TYPES
// ============================================

export interface Profile {
  id: string
  full_name: string
  phone_number: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  name: string
  description: string | null
  total_amount: number
  payment_type: PaymentType
  total_members: number
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  subscription_id: string
  subscriber_user_id: string
  amount: number
  expiry_date: string | null
  is_active: boolean
  created_at: string
}

export interface Payment {
  id: string
  user_subscription_id: string
  amount: number
  is_paid: boolean
  paid_on: string | null
  expiry_date: string
  created_at: string
  created_by: string
}

export interface Invoice {
  id: string
  user_subscription_id: string
  issued_to_user_id: string
  total_amount: number
  months_covered: string
  status: InvoiceStatus
  sent_on: string | null
  paid_on: string | null
  created_at: string
  created_by: string
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

// Subscription DTOs
export interface MySubscriptionDto {
  id: string
  name: string
  total_amount: number
  payment_type: PaymentType
  member_count: number
  total_pending: number
  created_at: string
}

export interface SubscribedSubscriptionDto {
  id: string
  name: string
  my_amount: number
  owner_name: string
  owner_email: string
  is_paid: boolean
  last_payment_date: string | null
  created_at: string
}

export interface CreateSubscriptionDto {
  name: string
  icon?: string
  description?: string
  total_amount: number
  payment_type: PaymentType
  total_members: number
  member_emails?: string[]
  member_amounts?: Record<string, number>
}

export interface UpdateSubscriptionDto {
  name?: string
  icon?: string
  description?: string
  total_amount?: number
}

// Member DTOs
export interface MemberPaymentSummaryDto {
  member_id: string
  member_name: string
  member_email: string
  member_phone: string | null
  months_unpaid: string
  total_accumulated: number
  payment_ids: string[]
}

export interface AddMemberDto {
  email: string
  amount?: number
}

// Payment DTOs
export interface CreatePaymentDto {
  user_subscription_id: string
  amount: number
  expiry_date: string
}

export interface PaymentHistoryDto extends Payment {
  subscription_name: string
  member_name: string
  member_email: string
}

// Invoice DTOs
export interface GenerateInvoiceDto {
  user_subscription_id: string
  payment_ids: string[]
}

export interface GenerateSubscriptionInvoiceDto {
  subscriptionId: string
  month: number
  year: number
  sendEmail?: boolean
}

export interface MemberInvoicePreviewDto {
  memberId: string
  memberName: string
  memberEmail: string
  currentMonthAmount: number
  arrearsAmount: number
  arrearsMonths: string[]
  totalAmount: number
  alreadyGenerated: boolean
}

export interface GenerateInvoiceResultDto {
  memberId: string
  memberName: string
  success: boolean
  invoiceId?: string
  message: string
  alreadyExists?: boolean
}

export interface InvoiceDetailDto extends Invoice {
  subscription_name: string
  subscription_icon: string | null
  member_name: string
  member_email: string
  member_phone: string | null
  owner_name: string
  owner_email: string
  owner_phone: string | null
  payment_breakdown: {
    month: string
    amount: number
  }[]
}

// Subscription Detail DTO
export interface SubscriptionDetailDto extends Subscription {
  owner_name: string
  owner_email: string
  members: SubscriptionMemberDto[]
}

export interface SubscriptionMemberDto {
  member_id: string
  member_name: string
  member_email: string
  member_phone: string | null
  amount: number
  accumulated_pending: number
  last_paid_date: string | null
  is_active: boolean
}

// Report DTOs
export interface AccumulatedPendingReportDto {
  subscription_id: string
  subscription_name: string
  members: MemberPaymentSummaryDto[]
  total_pending: number
}

// Auth DTOs
export interface RegisterDto {
  email: string
  password: string
  full_name: string
  phone_number: string
}

export interface LoginDto {
  email: string
  password: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  message: string
  status: number
}

// ============================================
// UI HELPER TYPES
// ============================================

export interface SelectOption {
  value: string
  label: string
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface FilterOption {
  key: string
  value: string | number | boolean
  label: string
}

// ============================================
// FORM VALIDATION
// ============================================

export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  values: T
  errors: Record<keyof T, string | undefined>
  isSubmitting: boolean
  isValid: boolean
}
