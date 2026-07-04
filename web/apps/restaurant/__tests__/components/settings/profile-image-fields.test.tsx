import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileImageFields } from '@/components/settings/profile-image-fields';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      title: 'Profile images',
      cover: 'Cover image',
      logo: 'Restaurant logo',
      uploadCover: 'Upload cover',
      uploadLogo: 'Upload logo',
      coverPreviewLabel: 'Localized cover preview',
      logoPreviewLabel: 'Localized logo preview',
      logoHint: 'Square image recommended',
    };
    return messages[key] ?? key;
  },
}));

describe('ProfileImageFields', () => {
  it('uses localized accessible labels for uploaded image previews', () => {
    render(
      <ProfileImageFields
        coverPreview="https://images.example.com/cover.jpg"
        logoPreview="https://images.example.com/logo.jpg"
        coverRef={createRef<HTMLInputElement>()}
        logoRef={createRef<HTMLInputElement>()}
        onImageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'Localized cover preview' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Localized logo preview' })).toBeInTheDocument();
  });
});
