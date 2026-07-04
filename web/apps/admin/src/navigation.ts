/**
 * Locale-aware navigation helpers for the admin app.
 * Use these instead of next/navigation's Link, usePathname, useRouter
 * inside routes that live under app/[locale]/.
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
