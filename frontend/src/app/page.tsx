'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Warning } from '@phosphor-icons/react';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { BlurFade } from '@/components/magicui/blur-fade';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot reach API. Check NEXT_PUBLIC_API_URL and backend status.');
      } else if (err.response.status >= 500) {
        setError('Server error. Check Render DATABASE_URL (Supabase pooler + encoded password).');
      } else {
        setError(err.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] bg-[rgb(var(--background))] lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between border-r border-slate-800 bg-[rgb(var(--surface))] p-12 lg:flex">
        <img
          src="/logo-hsc.png?v=2"
          alt="HSC"
          className="h-8 w-auto self-start [filter:brightness(0)_invert(1)]"
        />

        <div className="max-w-md">
          <BlurFade delay={0.1}>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-50">
              Turn specs into test strategies, cases, and bug reports.
            </h1>
          </BlurFade>
          <BlurFade delay={0.25}>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              An AI-assisted QC workflow with a human in the loop. Drafts are
              generated, your team approves, every step stays traceable.
            </p>
          </BlurFade>
        </div>

        <AnimatedShinyText className="text-sm">Internal QC tooling</AnimatedShinyText>
      </div>

      {/* Right: sign-in form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <img
              src="/logo-hsc.png?v=2"
              alt="HSC"
              className="h-8 w-auto [filter:brightness(0)_invert(1)]"
            />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Welcome back. Enter your credentials to continue.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3">
                <Warning size={18} weight="fill" className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="field-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
