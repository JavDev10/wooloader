import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { deleteProductImage, uploadProductImage } from '@/lib/api/storage'
import { processImage, SQUARE_IMAGE_SIZE } from '@/lib/imageValidation'
import type { StepProps } from '@/routes/app/steps/types'

export default function ImagesStep({ product, onChange, userId, catalogId }: StepProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      setUploading(true)
      try {
        const readyFiles = await Promise.all(
          files.map((file) => processImage(file, { square: product.square_images })),
        )
        if (readyFiles.length === 0) return

        const uploaded = await Promise.all(
          readyFiles.map((file) => uploadProductImage(userId, catalogId, product.id, file)),
        )
        const images = [...product.images, ...uploaded].map((img, i) => ({
          ...img,
          sort_order: i,
          is_primary: i === 0,
        }))
        onChange({ images })
      } finally {
        setUploading(false)
      }
    },
    [userId, catalogId, product.id, product.images, product.square_images, onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  })

  async function removeImage(storagePath: string) {
    await deleteProductImage(storagePath)
    onChange({
      images: product.images
        .filter((img) => img.storage_path !== storagePath)
        .map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })),
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('images.title')}</p>

      <label className="flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={product.square_images}
          onChange={(e) => onChange({ square_images: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-accent"
        />
        <span>
          {t('images.squareLabel', { size: SQUARE_IMAGE_SIZE })}
          <span className="mt-0.5 block text-xs text-faint">{t('images.squareHint')}</span>
        </span>
      </label>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-md border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive ? 'border-accent bg-accent/10' : 'border-line'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-muted">{uploading ? t('images.uploading') : t('images.dropzone')}</p>
      </div>

      {product.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {product.images.map((img) => (
            <div key={img.storage_path} className="group relative">
              <img src={img.url} alt="" className="aspect-square w-full rounded-md object-cover" />
              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent">
                  {t('images.primary')}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.storage_path)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition group-hover:opacity-100"
                aria-label={t('images.deleteImage')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
