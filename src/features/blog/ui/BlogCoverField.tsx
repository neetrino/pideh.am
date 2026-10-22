'use client';

import { useRef } from 'react';

import { ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type BlogCoverFieldProps = {
  preview: string | null;
  disabled: boolean;
  copy: Dictionary['admin']['blog']['drawer'];
  onPick: (file: File) => void;
  onRemove: () => void;
};

/** Cover image picker with local preview for the blog drawer. */
export function BlogCoverField({ preview, disabled, copy, onPick, onRemove }: BlogCoverFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className={ADMIN_LABEL}>{copy.coverImage}</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center rounded-[18px] border-[1.5px] border-dashed border-[#1e1e1e]/20 bg-white px-4 py-2 text-sm font-bold text-[#1e1e1e] transition hover:border-[#ff6b00] hover:text-[#ff6b00] disabled:opacity-50"
        >
          {preview ? copy.changeImage : copy.uploadImage}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onPick(file);
          }}
        />
        {preview ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="text-sm font-bold text-[#1e1e1e]/60 hover:text-red-600"
          >
            {copy.remove}
          </button>
        ) : null}
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob/admin preview
        <img
          src={preview}
          alt=""
          className="mt-3 h-28 w-28 rounded-[18px] border border-[#1e1e1e]/10 object-cover"
        />
      ) : null}
    </div>
  );
}
