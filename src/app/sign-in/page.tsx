"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remember me preference from localStorage on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe");
    if (savedRememberMe === "true") {
      setRememberMe(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Save remember me preference to localStorage
    localStorage.setItem("rememberMe", rememberMe.toString());
    
    const supabase = createSupabaseBrowserClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectPath = redirect ? `?next=${encodeURIComponent(redirect)}` : "";
    
    if (usePassword && password) {
      // Try password authentication first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        // If password auth fails, check if it's because user doesn't have a password
        // or if it's an invalid password
        if (signInError.message.includes("Invalid login credentials") || 
            signInError.message.includes("Email not confirmed")) {
          setError("Invalid email or password. Please try again or use magic link.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }
      
      // Password login successful - redirect to dashboard
      if (data.session) {
        const redirectTo = redirect || "/dashboard";
        router.push(redirectTo);
        return;
      }
    } else {
      // Use magic link authentication
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback${redirectPath}`,
        },
      });
      
      if (signInError) {
        setError(signInError.message);
      } else {
        setSent(true);
      }
    }
    
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-warm-gradient flex flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6 pb-2 sm:pb-3" role="banner">
          <div className="max-w-7xl mx-auto">
            <Link 
              href="/" 
              className="flex items-center gap-3 w-fit group"
              aria-label="Fable Together - Home"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-primary">Fable Together</span>
                <Badge 
                  variant="outline" 
                  className="bg-orange-500/10 text-orange-600 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50 font-semibold text-xs"
                  aria-label="Beta version"
                >
                  BETA
                </Badge>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main" tabIndex={-1}>
          <Card className="max-w-md w-full card-elevated">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 micro-bounce">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Check your email</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                We sent you a magic sign-in link at <strong className="text-foreground">{email}</strong>. Click the link in your email to access your dashboard.
              </p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                  aria-label="Try a different email address"
                >
                  Use a different email
                </Button>
                <p className="text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gradient flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 pb-2 sm:pb-3" role="banner">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/" 
            className="flex items-center gap-3 w-fit group"
            aria-label="Fable Together - Home"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-primary">Fable Together</span>
              <Badge 
                variant="outline" 
                className="bg-orange-500/10 text-orange-600 border-orange-500/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50 font-semibold text-xs"
                aria-label="Beta version"
              >
                BETA
              </Badge>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main">
        <Card className="max-w-md w-full card-elevated">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Sign in</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {usePassword 
                ? "Enter your email and password to sign in"
                : "Enter your email address and we'll send you a secure magic link to sign in instantly."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" aria-label="Sign in form">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 sm:h-12 text-base"
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "email-error" : undefined}
                  disabled={loading}
                />
              </div>

              {usePassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      href="/auth/reset-password"
                      className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required={usePassword}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-11 sm:h-12 text-base pr-10"
                      aria-label="Password"
                      aria-required={usePassword ? "true" : "false"}
                      aria-invalid={error ? "true" : "false"}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p 
                  className="text-sm text-destructive" 
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              {/* Remember Me Checkbox */}
              {usePassword && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                    aria-label="Remember me for automatic login"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 sm:h-12 text-base"
                disabled={loading || !email || (usePassword && !password)}
                aria-label={usePassword ? "Sign in with password" : "Send magic link"}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    {usePassword ? "Signing in..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {usePassword ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                        Sign in
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                        Send Magic Link
                      </>
                    )}
                  </>
                )}
              </Button>

              {/* Toggle between password and magic link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUsePassword(!usePassword);
                    setPassword("");
                    setError(null);
                  }}
                  className="text-xs sm:text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {usePassword 
                    ? "Use magic link instead" 
                    : "Sign in with password instead"}
                </button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/auth/landing" 
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  );
}
