'use client';

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface ProductData {
  id: string
  name: string
  description: string | null
  price: number
  published: boolean
  slug: string
  images: string
}

export function ProductEditForm({ product }: { product: ProductData }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(String(product.price / 100))
  const [published, setPublished] = useState(product.published)
  const [images, setImages] = useState<string[]>(() => {
    try { return JSON.parse(product.images) } catch { return [] }
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error.message)
        return
      }

      setImages((prev) => [...prev, data.data.url])
    } catch {
      setError('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: Math.round(parseFloat(price) * 100),
          published,
          images,
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error.message)
        return
      }

      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error.message)
        return
      }

      router.push('/products')
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  const shareUrl = `${window.location.origin}/p/${product.slug}`

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
                  Product Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                  style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderBottomWidth: 2,
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--text-body-medium-font-size)',
                    caretColor: 'var(--color-primary)',
                  }}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] resize-y min-h-[100px]"
                  style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderBottomWidth: 2,
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--text-body-medium-font-size)',
                    fontFamily: 'var(--text-body-medium-font-family)',
                    caretColor: 'var(--color-primary)',
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
                  Price (NGN)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={price ? Number(price.replace(/,/g, '')).toLocaleString() : ''}
                  onChange={(e) => setPrice(e.target.value.replace(/,/g, ''))}
                  className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                  style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderBottomWidth: 2,
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--text-body-medium-font-size)',
                    caretColor: 'var(--color-primary)',
                  }}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}>
                  Product Images
                </label>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {images.map((url) => (
                      <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full text-xs text-white"
                          style={{ backgroundColor: 'var(--color-error)' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {images.length > 0 ? 'Add Another Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
                  Published
                </span>
              </label>

              {error && (
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
                <Button type="button" variant="danger" onClick={handleDelete} loading={deleting}>
                  Delete
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3
            className="mb-3"
            style={{ fontSize: 'var(--text-title-small-font-size)', color: 'var(--color-on-surface)' }}
          >
            Share Link
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-lg outline-none border-0 border-b border-[var(--color-outline-variant)]"
              style={{
                backgroundColor: 'var(--color-surface-container-low)',
                borderBottomWidth: 2,
                color: 'var(--color-on-surface)',
                fontSize: 'var(--text-body-medium-font-size)',
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => { navigator.clipboard.writeText(shareUrl) }}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
