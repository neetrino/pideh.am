'use client';

import { useRef, useState, useTransition } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  ADMIN_CHECKBOX,
  ADMIN_CHECKBOX_LABEL,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '@/features/admin/ui/admin-form-classes';
import { uploadCashChangeImageAction } from '@/features/delivery/application/upload-cash-change-image';
import type { CashChangeDenomination } from '@/features/delivery/domain/cash-change';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import { formatMoneyAmount } from '@/lib/money/format';

type CashChangeCopy = Dictionary['admin']['delivery']['cashChange'];

type AdminCashChangeEditorProps = {
  locale: string;
  value: CashChangeDenomination[];
  imageUrls: Record<string, string>;
  onChange: (next: CashChangeDenomination[]) => void;
  onImageUrlsChange: (next: Record<string, string>) => void;
  disabled?: boolean;
  copy: CashChangeCopy;
};

export function AdminCashChangeEditor({
  locale,
  value,
  imageUrls,
  onChange,
  onImageUrlsChange,
  disabled = false,
  copy,
}: AdminCashChangeEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();

  function updateItem(id: string, patch: Partial<CashChangeDenomination>): void {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem(): void {
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        amount: 0,
        imageObjectKey: null,
        isActive: true,
        sortOrder: value.length,
      },
    ]);
  }

  function removeItem(id: string): void {
    onChange(value.filter((item) => item.id !== id));
    const nextUrls = { ...imageUrls };
    delete nextUrls[id];
    onImageUrlsChange(nextUrls);
  }

  function pickImage(id: string): void {
    setUploadTargetId(id);
    setError(null);
    fileInputRef.current?.click();
  }

  function onFileSelected(fileList: FileList | null): void {
    const file = fileList?.[0];
    const targetId = uploadTargetId;
    if (!file || !targetId) return;

    startUpload(async () => {
      const formData = new FormData();
      formData.set('file', file);
      const result = await uploadCashChangeImageAction(locale, formData);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      updateItem(targetId, { imageObjectKey: result.value.objectKey });
      onImageUrlsChange({
        ...imageUrls,
        [targetId]: result.value.url,
      });
      setUploadTargetId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="pr-40">
          <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{copy.hint}</p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={disabled || isUploading || value.length >= 20}
          onClick={addItem}
          className="absolute top-0 right-0 inline-flex items-center gap-1.5 bg-[#ff6b00] whitespace-nowrap text-white hover:bg-[#e85f00]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {copy.add}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => onFileSelected(event.target.files)}
      />

      <ul className="space-y-3">
        {value.map((item) => {
          const previewUrl = imageUrls[item.id] ?? null;
          return (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote/local object URL
                  <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-2 text-center text-xs text-gray-400">{copy.noImage}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className={ADMIN_LABEL}>{copy.amount}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={item.amount > 0 ? String(item.amount) : ''}
                    onChange={(event) =>
                      updateItem(item.id, {
                        amount: Number(event.target.value) || 0,
                      })
                    }
                    placeholder={copy.amountPlaceholder}
                    className={`${ADMIN_INPUT} min-w-0 flex-1`}
                    disabled={disabled || isUploading}
                  />
                  <label className={ADMIN_CHECKBOX_LABEL}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(event) => updateItem(item.id, { isActive: event.target.checked })}
                      disabled={disabled || isUploading}
                      className={ADMIN_CHECKBOX}
                    />
                    {copy.active}
                  </label>
                  <button
                    type="button"
                    disabled={disabled || isUploading}
                    onClick={() => pickImage(item.id)}
                    aria-label={previewUrl ? copy.changeImage : copy.uploadImage}
                    title={previewUrl ? copy.changeImage : copy.uploadImage}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-[18px] border-[1.5px] border-[#1e1e1e]/12 text-[#ff6b00] transition hover:border-[#ff6b00]/40 hover:bg-[#fff8e7] disabled:opacity-50"
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || isUploading}
                    onClick={() => removeItem(item.id)}
                    aria-label={copy.remove}
                    title={copy.remove}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-[18px] border-[1.5px] border-[#1e1e1e]/12 text-[#1e1e1e]/70 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                {item.amount > 0 ? (
                  <span className="mt-1 block text-xs text-gray-500">
                    {formatMoneyAmount(item.amount, 'AMD', locale)}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

    </div>
  );
}
