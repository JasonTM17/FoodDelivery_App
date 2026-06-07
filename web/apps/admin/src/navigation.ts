/**
 * Locale-aware navigation helpers for the admin app.
 * Use these instead of next/navigation's Link, usePathname, useRouter
 * inside routes that live under app/[locale]/.
 */
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from '@foodflow/i18n';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
