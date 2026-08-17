"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Not authenticated, redirect to sign in
        router.push("/sign-in");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [router]);

  async function handleSetPassword(e: React.FormEvent) {
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
      // Mark that user has set a password in metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            has_password: true,
            password_set_at: new Date().toISOString(),
          },
        });
      }

      setSuccess(true);
      setLoading(false);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Checking authentication...</p>
          </CardContent>
        </Card>
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Password set successfully!</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Your password has been set. You can now sign in with your email and password. Redirecting you to the dashboard...
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
            <CardTitle className="text-2xl sm:text-3xl font-bold">Set Your Password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Create a password to sign in quickly without magic links. You can skip this and set it up later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4" aria-label="Set password form">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min. 8 characters)"
                    className="h-11 sm:h-12 text-base pr-10"
                    aria-label="Password"
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
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="h-11 sm:h-12 text-base pr-10"
                    aria-label="Confirm password"
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

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 h-11 sm:h-12 text-base"
                  disabled={loading || !password || !confirmPassword}
                  aria-label="Set password"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Setting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                      Set Password
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="h-11 sm:h-12 text-base"
                  disabled={loading}
                >
                  Skip for Now
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                You can always set or change your password later in{" "}
                <Link 
                  href="/settings" 
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Settings
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

