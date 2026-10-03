import { ButtonHTMLAttributes } from 'react'
import { Icon, IconName } from './Icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  icon?: IconName
}

const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:brightness-110 disabled:bg-line disabled:text-muted disabled:brightness-100',
  secondary: 'bg-surface text-ink border border-card-line hover:bg-chip disabled:text-muted',
  ghost: 'bg-transparent text-muted hover:text-ink',
}

const SIZES = {
  md: 'h-[52px] rounded-[14px] px-4 text-base',
  lg: 'h-14 rounded-2xl px-5 text-[17px]',
}

export const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  type = 'button',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold font-sans
        transition-colors disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${FOCUS_RING} ${className}
      `}
      {...rest}
    >
      {icon && <Icon name={icon} size={18} strokeWidth={2} />}
      {children}
    </button>
  )
}
