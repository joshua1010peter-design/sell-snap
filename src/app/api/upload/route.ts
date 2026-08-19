import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name) || '.jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ ok: true, data: { url: `/uploads/${filename}` } })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } },
      { status: 500 },
    )
  }
}
