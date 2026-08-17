"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Lock, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid session (came from password reset email link)
    const supabase = createSupabaseBrowserClient();
    
    // Check URL for hash fragment (Supabase sometimes uses hash fragments for recovery)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    // Also check search params
    const urlType = searchParams.get('type');
    
    if (type === 'recovery' || urlType === 'recovery' || accessToken) {
      setIsResetting(true);
      setCheckingSession(false);
      return;
    }
    
    // Check for session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Error checking session:", error);
        }
        
        if (session) {
          // User has a valid session from the reset link
          setIsResetting(true);
        }
        setCheckingSession(false);
      })
      .catch((error) => {
        console.error("Error in session check:", error);
        setCheckingSession(false);
      });
  }, [searchParams]);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000)
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });

      interface ResetResult {
        error?: { message?: string } | null
      }
      
      const result = await Promise.race([resetPromise, timeoutPromise]) as ResetResult;
      const resetError = result?.error;

      if (resetError) {
        console.error("Password reset error:", resetError);
        setError(resetError.message || "Failed to send reset email. Please try again.");
      } else {
        // Success - email sent (Supabase always returns success even if email doesn't exist for security)
        setSent(true);
      }
    } catch (err) {
      console.error("Password reset request error:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-warm-gradient flex flex-col">
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

        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main" tabIndex={-1}>
          <Card className="max-w-md w-full card-elevated">
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (sent && !isResetting) {
    return (
      <div className="min-h-screen bg-warm-gradient flex flex-col">
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

        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main" tabIndex={-1}>
          <Card className="max-w-md w-full card-elevated">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 micro-bounce">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Check your email</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link in your email to reset your password.
              </p>
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
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-warm-gradient flex flex-col">
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

        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main" tabIndex={-1}>
          <Card className="max-w-md w-full card-elevated">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 micro-bounce">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Password reset successful!</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Your password has been updated. Redirecting you to the dashboard...
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gradient flex flex-col">
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

        <main id="main-content" className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12" role="main" tabIndex={-1}>
        <Card className="max-w-md w-full card-elevated">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {isResetting ? "Reset your password" : "Forgot your password?"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {isResetting 
                ? "Enter your new password below"
                : "Enter your email address and we'll send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetting ? (
              <form onSubmit={handleResetPassword} className="space-y-4" aria-label="Reset password form">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
                      className="h-11 sm:h-12 text-base pr-10"
                      aria-label="New password"
                      aria-required="true"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-11 sm:h-12 text-base pr-10"
                      aria-label="Confirm new password"
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p 
                    className="text-sm text-destructive" 
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-base"
                  disabled={loading || !password || !confirmPassword}
                  aria-label="Reset password"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4" aria-label="Request password reset form">
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
                  {error && (
                    <p 
                      id="email-error"
                      className="text-sm text-destructive" 
                      role="alert"
                      aria-live="polite"
                    >
                      {error}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-base"
                  disabled={loading || !email}
                  aria-label="Send password reset link"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link 
                  href="/sign-in" 
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

