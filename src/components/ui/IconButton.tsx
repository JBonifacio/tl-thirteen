import { ButtonHTMLAttributes } from 'react'
import { Icon, IconName } from './Icon'
import { FOCUS_RING } from './Button'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: IconName
  label: string // required: icon-only buttons need an accessible name
  filled?: boolean
}

export function IconButton({ icon, label, filled = false, type = 'button', className = '', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`
        w-11 h-11 flex-shrink-0 rounded-full inline-flex items-center justify-center
        text-ink transition-colors ${filled ? 'bg-chip hover:bg-line' : 'hover:bg-chip'}
        ${FOCUS_RING} ${className}
      `}
      {...rest}
    >
      <Icon name={icon} size={filled ? 18 : 20} strokeWidth={filled ? 2 : 1.8} />
    </button>
  )
}
