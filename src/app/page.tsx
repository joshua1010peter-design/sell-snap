import Link from 'next/link';
import '../../tokens/design-tokens.css';

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div
      className="rounded-xl p-6 border"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <h3
        className="mb-2"
        style={{
          fontSize: 'var(--text-title-medium-font-size)',
          fontWeight: 'var(--text-title-medium-font-weight)',
          lineHeight: 'var(--text-title-medium-line-height)',
          letterSpacing: 'var(--text-title-medium-letter-spacing)',
          fontFamily: 'var(--text-title-medium-font-family)',
          color: 'var(--color-on-surface)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 'var(--text-body-medium-font-size)',
          fontWeight: 'var(--text-body-medium-font-weight)',
          lineHeight: 'var(--text-body-medium-line-height)',
          letterSpacing: 'var(--text-body-medium-letter-spacing)',
          fontFamily: 'var(--text-body-medium-font-family)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-title-medium-font-size)',
            fontWeight: 700,
            lineHeight: 'var(--text-title-medium-line-height)',
            fontFamily: 'var(--text-title-medium-font-family)',
            color: 'var(--color-primary)',
          }}
        >
          SELL SNAP
        </span>
        <nav className="flex gap-4">
          <Link
            href="/auth?mode=signup"
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] transition-colors"
            style={{
              fontSize: 'var(--text-label-large-font-size)',
              fontWeight: 'var(--text-label-large-font-weight)',
              lineHeight: 'var(--text-label-large-line-height)',
              fontFamily: 'var(--text-label-large-font-family)',
              color: 'var(--color-on-primary)',
            }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1
            className="mb-3"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 3rem)',
              fontWeight: 'var(--text-headline-large-font-weight)',
              lineHeight: 'var(--text-headline-large-line-height)',
              letterSpacing: 'var(--text-headline-large-letter-spacing)',
              fontFamily: 'var(--text-headline-large-font-family)',
              color: 'var(--color-on-background)',
            }}
          >
            Sell anything in seconds<br />
            <span style={{ color: 'var(--color-primary)' }}>using just a link</span>
          </h1>
          <p
            className="max-w-xl mx-auto mb-8"
            style={{
              fontSize: 'var(--text-body-large-font-size)',
              fontWeight: 'var(--text-body-large-font-weight)',
              lineHeight: 'var(--text-body-large-line-height)',
              letterSpacing: 'var(--text-body-large-letter-spacing)',
              fontFamily: 'var(--text-body-large-font-family)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            Sell instantly. Share anywhere.
          </p>
          <Link
            href="/auth?mode=login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] transition-colors"
            style={{
              fontSize: 'var(--text-label-large-font-size)',
              fontWeight: 'var(--text-label-large-font-weight)',
              lineHeight: 'var(--text-label-large-line-height)',
              fontFamily: 'var(--text-label-large-font-family)',
              color: 'var(--color-on-primary)',
            }}
          >
            Start Selling
          </Link>
        </div>

        <div className="grid gap-6 w-full max-w-4xl sm:grid-cols-3">
          <FeatureCard
            title="Share & Sell"
            description="Share your product page link anywhere — WhatsApp, Instagram, X. Buyers pay instantly."
          />
          <FeatureCard
            title="Flutterwave Payments"
            description="Accept card, bank transfer, and USSD payments from customers across Africa."
          />
          <FeatureCard
            title="Dashboard Control"
            description="Manage products, track orders, and handle payouts from one dashboard."
          />
        </div>
      </main>

      <footer
        className="py-6 px-6 text-center border-t"
        style={{
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface-variant)',
          fontSize: 'var(--text-body-small-font-size)',
          fontWeight: 'var(--text-body-small-font-weight)',
          lineHeight: 'var(--text-body-small-line-height)',
          fontFamily: 'var(--text-body-small-font-family)',
        }}
      >
        &copy; {new Date().getFullYear()} SELL SNAP. All rights reserved.
      </footer>
    </div>
  );
}
