'use client';

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ProductForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [published, setPublished] = useState(false)
  const [images, setImages] = useState<string[]>([])

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
      const res = await fetch('/api/products', {
        method: 'POST',
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

      router.push('/products')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="product-name"
                style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}
              >
                Product Name
              </label>
              <input
                id="product-name"
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
                placeholder="My Awesome Product"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="product-description"
                style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}
              >
                Description
              </label>
              <textarea
                id="product-description"
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
                placeholder="Describe your product..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="product-price"
                style={{ fontSize: 'var(--text-label-medium-font-size)', color: 'var(--color-on-surface)' }}
              >
                Price (NGN)
              </label>
              <input
                id="product-price"
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
                placeholder="1,000"
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
                Publish immediately
              </span>
            </label>

            {error && (
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Create Product
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
