import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'energy' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  icon?: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  energy: 'btn-energy',
  ghost: 'btn-ghost',
}

export function Button({
  variant = 'primary',
  fullWidth,
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
