import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={[
        'w-full min-[1200px]:w-[1200px] min-[1200px]:mx-auto',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
