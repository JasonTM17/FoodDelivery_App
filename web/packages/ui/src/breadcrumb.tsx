'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  homeHref?: string;
  homeLabel?: string;
  label?: string;
}

export function Breadcrumb({
  items,
  className = '',
  homeHref = '/',
  homeLabel = 'Home',
  label = 'Breadcrumb',
}: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={`animate-fade-in-up ${className}`}>
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href={homeHref}
            className="flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Home aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">{homeLabel}</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground/50" />
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
