import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}

export function useToast() {
  const toast = ({ title, description, variant, ...props }: ToastProps) => {
    const message = description || title || ''
    
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
        ...props,
      })
    } else {
      sonnerToast.success(title, {
        description,
        ...props,
      })
    }
  }

  return {
    toast,
  }
}
