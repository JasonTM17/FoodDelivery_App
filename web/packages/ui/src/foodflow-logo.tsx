import * as React from "react"
import { cn } from "./lib/utils"

export interface FoodFlowLogoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string
  showWordmark?: boolean
  descriptor?: string
  markClassName?: string
  wordmarkClassName?: string
  accentClassName?: string
  descriptorClassName?: string
}

export function FoodFlowLogo({
  label = "FoodFlow",
  showWordmark = true,
  descriptor,
  className,
  markClassName,
  wordmarkClassName,
  accentClassName,
  descriptorClassName,
  ...props
}: FoodFlowLogoProps) {
  const id = React.useId().replace(/:/g, "")
  const surfaceId = `foodflow-mark-surface-${id}`
  const glowId = `foodflow-mark-glow-${id}`
  const routeId = `foodflow-mark-route-${id}`
  const leafId = `foodflow-mark-leaf-${id}`
  const pinId = `foodflow-mark-pin-${id}`

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
          <linearGradient id={surfaceId} x1="8" y1="8" x2="57" y2="57" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EA580C" />
            <stop offset="0.48" stopColor="#F97316" />
            <stop offset="1" stopColor="#15803D" />
          </linearGradient>
          <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21 16) rotate(48) scale(42)">
            <stop stopColor="#FFF7ED" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFF7ED" stopOpacity="0.04" />
          </radialGradient>
          <linearGradient id={routeId} x1="15" y1="17" x2="51" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#FED7AA" />
            <stop offset="1" stopColor="#DCFCE7" />
          </linearGradient>
          <linearGradient id={leafId} x1="30" y1="12" x2="48" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DCFCE7" />
            <stop offset="1" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id={pinId} x1="38" y1="29" x2="51" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#166534" />
            <stop offset="1" stopColor="#14532D" />
          </linearGradient>
        </defs>

        <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${surfaceId})`} />
        <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${glowId})`} />
        <rect x="5.25" y="5.25" width="53.5" height="53.5" rx="16.75" fill="none" stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="1.5" />

        <path
          d="M16.5 26.4c7-9.9 21.8-10.9 31-.5"
          fill="none"
          stroke={`url(#${routeId})`}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.95"
        />
        <circle cx="16.5" cy="26.4" r="4.1" fill="#FFF7ED" />
        <circle cx="16.5" cy="26.4" r="1.55" fill="#EA580C" />

        <path
          d="M14.6 37.1h34.8c-2 8.3-8.6 13.8-17.4 13.8s-15.4-5.5-17.4-13.8Z"
          fill="#FFF7ED"
          opacity="0.96"
        />
        <path d="M14.2 34.8h35.6" stroke="#FFEDD5" strokeWidth="3.9" strokeLinecap="round" />
        <path
          d="M22.4 31.2c4.7-5.8 10.6-6.8 15.4-10.6"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.8 28.7c4.4 1.2 8.3 2.8 12.9 6.7"
          fill="none"
          stroke="#FED7AA"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M39.5 12.7c5.3.6 8.5 4.2 8.9 9.2-5.2 0-8.7-3.6-8.9-9.2Z"
          fill={`url(#${leafId})`}
        />
        <path
          d="M36.8 15.2c-3.6 4.4-3.5 9.2-.1 13.1 4.5-3.3 4.8-8.4.1-13.1Z"
          fill="#22C55E"
        />
        <path
          d="M44.5 31.9c4.1 0 7.1 3 7.1 6.8 0 5.1-7.1 10.7-7.1 10.7s-7.1-5.6-7.1-10.7c0-3.8 3-6.8 7.1-6.8Z"
          fill={`url(#${pinId})`}
          opacity="0.92"
        />
        <circle cx="44.5" cy="38.7" r="2.5" fill="#DCFCE7" />
      </svg>

      {showWordmark ? (
        <span className="min-w-0">
          <span className={cn("block truncate text-lg font-bold tracking-tight text-slate-950", wordmarkClassName)}>
            Food<span className={accentClassName ?? "text-orange-700"}>Flow</span>
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
