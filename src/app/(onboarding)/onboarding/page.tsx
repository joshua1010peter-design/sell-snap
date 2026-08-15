'use client';

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [animKey, setAnimKey] = useState(0)
  const [prevStep, setPrevStep] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [storePhone, setStorePhone] = useState('')

  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productImage, setProductImage] = useState('')
  const [skipProduct, setSkipProduct] = useState(false)

  const [currency, setCurrency] = useState('NGN')

  const [fieldErrors, setFieldErrors] = useState<{ businessName?: string; productName?: string; productPrice?: string }>({})

  function clearError(field: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function goToStep(n: number) {
    if (n === step || transitioning) return
    setError('')
    setPrevStep(step)
    setTransitioning(true)

    setTimeout(() => {
      setStep(n)
      setAnimKey((k) => k + 1)

      setTimeout(() => {
        setTransitioning(false)
        setPrevStep(null)
      }, 500)
    }, 500)
  }

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

      setProductImage(data.data.url)
    } catch {
      setError('Image upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function canProceedStep1() {
    return businessName.trim().length > 0
  }

  function canProceedStep2() {
    if (skipProduct) return true
    if (!productName.trim() || !productPrice) return false
    return !isNaN(Number(productPrice)) && Number(productPrice) > 0
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const errors: { businessName?: string } = {}
    if (!businessName.trim()) errors.businessName = 'this field must not be empty'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          storeDescription,
          storePhone,
          product: skipProduct ? null : {
            name: productName,
            price: Math.round(parseFloat(productPrice) * 100),
            image: productImage,
          },
          currency,
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        setError(data.error.message)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 3) * 100

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-2">
          <Link
            href="/"
            className="no-underline hover:underline"
            style={{
              fontSize: 'var(--text-headline-small-font-size)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            SELL SNAP
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent>
            <p
              className="mb-1 text-center"
              style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                fontWeight: 'var(--text-title-medium-font-weight)',
                lineHeight: 1,
                color: 'var(--color-on-surface)',
              }}
            >
              Set up your store
            </p>

            <p
              className="mb-4 text-center"
              style={{
                fontSize: 'var(--text-label-small-font-size)',
                fontWeight: 'var(--text-label-small-font-weight)',
                lineHeight: 'var(--text-label-small-line-height)',
                fontFamily: 'var(--text-label-small-font-family)',
                color: 'var(--color-outline)',
              }}
            >
              Step {step} of 3
            </p>

            <div
              className="w-full h-1.5 rounded-full mb-6 overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-variant)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                  color: 'color-mix(in srgb, var(--color-error) 70%, white)',
                  fontSize: 'var(--text-body-small-font-size)',
                }}
              >
                {error}
              </div>
            )}

            {(step === 1 || (transitioning && prevStep === 1)) && (
              <div key={`step1-${animKey}`} className={`flex flex-col gap-4 items-center ${transitioning && prevStep === 1 ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                <div className="w-full text-left">
                  <Input
                    id="onboard-business-name"
                    label="Business Name"
                    value={businessName}
                    onChange={(e) => { setBusinessName(e.target.value); clearError('businessName') }}
                    placeholder="My Store"
                    autoFocus
                    required
                  />
                  {fieldErrors.businessName && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{fieldErrors.businessName}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label
                    htmlFor="onboard-description"
                    style={{
                      fontSize: 'var(--text-label-medium-font-size)',
                      fontWeight: 'var(--text-label-medium-font-weight)',
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Store Description
                  </label>
                  <textarea
                    id="onboard-description"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] resize-y min-h-[80px]"
                    style={{
                      backgroundColor: 'var(--color-surface-container-low)',
                      borderBottomWidth: 2,
                      color: 'var(--color-on-surface)',
                      fontSize: 'var(--text-body-medium-font-size)',
                      fontFamily: 'var(--text-body-medium-font-family)',
                      caretColor: 'var(--color-primary)',
                    }}
                    placeholder="Tell customers what you sell..."
                  />
                </div>

                <div className="w-full text-left">
                  <Input
                    id="onboard-phone"
                    label="Phone Number"
                    type="tel"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div className="mt-2 flex justify-center">
                  <Button
                    type="button"
                    onClick={() => {
                      const errors: { businessName?: string } = {}
                      if (!businessName.trim()) errors.businessName = 'Field cannot be empty'
                      setFieldErrors(errors)
                      if (Object.keys(errors).length > 0) return
                      goToStep(2)
                    }}
                    className="w-full sm:w-fit"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {(step === 2 || (transitioning && prevStep === 2)) && (
              <div key={`step2-${animKey}`} className={`flex flex-col gap-4 ${transitioning && prevStep === 2 ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                <p
                  style={{
                    fontSize: 'var(--text-body-small-font-size)',
                    color: 'var(--color-on-surface-variant)',
                  }}
                >
                  Add your first product to start selling. You can always add more later.
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipProduct}
                    onChange={(e) => setSkipProduct(e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
                    Skip This Step
                  </span>
                </label>

                {!skipProduct && (
                  <>
                    <div className="w-full">
                      <Input
                        id="onboard-product-name"
                        label="Product Name"
                        value={productName}
                        onChange={(e) => { setProductName(e.target.value); clearError('productName') }}
                        placeholder="e.g. Custom T-Shirt"
                        autoFocus
                        required
                      />
                      {fieldErrors.productName && (
                        <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{fieldErrors.productName}</p>
                      )}
                    </div>

                    <div className="w-full">
                      <Input
                        id="onboard-product-price"
                        label={`Price (${currency})`}
                        type="number"
                        min="0"
                        value={productPrice}
                        onChange={(e) => { setProductPrice(e.target.value); clearError('productPrice') }}
                        placeholder="5000"
                      />
                      {fieldErrors.productPrice && (
                        <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{fieldErrors.productPrice}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        style={{
                          fontSize: 'var(--text-label-medium-font-size)',
                          fontWeight: 'var(--text-label-medium-font-weight)',
                          color: 'var(--color-on-surface)',
                        }}
                      >
                        Product Image
                      </label>

                      {productImage && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden mb-2" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
                          <img src={productImage} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductImage('')}
                            className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full text-xs text-white"
                            style={{ backgroundColor: 'var(--color-error)' }}
                          >
                            ×
                          </button>
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
                          {productImage ? 'Change Image' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!skipProduct) {
                        const errors: { productName?: string; productPrice?: string } = {}
                        if (!productName.trim()) errors.productName = 'Field cannot be empty'
                        if (!productPrice) errors.productPrice = 'Field cannot be empty'
                        setFieldErrors(errors)
                        if (Object.keys(errors).length > 0) return
                      }
                      goToStep(3)
                    }}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goToStep(1)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {(step === 3 || (transitioning && prevStep === 3)) && (
              <form key={`step3-${animKey}`} onSubmit={handleComplete} className={`flex flex-col gap-4 ${transitioning && prevStep === 3 ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
                <p
                  className="hidden sm:block"
                  style={{
                    fontSize: 'var(--text-body-medium-font-size)',
                    lineHeight: 1,
                    color: 'var(--color-on-surface-variant)',
                  }}
                >
                  Almost done! Review below.
                </p>

                <div
                  className="rounded-lg p-4 flex flex-col gap-3"
                  style={{ backgroundColor: 'var(--color-surface-container-low)' }}
                >
                  <div>
                    <p style={{ fontSize: 'var(--text-label-small-font-size)', color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>Business</p>
                    <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)', fontWeight: 600 }}>{businessName}</p>
                    {fieldErrors.businessName && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{fieldErrors.businessName}</p>
                    )}
                  </div>
                  {storeDescription && (
                    <div>
                      <p style={{ fontSize: 'var(--text-label-small-font-size)', color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>Description</p>
                      <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>{storeDescription}</p>
                    </div>
                  )}
                  {!skipProduct && productName && (
                    <div>
                      <p style={{ fontSize: 'var(--text-label-small-font-size)', color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>First Product</p>
                      <p style={{ fontSize: 'var(--text-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
                        {productName} — {currency} {Number(productPrice).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onboard-currency"
                    style={{
                      fontSize: 'var(--text-label-medium-font-size)',
                      fontWeight: 'var(--text-label-medium-font-weight)',
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Preferred Currency
                  </label>
                  <select
                    id="onboard-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)]"
                    style={{
                      backgroundColor: 'var(--color-surface-container-low)',
                      borderBottomWidth: 2,
                      color: 'var(--color-on-surface)',
                      fontSize: 'var(--text-body-medium-font-size)',
                      fontFamily: 'var(--text-body-medium-font-family)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    Go To Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => goToStep(2)}
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
