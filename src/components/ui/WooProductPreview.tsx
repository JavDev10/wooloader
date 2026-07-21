import { useMemo, useState, type ReactNode } from 'react'
import { ImageOff, Star } from 'lucide-react'
import type { Product, Variant } from '@/lib/types'

function formatPrice(value: number): string {
  return `$${value.toLocaleString('es-CL')}`
}

function getVariantPriceRange(variants: Variant[]): { min: number; max: number } | null {
  const prices = variants.map((v) => v.price).filter((p): p is number => p !== null)
  if (prices.length === 0) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function findMatchingVariant(variants: Variant[], selection: Record<string, string>): Variant | undefined {
  return variants.find((v) => Object.entries(selection).every(([name, value]) => v.attribute_values[name] === value))
}

function renderPrice(price: number | null, salePrice: number | null): ReactNode {
  if (price === null) return '—'
  if (salePrice) {
    return (
      <>
        <span className="mr-2 text-base font-normal text-gray-400 line-through">{formatPrice(price)}</span>
        {formatPrice(salePrice)}
      </>
    )
  }
  return formatPrice(price)
}

/**
 * Illustrative-only mockup of a generic WooCommerce single-product page — not a
 * pixel-accurate render of any real store's theme, just enough to picture roughly
 * how the product will look once live. Shows a main image with a gallery thumbnail
 * strip, and for variable products lets you pick attribute values (like Color/Size
 * on a real product page) and updates the price/image to match that variant.
 */
export function WooProductPreview({ product }: { product: Product }) {
  const hasVariants = product.attributes.length > 0

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.attributes.map((a) => [a.name, a.values[0] ?? ''])),
  )
  // Which gallery image was clicked to view as the main one. A selected
  // variant's own image takes precedence over this.
  const [pickedImageUrl, setPickedImageUrl] = useState<string | null>(null)

  // Deleted (excluded) combinations aren't real products — ignore them here
  // so the preview shows "no price loaded" instead of a phantom variant.
  const activeVariants = useMemo(
    () => product.variants.filter((v) => !v.excluded),
    [product.variants],
  )

  const selectedVariant = useMemo(
    () => (hasVariants ? findMatchingVariant(activeVariants, selection) : undefined),
    [hasVariants, activeVariants, selection],
  )

  function setAttributeValue(name: string, value: string) {
    setSelection((s) => ({ ...s, [name]: value }))
  }

  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0]
  const mainImageUrl = selectedVariant?.image_url ?? pickedImageUrl ?? primaryImage?.url ?? null

  const price = hasVariants ? (selectedVariant?.price ?? null) : product.is_quote_only ? null : product.regular_price
  const salePrice = hasVariants ? (selectedVariant?.sale_price ?? null) : product.is_quote_only ? null : product.sale_price

  const priceRange = hasVariants && !selectedVariant ? getVariantPriceRange(activeVariants) : null

  const discountPercent =
    price && salePrice && salePrice < price ? Math.round(100 - (salePrice / price) * 100) : null

  const breadcrumb = ['Tienda', product.category, product.subcategory].filter(Boolean).join(' / ')

  return (
    // Breaks out wider than the editor column (capped at max-w-2xl) so the
    // image and layout have room to breathe. Centered, capped at max-w-4xl;
    // on narrow screens w-screen keeps it full width.
    <div className="relative left-1/2 w-screen max-w-4xl -translate-x-1/2 px-6">
      <div className="rounded-lg bg-white p-5 text-gray-900 shadow-lg">
        <p className="mb-4 truncate text-xs text-gray-400">
          {breadcrumb} / {product.name || 'Producto'}
        </p>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Gallery */}
          <div className="w-full flex-shrink-0 sm:w-80">
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
              {mainImageUrl ? (
                <img src={mainImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ImageOff size={40} />
                </div>
              )}
              {discountPercent !== null && (
                <span className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img) => {
                  const isActive = mainImageUrl === img.url
                  return (
                    <button
                      key={img.storage_path}
                      type="button"
                      onClick={() => setPickedImageUrl(img.url)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition ${
                        isActive ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label="Ver esta imagen"
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{product.name || 'Nombre del producto'}</h3>

            <div className="mt-1 flex items-center gap-2">
              <div className="flex gap-0.5 text-amber-400" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <span className="text-[10px] text-gray-400">(ejemplo)</span>
            </div>

            <p className="mt-3 text-2xl font-bold text-emerald-600">
              {product.is_quote_only
                ? 'Consultar precio'
                : priceRange
                  ? priceRange.min === priceRange.max
                    ? formatPrice(priceRange.min)
                    : `Desde ${formatPrice(priceRange.min)}`
                  : renderPrice(price, salePrice)}
            </p>

            {product.short_description && (
              <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{product.short_description}</p>
            )}

            {hasVariants && (
              <div className="mt-4 space-y-2">
                {product.attributes.map((attr) => (
                  <label key={attr.name} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-16 flex-shrink-0 font-medium">{attr.name}:</span>
                    <select
                      value={selection[attr.name] ?? ''}
                      onChange={(e) => setAttributeValue(attr.name, e.target.value)}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                    >
                      {attr.values.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                {!selectedVariant && (
                  <p className="text-xs text-amber-600">Esa combinación todavía no tiene precio cargado.</p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled
              className="mt-5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
            >
              Agregar al carrito
            </button>
          </div>
        </div>

        {/* Long description below, like the description area of a real product page */}
        {product.description && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Descripción</h4>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
