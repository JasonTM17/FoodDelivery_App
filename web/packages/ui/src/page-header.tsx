import * as React from "react"
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb"

export interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ breadcrumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumbs} />
      <div className="animate-fade-in-up flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-green-500 to-amber-500 bg-clip-text text-transparent">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}
