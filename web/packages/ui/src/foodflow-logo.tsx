import * as React from "react"
import { cn } from "./lib/utils"

export interface FoodFlowLogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string
  showWordmark?: boolean
  descriptor?: string
  markClassName?: string
  wordmarkClassName?: string
  descriptorClassName?: string
}

export function FoodFlowLogo({
  label = "FoodFlow",
  showWordmark = true,
  descriptor,
  className,
  markClassName,
  wordmarkClassName,
  descriptorClassName,
  ...props
}: FoodFlowLogoProps) {
  const id = React.useId().replace(/:/g, "")
  const backgroundId = `foodflow-mark-bg-${id}`
  const shineId = `foodflow-mark-shine-${id}`

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={cn("h-10 w-10 shrink-0 drop-shadow-sm", markClassName)}
      >
        <defs>
          <linearGradient id={backgroundId} x1="9" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F97316" />
            <stop offset="0.56" stopColor="#FB923C" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
          <radialGradient id={shineId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22 16) rotate(51.8) scale(42.4)">
            <stop stopColor="#FFF7ED" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFF7ED" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${backgroundId})`} />
        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${shineId})`} />
        <path
          d="M16 35.5h32c-1.6 8.2-7.8 13.8-16 13.8s-14.4-5.6-16-13.8Z"
          fill="#FFF7ED"
          opacity="0.96"
        />
        <path d="M15 33.5h34" stroke="#FFEDD5" strokeWidth="3.6" strokeLinecap="round" />
        <path
          d="M18.5 30.2C23.7 20.8 31.6 20 38.2 16"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22.4 27.7c4.9 1.3 9.7 2.5 14.7 7"
          fill="none"
          stroke="#FED7AA"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <circle cx="18.5" cy="30.2" r="4.2" fill="#FFFBEB" />
        <path
          d="M38.5 11.8c5.2.5 8.8 4.1 9.3 9.4-5.3-.2-9.2-3.9-9.3-9.4Z"
          fill="#BBF7D0"
        />
        <path
          d="M36 14.2c-3.8 4.2-3.9 9.1-.5 13.4 4.8-3.3 5.2-8.6.5-13.4Z"
          fill="#22C55E"
        />
      </svg>

      {showWordmark ? (
        <span className="min-w-0">
          <span className={cn("block truncate text-lg font-bold tracking-tight text-slate-950", wordmarkClassName)}>
            Food<span className="text-orange-500">Flow</span>
          </span>
          {descriptor ? (
            <span className={cn("block truncate text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500", descriptorClassName)}>
              {descriptor}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}
