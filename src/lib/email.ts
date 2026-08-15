import nodemailer from 'nodemailer'

const fromAddr = process.env.EMAIL_FROM ?? 'SELL SNAP <noreply@sellsnap.com>'
const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const transporter = getTransporter()
    const info = await transporter.sendMail({ from: fromAddr, to, subject, html, text })
    return { ok: true as const, data: { messageId: info.messageId } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error'
    console.error('[email] send failed', { error: message, to, subject })
    return { ok: false as const, error: message }
  }
}

function orderConfirmationHtml(params: {
  buyerName: string
  productName: string
  quantity: number
  amount: string
  orderId: string
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:32px 16px">
  <table align="center" width="100%" style="max-width:560px">
    <tr><td style="background:#fff;border-radius:12px;padding:32px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#111">Thank you for purchasing with us.</h1>
      <p style="color:#555;line-height:1.6">Hi ${params.buyerName},</p>
      <p style="color:#555;line-height:1.6">Thank you for purchasing with us. Your payment was successful and the seller has been notified.</p>
      <table width="100%" style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">Item</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#111;font-weight:600">${params.productName} × ${params.quantity}</td></tr>
        <tr><td style="padding:8px 0;color:#555">Total</td>
            <td style="padding:8px 0;text-align:right;color:#111;font-weight:600">${params.amount}</td></tr>
      </table>
      <p style="color:#888;font-size:13px">Reference: ${params.orderId}</p>
      <p style="color:#555;line-height:1.6">The seller will process your order shortly.</p>
      <p style="color:#555;line-height:1.6">If you have any questions, please contact the seller directly.</p>
    </td></tr>
  </table>
</body>
</html>`
}

function sellerNotificationHtml(params: {
  sellerName: string
  productName: string
  quantity: number
  amount: string
  buyerName: string | null
  buyerEmail: string
  buyerPhone: string | null
  orderId: string
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:32px 16px">
  <table align="center" width="100%" style="max-width:560px">
    <tr><td style="background:#fff;border-radius:12px;padding:32px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#111">New order received</h1>
      <p style="color:#555;line-height:1.6">Hi ${params.sellerName},</p>
      <p style="color:#555;line-height:1.6">You have a new order!</p>
      <table width="100%" style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">Product</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#111;font-weight:600">${params.productName} × ${params.quantity}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#555">Total</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#111;font-weight:600">${params.amount}</td></tr>
        <tr><td style="padding:8px 0;color:#555">Buyer</td>
            <td style="padding:8px 0;text-align:right;color:#111">${params.buyerName ?? params.buyerEmail}${params.buyerPhone ? ` · ${params.buyerPhone}` : ''}</td></tr>
      </table>
      <p style="color:#888;font-size:13px">Reference: ${params.orderId}</p>
      <p style="margin-top:20px"><a href="${appUrl}/orders/${params.orderId}" style="display:inline-block;background:#00c853;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">View order</a></p>
    </td></tr>
  </table>
</body>
</html>`
}

function passwordResetHtml(params: { name: string; resetLink: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:32px 16px">
  <table align="center" width="100%" style="max-width:560px">
    <tr><td style="background:#fff;border-radius:12px;padding:32px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#111">Reset your password</h1>
      <p style="color:#555;line-height:1.6">Hi ${params.name},</p>
      <p style="color:#555;line-height:1.6">Click the button below to reset your password. This link expires in 15 minutes.</p>
      <p style="margin:24px 0;text-align:center">
        <a href="${params.resetLink}" style="display:inline-block;background:#00c853;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Reset password</a>
      </p>
      <p style="color:#888;font-size:13px">If you didn't request this, you can ignore this email.</p>
    </td></tr>
  </table>
</body>
</html>`
}

function welcomeHtml(params: { name: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:32px 16px">
  <table align="center" width="100%" style="max-width:560px">
    <tr><td style="background:#fff;border-radius:12px;padding:32px">
      <h1 style="font-size:20px;margin:0 0 16px;color:#111">Congratulations for signing up with SellSnap!</h1>
      <p style="color:#555;line-height:1.6">Hi ${params.name},</p>
      <p style="color:#555;line-height:1.6">Congratulations for signing up with SellSnap. You are now part of a community where selling is as simple as sharing a link.</p>
      <p style="margin-top:24px;text-align:center">
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#00c853;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Go to your dashboard</a>
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px">If you have any questions, just reply to this email.</p>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendOrderConfirmation(params: {
  buyerEmail: string
  buyerName: string | null
  productName: string
  quantity: number
  amount: string
  orderId: string
}) {
  const name = params.buyerName ?? 'there'
  return sendEmail({
    to: params.buyerEmail,
    subject: 'Thank you for purchasing with us.',
    html: orderConfirmationHtml({ ...params, buyerName: name }),
  })
}

export async function sendWelcomeEmail(params: {
  email: string
  name: string
}) {
  return sendEmail({
    to: params.email,
    subject: 'Congratulations for signing up with SellSnap!',
    html: welcomeHtml({ name: params.name }),
  })
}

export async function sendSellerNotification(params: {
  sellerEmail: string
  sellerName: string
  productName: string
  quantity: number
  amount: string
  buyerName: string | null
  buyerEmail: string
  buyerPhone: string | null
  orderId: string
}) {
  return sendEmail({
    to: params.sellerEmail,
    subject: 'New order received — SELL SNAP',
    html: sellerNotificationHtml(params),
  })
}

export async function sendPasswordReset(params: {
  email: string
  name: string
  resetLink: string
}) {
  return sendEmail({
    to: params.email,
    subject: 'Reset your password — SELL SNAP',
    html: passwordResetHtml({ name: params.name, resetLink: params.resetLink }),
  })
}
