"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SUPPORTED_LANGUAGES, getLanguageData, getLanguageFlag } from "@/lib/language-codes"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { getClientServices } from "@/lib/services/client"
import { isDemoMode } from "@/lib/app-mode"
import { resetDemoState } from "@/lib/services/demo/state"
import { useTheme } from "next-themes"
import { Loader2, Bell, Shield, Globe, Palette, Mail, Trash2, AlertTriangle, Lock, Eye, EyeOff } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserProfile {
  id: string
  display_name: string
  email?: string
  avatar_url?: string
}

interface NotificationSettings {
  community_updates: boolean
  new_stories: boolean
  family_activity: boolean
  quest_completions: boolean
  weekly_digest: boolean
}

interface PrivacySettings {
  public_profile: boolean
  show_activity: boolean
  allow_friend_requests: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { theme: currentTheme, setTheme: setThemeProvider } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [notifications, setNotifications] = useState<NotificationSettings>({
    community_updates: true,
    new_stories: true,
    family_activity: true,
    quest_completions: true,
    weekly_digest: false,
  })
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    public_profile: false,
    show_activity: true,
    allow_friend_requests: true,
  })
  const [theme, setTheme] = useState("system")
  const [language, setLanguage] = useState("en")
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Sync theme with provider
  useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme)
    }
  }, [currentTheme])

  useEffect(() => {
    async function fetchUserData() {
      try {
        const services = getClientServices()
        const authUser = await services.auth.getCurrentUser()
        
        if (!authUser) {
          setLoading(false)
          return
        }

        const profile = await services.profiles.getProfile(authUser.id)

        // Check if user has a password set
        // Users with password have encrypted_password in auth.users
        // We can't directly check this, but we can try to infer from auth factors
        // For now, we'll assume they might have a password and let them try to set/change it
        setHasPassword(null) // Unknown - will be determined when they try to change it

        if (profile) {
          setUser({
            id: authUser.id,
            display_name: profile.display_name || authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || undefined,
            avatar_url: profile.avatar_url || undefined,
          })
          setDisplayName(profile.display_name || authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User')
        } else {
          setUser({
            id: authUser.id,
            display_name: authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || undefined,
          })
          setDisplayName(authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User')
        }
        setEmail(authUser.email || "")

        // Load saved settings from localStorage (or could be from database)
        const savedNotifications = localStorage.getItem('notification_settings')
        if (savedNotifications) {
          try {
            setNotifications(JSON.parse(savedNotifications))
          } catch (e) {
            // Ignore parse errors
          }
        }

        const savedPrivacy = localStorage.getItem('privacy_settings')
        if (savedPrivacy) {
          try {
            setPrivacy(JSON.parse(savedPrivacy))
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Get theme from next-themes (it manages its own localStorage)
        if (currentTheme) {
          setTheme(currentTheme)
        } else {
          // Fallback to localStorage if theme provider hasn't loaded yet
          const savedTheme = localStorage.getItem('theme')
          if (savedTheme) {
            setTheme(savedTheme)
          }
        }

        const savedLanguage = localStorage.getItem('language')
        if (savedLanguage) {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [toast, currentTheme])

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)

    if (isDemoMode()) {
      try {
        await getClientServices().profiles.updateProfile(user.id, { display_name: displayName })
        setUser({ ...user, display_name: displayName })
        toast({ title: "Demo profile saved", description: "Changes are stored only in this browser." })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update demo profile",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
      return
    }

    const supabase = createSupabaseBrowserClient()
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      setUser({ ...user, display_name: displayName })
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications))
    toast({
      title: "Success",
      description: "Notification preferences saved",
    })
  }

  const handleSavePrivacy = () => {
    localStorage.setItem('privacy_settings', JSON.stringify(privacy))
    toast({
      title: "Success",
      description: "Privacy settings saved",
    })
  }

  // Save preferences - theme uses next-themes provider, language saved to localStorage
  const handleSavePreferences = () => {
    // Set theme using next-themes provider (it handles localStorage automatically)
    if (setThemeProvider) {
      setThemeProvider(theme)
    }
    localStorage.setItem('language', language)
    
    // Apply language to document for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
    
    toast({
      title: "Success",
      description: "Preferences saved",
    })
  }
  
  // Handle theme change - apply immediately for better user experience
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    // Apply immediately so user sees the change right away
    if (setThemeProvider) {
      setThemeProvider(newTheme)
    }
  }

  const handleDeleteAccount = async () => {
    if (isDemoMode()) {
      resetDemoState()
      setDisplayName("Fable Explorer")
      toast({ title: "Demo state reset", description: "Local profile changes, progress, credits, and Demo Voice metadata were reset." })
      return
    }
    // This would typically call an API endpoint to delete the account
    toast({
      title: "Account deletion requested",
      description: "This feature is not yet implemented. Please contact support.",
      variant: "destructive",
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader user={user} />
          <main id="main-content" className="flex-1 overflow-y-auto flex items-center justify-center" role="main" tabIndex={-1}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main id="main-content" className="flex-1 overflow-y-auto flex items-center justify-center" role="main" tabIndex={-1}>
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Please sign in to view settings</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Account
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Settings
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Manage your account and preferences
              </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              {/* Profile Settings */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed here. Contact support to change your email address.
                      </p>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Password & Security
                    </CardTitle>
                    <CardDescription>
                      {hasPassword === false 
                        ? "Set a password to sign in without magic links"
                        : "Change your password or set one if you don't have one yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasPassword !== false && (
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password (leave blank if setting first password)"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 8 characters)"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          setPasswordError(null)
                          
                          if (!newPassword || !confirmPassword) {
                            setPasswordError("Please fill in all password fields")
                            return
                          }

                          if (newPassword.length < 8) {
                            setPasswordError("Password must be at least 8 characters long")
                            return
                          }

                          if (newPassword !== confirmPassword) {
                            setPasswordError("Passwords do not match")
                            return
                          }

                          setPasswordSaving(true)
                          const supabase = createSupabaseBrowserClient()

                          // If user provided current password, verify it first
                          if (hasPassword !== false && currentPassword) {
                            const { error: verifyError } = await supabase.auth.signInWithPassword({
                              email: email,
                              password: currentPassword,
                            })

                            if (verifyError) {
                              setPasswordError("Current password is incorrect")
                              setPasswordSaving(false)
                              return
                            }
                          }

                          // Get current user to preserve metadata
                          const { data: { user: currentUser } } = await supabase.auth.getUser()

                          // Update password and metadata
                          const { error: updateError } = await supabase.auth.updateUser({
                            password: newPassword,
                            data: {
                              ...(currentUser?.user_metadata || {}),
                              has_password: true,
                              password_set_at: new Date().toISOString(),
                            },
                          })

                          if (updateError) {
                            setPasswordError(updateError.message)
                            setPasswordSaving(false)
                          } else {
                            toast({
                              title: "Password updated",
                              description: "Your password has been successfully updated.",
                            })
                            setCurrentPassword("")
                            setNewPassword("")
                            setConfirmPassword("")
                            setHasPassword(true)
                            setPasswordSaving(false)
                          }
                        }}
                        disabled={passwordSaving || isDemoMode()}
                      >
                        {passwordSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            {hasPassword === false ? "Set Password" : "Update Password"}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={isDemoMode()}
                        onClick={() => {
                          router.push("/auth/reset-password")
                        }}
                      >
                        Reset Password
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isDemoMode()
                        ? "Password management is disabled because Demo Mode does not use an account."
                        : "Having trouble? You can always use the magic link sign-in method or reset your password via email."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">{isDemoMode() ? "Reset Demo State" : "Danger Zone"}</CardTitle>
                    <CardDescription>{isDemoMode() ? "Restore the deterministic local demo baseline on this browser." : "Irreversible and destructive actions"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDemoMode() ? "Reset Demo State" : "Delete Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isDemoMode() ? "Reset this local demo?" : "Are you absolutely sure?"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isDemoMode() ? "This removes local demo preferences, quest progress, credits, and Demo Voice metadata. No production account or data is affected." : "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDemoMode() ? "Reset Demo" : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Community Updates</Label>
                        <p className="text-sm text-muted-foreground">Receive updates from community circles</p>
                      </div>
                      <Switch 
                        checked={notifications.community_updates}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, community_updates: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Stories</Label>
                        <p className="text-sm text-muted-foreground">Get notified about new story releases</p>
                      </div>
                      <Switch 
                        checked={notifications.new_stories}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, new_stories: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Family Activity</Label>
                        <p className="text-sm text-muted-foreground">Updates when family members interact</p>
                      </div>
                      <Switch 
                        checked={notifications.family_activity}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, family_activity: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Quest Completions</Label>
                        <p className="text-sm text-muted-foreground">Notifications when you complete quests</p>
                      </div>
                      <Switch 
                        checked={notifications.quest_completions}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, quest_completions: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Digest</Label>
                        <p className="text-sm text-muted-foreground">Receive a weekly summary of activity</p>
                      </div>
                      <Switch 
                        checked={notifications.weekly_digest}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, weekly_digest: checked })
                        }
                      />
                    </div>
                    <div className="pt-4">
                      <Button onClick={handleSaveNotifications}>
                        Save Notification Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>Control your privacy and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Public Profile</Label>
                        <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                      </div>
                      <Switch 
                        checked={privacy.public_profile}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, public_profile: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Activity</Label>
                        <p className="text-sm text-muted-foreground">Display your activity in community circles</p>
                      </div>
                      <Switch 
                        checked={privacy.show_activity}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, show_activity: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Friend Requests</Label>
                        <p className="text-sm text-muted-foreground">Let other users send you friend requests</p>
                      </div>
                      <Switch 
                        checked={privacy.allow_friend_requests}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, allow_friend_requests: checked })
                        }
                      />
                    </div>
                    <div className="pt-4">
                      <Button onClick={handleSavePrivacy}>
                        Save Privacy Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance & Language
                    </CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={theme} onValueChange={handleThemeChange}>
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Theme changes are applied immediately
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LANGUAGES.map((lang) => {
                            const langData = getLanguageData(lang)
                            const flag = getLanguageFlag(lang)
                            const name = langData?.name || lang
                            return (
                              <SelectItem key={lang} value={lang}>
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{flag}</span>
                                  <span>{name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-4">
                      <Button onClick={handleSavePreferences}>
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
