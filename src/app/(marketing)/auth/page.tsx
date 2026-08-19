'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'signup';

function AuthForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push(mode === 'signup' ? '/onboarding' : '/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, mode, router]);

  const switchMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup');
    setStep(1);
    setError('');
    setFieldErrors({});
    setLoginErrors({});
    setForgotPassword(false);
    setForgotSent(false);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string } = {};

    if (!name) errors.name = 'Field cannot be empty';
    if (!email) errors.email = 'Field cannot be empty';

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const missing: string[] = [];
    if (password.length < 8) missing.push('minimum 8 characters');
    if (!/[A-Z]/.test(password)) missing.push('an uppercase letter');
    if (!/[a-z]/.test(password)) missing.push('a lowercase letter');
    if (!/[0-9]/.test(password)) missing.push('a number');

    if (missing.length > 0) {
      setError('Password must contain ' + missing.join(', '));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, businessName }),
      });
      const data = await res.json();
      
      if (!data.ok) {
        setError(data.error?.message || 'Failed to sign up');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setForgotSent(true);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors: { email?: string; password?: string } = {};

    if (!email) errors.email = 'Field cannot be empty';
    if (!password) errors.password = 'Field cannot be empty';

    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!data.ok) {
        setError(data.error?.message || 'Invalid email or password');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="flex flex-col min-h-screen items-center justify-center px-4 sm:px-6"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div
          className="max-w-md w-full text-center p-8 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div
            className="text-5xl mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            ✓
          </div>
          <h1
            className="mb-2"
            style={{
              fontSize: 'var(--text-headline-medium-font-size)',
              fontWeight: 'var(--text-headline-medium-font-weight)',
              lineHeight: 1.1,
              fontFamily: 'var(--text-headline-medium-font-family)',
              color: 'var(--color-on-surface)',
            }}
          >
            {mode === 'signup' ? 'Account Created!' : 'Welcome Back!'}
          </h1>
          <p
          className="mb-2"
            style={{
              fontSize: 'var(--text-body-medium-font-size)',
              fontWeight: 'var(--text-body-medium-font-weight)',
              lineHeight: 'var(--text-body-medium-line-height)',
              fontFamily: 'var(--text-body-medium-font-family)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
{mode === 'signup'
                ? `Welcome To SELL SNAP, ${name}. Let's Set Up Your Store.`
                : 'You Are Now Signed In.'}
          </p>
          <a
            href={mode === 'signup' ? '/onboarding' : '/dashboard'}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] transition-colors"
            style={{
              fontSize: 'var(--text-label-large-font-size)',
              fontWeight: 'var(--text-label-large-font-weight)',
              lineHeight: 'var(--text-label-large-line-height)',
              fontFamily: 'var(--text-label-large-font-family)',
              color: 'var(--color-on-primary)',
              textDecoration: 'none',
            }}
          >
            {mode === 'signup' ? 'Set Up Your Store' : 'Go To Dashboard'}
          </a>
        </div>
      </div>
    );
  }

  const isLogin = mode === 'login';

  return (
    <div
      className="flex flex-col min-h-screen px-4 sm:px-6"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <main className="flex flex-1 flex-col items-center justify-center py-12">
        <Link
          href="/"
          className="mb-0"
          style={{
            fontSize: 'var(--text-headline-medium-font-size)',
            fontWeight: 700,
            lineHeight: 'var(--text-headline-medium-line-height)',
            fontFamily: 'var(--text-headline-medium-font-family)',
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}
        >
          SELL SNAP
        </Link>
        {isLogin && error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg w-full max-w-md"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              color: 'color-mix(in srgb, var(--color-error) 70%, white)',
              fontSize: 'var(--text-body-small-font-size)',
              fontFamily: 'var(--text-body-small-font-family)',
            }}
          >
            {error}
          </div>
        )}
        <div
          className="max-w-md w-full px-8 pb-8 pt-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <h1
            className="mb-1 text-center"
            style={{
              fontSize: 'var(--text-headline-medium-font-size)',
              fontWeight: 'var(--text-headline-medium-font-weight)',
              lineHeight: 1.1,
              fontFamily: 'var(--text-headline-medium-font-family)',
              color: 'var(--color-on-surface)',
            }}
          >
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p
            className="mb-6 text-center"
            style={{
              fontSize: 'var(--text-body-medium-font-size)',
              fontWeight: 'var(--text-body-medium-font-weight)',
              lineHeight: 'var(--text-body-medium-line-height)',
              fontFamily: 'var(--text-body-medium-font-family)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
{isLogin
                ? 'Sign In To Manage Your Store.'
                : 'Start Selling With Just A Link Today.'}
          </p>

          {!isLogin && (
            <p
              className="mb-6 text-center"
              style={{
                fontSize: 'var(--text-label-small-font-size)',
                fontWeight: 'var(--text-label-small-font-weight)',
                lineHeight: 'var(--text-label-small-line-height)',
                fontFamily: 'var(--text-label-small-font-family)',
                color: 'var(--color-outline)',
              }}
            >
              Step {step} of 2
            </p>
          )}

           {isLogin && forgotPassword ? (
              forgotSent ? (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <p className="mb-2" style={{ color: 'var(--color-on-surface)', fontSize: 'var(--text-body-medium-font-size)', fontFamily: 'var(--text-body-medium-font-family)' }}>
                      Check Your Email
                    </p>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                      If an account exists for {email}, you will receive a password reset link shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(false); setForgotSent(false); setError(''); }}
                    className="bg-transparent border-none p-0 cursor-pointer text-center w-full"
                    style={{
                      color: 'var(--color-primary)',
                      fontSize: 'var(--text-body-small-font-size)',
                      fontFamily: 'var(--text-body-small-font-family)',
                    }}
                  >
                    Back To Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <p className="mb-2" style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                    Enter your email address and we will send you a link to reset your password.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="forgot-email"
                      style={{
                        fontSize: 'var(--text-label-medium-font-size)',
                        fontWeight: 'var(--text-label-medium-font-weight)',
                        lineHeight: 'var(--text-label-medium-line-height)',
                        fontFamily: 'var(--text-label-medium-font-family)',
                        color: 'var(--color-on-surface)',
                      }}
                    >
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                      style={{
                        backgroundColor: 'var(--color-surface-container-low)',
                        borderBottomWidth: 2,
                        color: 'var(--color-on-surface)',
                        fontSize: 'var(--text-body-medium-font-size)',
                        fontFamily: 'var(--text-body-medium-font-family)',
                        caretColor: 'var(--color-primary)',
                      }}
                      placeholder="john@example.com"
                    />
                  </div>
                  {error && (
                    <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] transition-colors"
                    style={{
                      fontSize: 'var(--text-label-large-font-size)',
                      fontWeight: 'var(--text-label-large-font-weight)',
                      lineHeight: 'var(--text-label-large-line-height)',
                      fontFamily: 'var(--text-label-large-font-family)',
                      color: 'var(--color-on-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(false); setError(''); }}
                    className="bg-transparent border-none p-0 cursor-pointer text-center w-full"
                    style={{
                      color: 'var(--color-on-surface-variant)',
                      fontSize: 'var(--text-body-small-font-size)',
                      fontFamily: 'var(--text-body-small-font-family)',
                    }}
                  >
                    Back To Login
                  </button>
                </form>
              )
            ) : isLogin ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-email"
                  style={{
                    fontSize: 'var(--text-label-medium-font-size)',
                    fontWeight: 'var(--text-label-medium-font-weight)',
                    lineHeight: 'var(--text-label-medium-line-height)',
                    fontFamily: 'var(--text-label-medium-font-family)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginErrors((prev) => ({ ...prev, email: undefined })); }}
                   onFocus={() => setError('')}
                   className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                   style={{
                     backgroundColor: 'var(--color-surface-container-low)',
                     borderBottomWidth: 2,
                     color: 'var(--color-on-surface)',
                     fontSize: 'var(--text-body-medium-font-size)',
                     fontFamily: 'var(--text-body-medium-font-family)',
                     caretColor: 'var(--color-primary)',
                   }}
                   placeholder="john@example.com"
                 />
                 {loginErrors.email && (
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                    {loginErrors.email}
                  </p>
                )}
              </div>

               <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      style={{
                        fontSize: 'var(--text-label-medium-font-size)',
                        fontWeight: 'var(--text-label-medium-font-weight)',
                        lineHeight: 'var(--text-label-medium-line-height)',
                        fontFamily: 'var(--text-label-medium-font-family)',
                        color: 'var(--color-on-surface)',
                      }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); setError(''); }}
                      className="bg-transparent border-none p-0 cursor-pointer"
                      style={{
                        fontSize: 'var(--text-body-small-font-size)',
                        fontFamily: 'var(--text-body-small-font-family)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                 <div className="relative">
                   <input
                     id="login-password"
                     type={showLoginPassword ? 'text' : 'password'}
                     value={password}
                     onChange={(e) => { setPassword(e.target.value); setLoginErrors((prev) => ({ ...prev, password: undefined })); }}
                     onFocus={() => setError('')}
                     className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                     style={{
                       backgroundColor: 'var(--color-surface-container-low)',
                       borderBottomWidth: 2,
                       color: 'var(--color-on-surface)',
                       fontSize: 'var(--text-body-medium-font-size)',
                       fontFamily: 'var(--text-body-medium-font-family)',
                       caretColor: 'var(--color-primary)',
                       paddingRight: '28px',
                     }}
                     placeholder="Enter Your Password"
                   />
                   {password.length > 0 && (
                     <button
                       type="button"
                       onClick={() => setShowLoginPassword((v) => !v)}
                       className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                       style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                       tabIndex={-1}
                     >
                       {showLoginPassword ? (
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                           <line x1="1" y1="1" x2="23" y2="23"/>
                         </svg>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                           <circle cx="12" cy="12" r="3"/>
                         </svg>
                       )}
                     </button>
                   )}
                 </div>
                 {loginErrors.password && (
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                    {loginErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-lg w-full transition-colors"
                style={{
                  backgroundColor: isLoading ? 'var(--color-surface-variant)' : 'var(--color-primary)',
                  fontSize: 'var(--text-label-large-font-size)',
                  fontWeight: 'var(--text-label-large-font-weight)',
                  lineHeight: 'var(--text-label-large-line-height)',
                  fontFamily: 'var(--text-label-large-font-family)',
                  color: isLoading ? 'var(--color-on-surface-variant)' : 'var(--color-on-primary)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : step === 1 ? (
            <form onSubmit={handleNextStep} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-name"
                  style={{
                    fontSize: 'var(--text-label-medium-font-size)',
                    fontWeight: 'var(--text-label-medium-font-weight)',
                    lineHeight: 'var(--text-label-medium-line-height)',
                    fontFamily: 'var(--text-label-medium-font-family)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  Enter Full Name
                </label>
                <input
                  id="signup-name"
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
                  onBlur={(e) => {
                    setNameBlurred(true);
                    if (!name) setFieldErrors((prev) => ({ ...prev, name: 'This field cannot be empty' }));
                  }}
                   className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                  style={{
                    backgroundColor: nameBlurred ? 'var(--color-inverse-on-surface)' : 'var(--color-surface-container-low)',
                    borderBottomWidth: 2,
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--text-body-medium-font-size)',
                    fontFamily: 'var(--text-body-medium-font-family)',
                    caretColor: 'var(--color-primary)',
                  }}
                  placeholder="John Doe"
                />
                {fieldErrors.name && (
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-email"
                  style={{
                    fontSize: 'var(--text-label-medium-font-size)',
                    fontWeight: 'var(--text-label-medium-font-weight)',
                    lineHeight: 'var(--text-label-medium-line-height)',
                    fontFamily: 'var(--text-label-medium-font-family)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  Enter Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                      setFieldErrors((prev) => ({ ...prev, email: 'Enter a valid email address' }));
                    } else {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  onBlur={() => { setEmailBlurred(true); if (!email) setFieldErrors((prev) => ({ ...prev, email: 'This field cannot be empty' })); }}
                   className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                   style={{
                     backgroundColor: emailBlurred ? 'var(--color-inverse-on-surface)' : 'var(--color-surface-container-low)',
                    borderBottomWidth: 2,
                    color: 'var(--color-on-surface)',
                    fontSize: 'var(--text-body-medium-font-size)',
                    fontFamily: 'var(--text-body-medium-font-family)',
                    caretColor: 'var(--color-primary)',
                  }}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && (
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] transition-colors sm:gap-2"
                  style={{
                    fontSize: 'var(--text-label-large-font-size)',
                    fontWeight: 'var(--text-label-large-font-weight)',
                    lineHeight: 'var(--text-label-large-line-height)',
                    fontFamily: 'var(--text-label-large-font-family)',
                    color: 'var(--color-on-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-business"
                  style={{
                    fontSize: 'var(--text-label-medium-font-size)',
                    fontWeight: 'var(--text-label-medium-font-weight)',
                    lineHeight: 'var(--text-label-medium-line-height)',
                    fontFamily: 'var(--text-label-medium-font-family)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  Business Name
                </label>
                <input
                  id="signup-business"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                   className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                   style={{
                     backgroundColor: 'var(--color-surface-container-low)',
                     borderBottomWidth: 2,
                     color: 'var(--color-on-surface)',
                     fontSize: 'var(--text-body-medium-font-size)',
                     fontFamily: 'var(--text-body-medium-font-family)',
                     caretColor: 'var(--color-primary)',
                   }}
                   placeholder="My Store"
                 />
               </div>

               <div className="flex flex-col gap-1.5">
                 <label
                   htmlFor="signup-password"
                   style={{
                     fontSize: 'var(--text-label-medium-font-size)',
                     fontWeight: 'var(--text-label-medium-font-weight)',
                     lineHeight: 'var(--text-label-medium-line-height)',
                     fontFamily: 'var(--text-label-medium-font-family)',
                     color: 'var(--color-on-surface)',
                   }}
                 >
                   Password
                 </label>
                   <div className="relative">
                     <input
                       id="signup-password"
                       type={showSignupPassword ? 'text' : 'password'}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                       style={{
                         backgroundColor: 'var(--color-surface-container-low)',
                         borderBottomWidth: 2,
                         color: 'var(--color-on-surface)',
                         fontSize: 'var(--text-body-medium-font-size)',
                         fontFamily: 'var(--text-body-medium-font-family)',
                         caretColor: 'var(--color-primary)',
                         paddingRight: '28px',
                       }}
                       placeholder="At Least 8 Characters"
                     />
                     {password.length > 0 && (
                       <button
                         type="button"
                         onClick={() => setShowSignupPassword((v) => !v)}
                         className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                         style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                         tabIndex={-1}
                       >
                         {showSignupPassword ? (
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                             <line x1="1" y1="1" x2="23" y2="23"/>
                           </svg>
                         ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                             <circle cx="12" cy="12" r="3"/>
                           </svg>
                         )}
                       </button>
                     )}
                   </div>
                  {(() => {
                    const reqs = [
                      { met: /[A-Z]/.test(password), text: 'Must contain one uppercase letter' },
                      { met: password.length >= 8, text: 'Must contain at least 8 characters' },
                      { met: /[a-z]/.test(password), text: 'Must contain one lowercase letter' },
                      { met: /[0-9]/.test(password), text: 'Must contain one number' },
                    ];
                    const next = reqs.find(r => !r.met);
                    return next && password.length > 0 ? (
                      <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-body-small-font-size)', fontFamily: 'var(--text-body-small-font-family)' }}>
                        {next.text}
                      </p>
                    ) : null;
                  })()}
                </div>

               <div className="flex flex-col gap-1.5">
                 <label
                   htmlFor="signup-confirm-password"
                   style={{
                     fontSize: 'var(--text-label-medium-font-size)',
                     fontWeight: 'var(--text-label-medium-font-weight)',
                     lineHeight: 'var(--text-label-medium-line-height)',
                     fontFamily: 'var(--text-label-medium-font-family)',
                     color: 'var(--color-on-surface)',
                   }}
                 >
                   Confirm Password
                 </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="px-3 py-2 rounded-lg w-full outline-none border-0 border-b border-[var(--color-outline-variant)] focus:placeholder-green-400"
                      style={{
                        backgroundColor: 'var(--color-surface-container-low)',
                        borderBottomWidth: 2,
                        color: 'var(--color-on-surface)',
                        fontSize: 'var(--text-body-medium-font-size)',
                        fontFamily: 'var(--text-body-medium-font-family)',
                        caretColor: 'var(--color-primary)',
                        paddingRight: '28px',
                      }}
                      placeholder="Repeat Your Password"
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer"
                        style={{ color: 'var(--color-on-surface-variant)', lineHeight: 0 }}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
              </div>

              {error && (
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-lg w-full transition-colors"
                style={{
                  backgroundColor: isLoading ? 'var(--color-surface-variant)' : 'var(--color-primary)',
                  fontSize: 'var(--text-label-large-font-size)',
                  fontWeight: 'var(--text-label-large-font-weight)',
                  lineHeight: 'var(--text-label-large-line-height)',
                  fontFamily: 'var(--text-label-large-font-family)',
                  color: isLoading ? 'var(--color-on-surface-variant)' : 'var(--color-on-primary)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="bg-transparent border-none p-0 cursor-pointer text-center w-full"
                style={{
                  color: 'var(--color-on-surface-variant)',
                  fontSize: 'var(--text-body-small-font-size)',
                  fontFamily: 'var(--text-body-small-font-family)',
                }}
              >
                Back
              </button>
            </form>
          )}

          <p
            className="mt-6 text-center"
            style={{
              fontSize: 'var(--text-body-small-font-size)',
              fontWeight: 'var(--text-body-small-font-weight)',
              lineHeight: 'var(--text-body-small-line-height)',
              fontFamily: 'var(--text-body-small-font-family)',
              color: 'var(--color-on-surface-variant)',
            }}
          >
            <button
              type="button"
              onClick={switchMode}
              className="bg-transparent border-none p-0 cursor-pointer"
              style={{
                color: 'var(--color-primary)',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                lineHeight: 'inherit',
                fontWeight: 'inherit',
              }}
            >
              {isLogin
                ? "Don't Have An Account? Sign Up"
                : 'Already Have An Account? Log In'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
