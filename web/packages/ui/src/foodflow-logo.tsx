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
  const routeId = `foodflow-mark-route-${id}`

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        focusable="false"
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
          <linearGradient id={routeId} x1="15" y1="19" x2="49" y2="47" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.54" stopColor="#FFEDD5" />
            <stop offset="1" stopColor="#DCFCE7" />
          </linearGradient>
        </defs>

        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${backgroundId})`} />
        <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${shineId})`} />
        <rect x="5.25" y="5.25" width="53.5" height="53.5" rx="16" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" />

        <path
          d="M18.5 22.5c5.8-5.7 15.1-6.6 21.8-1.8 4.4 3.1 6.9 7.4 7.2 12.1"
          fill="none"
          stroke={`url(#${routeId})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeDasharray="1 7"
          opacity="0.95"
        />
        <circle cx="18.5" cy="22.5" r="4.2" fill="#FFF7ED" />
        <circle cx="18.5" cy="22.5" r="1.6" fill="#F97316" />

        <path
          d="M15.5 36.2h33c-1.7 8.5-8 14.1-16.5 14.1s-14.8-5.6-16.5-14.1Z"
          fill="#FFF7ED"
          opacity="0.96"
        />
        <path d="M14.8 34.2h34.4" stroke="#FFEDD5" strokeWidth="3.8" strokeLinecap="round" />
        <path
          d="M21.2 31.1c4.8-6.7 11.3-7.7 16.3-11.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24.2 29.3c4.7 1.1 8.7 2.5 13.2 6.4"
          fill="none"
          stroke="#FED7AA"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M40.6 12.3c5.2.5 8.6 4.1 9.1 9.2-5.1-.1-8.9-3.7-9.1-9.2Z"
          fill="#BBF7D0"
        />
        <path
          d="M37.7 15c-3.8 4.2-3.8 9-.5 13.1 4.7-3.2 5.1-8.4.5-13.1Z"
          fill="#22C55E"
        />
        <path
          d="M43.8 31.9c4.2 0 7.2 3 7.2 6.8 0 5.1-7.2 10.6-7.2 10.6s-7.2-5.5-7.2-10.6c0-3.8 3-6.8 7.2-6.8Z"
          fill="#166534"
          opacity="0.92"
        />
        <circle cx="43.8" cy="38.8" r="2.5" fill="#DCFCE7" />
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
