"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useRef } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { getClientServices } from "@/lib/services/client"
import { isDemoMode } from "@/lib/app-mode"
import { getDemoCounts, getDemoState, subscribeDemoState } from "@/lib/services/demo/state"
import { User, Camera, Edit2, Save, X, Mail, Calendar, MapPin, Globe, BookOpen, Mic, Trophy, TrendingUp } from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  email?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  created_at?: string
  available_credits?: number
  total_credits?: number
}

interface ProfileStats {
  storiesCount: number
  voicesCount: number
  questsCount: number
  totalPlays: number
}

interface CreditTransaction {
  amount: number
  source: string
  date: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<ProfileStats>({
    storiesCount: 0,
    voicesCount: 0,
    questsCount: 0,
    totalPlays: 0,
  })
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isDemoMode()) {
      const syncDemoProfile = () => {
        const state = getDemoState()
        const counts = getDemoCounts()
        const profileData: UserProfile = {
          ...state.profile,
          avatar_url: state.profile.avatar_url || undefined,
          email: "demo@fabletogether.com",
          available_credits: state.credits.available,
          total_credits: state.credits.total,
        }
        setUser(profileData)
        setDisplayName(state.profile.display_name || "Fable Explorer")
        setBio(state.profile.bio || "")
        setLocation(state.profile.location || "")
        setWebsite(state.profile.website || "")
        setPhone(state.profile.phone || "")
        setAvatarUrl(state.profile.avatar_url || null)
        setStats({
          storiesCount: counts.stories,
          voicesCount: counts.voices,
          questsCount: state.quests.length,
          totalPlays: 0,
        })
        setCreditTransactions([
          { amount: 150, source: "Demo balance", date: state.profile.created_at || "2025-12-08T12:00:00.000Z" },
          ...state.quests
            .filter((quest) => quest.status === "completed")
            .map((quest) => ({ amount: quest.credits_reward, source: quest.title, date: quest.completed_at || state.profile.created_at || "2025-12-08T12:00:00.000Z" })),
        ])
        setLoading(false)
      }
      syncDemoProfile()
      return subscribeDemoState(syncDemoProfile)
    }

    async function fetchUserData() {
      try {
        const services = getClientServices()
        const authUser = await services.auth.getCurrentUser()
        
        if (!authUser) {
          // No authenticated user - silent fail for better UX
          setLoading(false)
          return
        }

        const profile = await services.profiles.getProfile(authUser.id)

        // Get display name with proper fallback
        const getDisplayName = () => {
          if (profile?.display_name) return profile.display_name
          if (authUser.user_metadata?.first_name) {
            return authUser.user_metadata.first_name
          }
          if (authUser.user_metadata?.first_name && authUser.user_metadata?.last_name) {
            return `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
          }
          return authUser.email?.split('@')[0] || 'User'
        }

        const displayName = getDisplayName()
        const profileData: UserProfile = {
          id: authUser.id,
          display_name: displayName,
          avatar_url: profile?.avatar_url || undefined,
          email: authUser.email || undefined,
          bio: profile?.bio || undefined,
          location: profile?.location || undefined,
          website: profile?.website || undefined,
          phone: profile?.phone || undefined,
          created_at: profile?.created_at || authUser.created_at,
          available_credits: profile?.available_credits || 0,
          total_credits: profile?.total_credits || 0,
        }

        setUser(profileData)
        setDisplayName(displayName)
        setBio(profile?.bio || "")
        setLocation(profile?.location || "")
        setWebsite(profile?.website || "")
        setPhone(profile?.phone || "")
        setAvatarUrl(profile?.avatar_url || null)

        // Fetch stats - get all visible stories and voices (including defaults)
        const [libraryCountsResponse, questsResponse, creditsResponse] = await Promise.all([
          fetch("/api/library/counts"),
          fetch("/api/quests/list"),
          fetch("/api/user/credits"),
        ])

        // Get library counts (includes example stories and preset voices)
        let storiesCount = 0
        let voicesCount = 0
        if (libraryCountsResponse.ok) {
          const libraryData = await libraryCountsResponse.json()
          storiesCount = libraryData.stories || 0
          voicesCount = libraryData.voices || 0
        }

        // Get quests count (all available/completed quests)
        let questsCount = 0
        if (questsResponse.ok) {
          const questsData = await questsResponse.json()
          const allQuests = questsData.quests || []
          // Count all quests that are available (not_started, in_progress, or completed)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questsCount = allQuests.filter((q: any) => 
            q.status === 'not_started' || q.status === 'in_progress' || q.status === 'completed'
          ).length
        }

        // Get credits and transactions from API
        let availableCredits = profile?.available_credits || 0
        let totalEarned = profile?.total_credits || 0
        let transactions: CreditTransaction[] = []
        
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          availableCredits = creditsData.available || 0
          totalEarned = creditsData.total || 0
          transactions = creditsData.transactions || []
        }

        setStats({
          storiesCount,
          voicesCount,
          questsCount,
          totalPlays: 0, // TODO: Add plays tracking
        })
        
        setCreditTransactions(transactions)

        // Update user with credits
        setUser({
          ...profileData,
          available_credits: availableCredits,
          total_credits: totalEarned,
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [toast])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!user || !fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setUploading(true)

    if (isDemoMode()) {
      setAvatarUrl(avatarPreview)
      setAvatarPreview(null)
      setUploading(false)
      toast({ title: "Demo profile image saved locally" })
      return
    }

    const supabase = createSupabaseBrowserClient()

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        // Extract the file path from the full URL
        const urlParts = avatarUrl.split('/')
        const fileNameIndex = urlParts.findIndex(part => part === 'avatars')
        if (fileNameIndex !== -1 && fileNameIndex < urlParts.length - 1) {
          const oldFilePath = urlParts.slice(fileNameIndex).join('/')
          await supabase.storage.from('avatars').remove([oldFilePath])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Avatar storage bucket not configured. Please create the "avatars" bucket in Supabase Storage.')
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setAvatarPreview(null)

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      })
    } catch (error: unknown) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)

    if (isDemoMode()) {
      try {
        const updated = await getClientServices().profiles.updateProfile(user.id, {
          display_name: displayName,
          bio: bio || null,
          avatar_url: avatarPreview || avatarUrl || null,
          location: location || null,
          website: website || null,
          phone: phone || null,
        })
        const demoState = getDemoState()
        setUser({
          ...user,
          ...updated,
          email: user.email,
          available_credits: demoState.credits.available,
          total_credits: demoState.credits.total,
        })
        setAvatarUrl(updated.avatar_url || null)
        setAvatarPreview(null)
        setIsEditing(false)
        toast({ title: "Demo profile saved", description: "Changes are stored only in this browser." })
      } catch (error) {
        toast({
          title: "Unable to save demo profile",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
      return
    }

    const supabase = createSupabaseBrowserClient()
    
    try {
      // Upload avatar if preview exists
      if (avatarPreview && fileInputRef.current?.files?.[0]) {
        await handleImageUpload()
      }

      // Build update object with only fields that exist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        display_name: displayName,
        updated_at: new Date().toISOString(),
      }

      // Only include fields if they have values or if we're clearing them
      if (bio !== undefined) updateData.bio = bio || null
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl || null
      
      // Try to include location, website, and phone, but handle gracefully if columns don't exist
      // We'll check for errors and handle them
      if (location !== undefined) updateData.location = location || null
      if (website !== undefined) updateData.website = website || null
      if (phone !== undefined) updateData.phone = phone || null

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        // If error is about missing columns, try updating without them
        const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : '';
        if (errorMessage?.includes('location') || errorMessage?.includes('website') || errorMessage?.includes('column')) {
          const { error: retryError } = await supabase
            .from('profiles')
            .update({
              display_name: displayName,
              bio: bio || null,
              avatar_url: avatarUrl || null,
              location: location || null,
              website: website || null,
              phone: phone || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
          
          if (retryError) {
            throw retryError
          }
          
          // Update user state with saved fields only
          const updatedUser = { 
            ...user, 
            display_name: displayName, 
            bio: bio || undefined, 
            avatar_url: avatarUrl || undefined 
          }
          setUser(updatedUser)
          setIsEditing(false)
          setAvatarPreview(null)
          
          // Trigger a custom event to refresh the header avatar
          window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUser }))
          
          // Success - location/website columns don't exist yet, but other fields saved
          toast({
            title: "Profile updated (partial)",
            description: "Profile saved, but location and website couldn't be saved. Please run the database migration to add these columns.",
            variant: "default",
          })
          return // Exit early since we handled the error
        } else {
          throw error
        }
      }

      // Update user state with new data
      const updatedUser = { 
        ...user, 
        display_name: displayName, 
        bio: bio || undefined, 
        location: location || undefined,
        website: website || undefined,
        phone: phone || undefined,
        avatar_url: avatarUrl || undefined 
      }
      setUser(updatedUser)
      setIsEditing(false)
      setAvatarPreview(null)
      
      // Trigger a custom event to refresh the header avatar
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedUser }))
      
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

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.display_name)
      setBio(user.bio || "")
      setLocation(user.location || "")
      setWebsite(user.website || "")
      setPhone(user.phone || "")
      setAvatarUrl(user.avatar_url || null)
    }
    setAvatarPreview(null)
    setIsEditing(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main id="main-content" className="flex-1 overflow-y-auto flex items-center justify-center" role="main" tabIndex={-1}>
            <p className="text-muted-foreground">Loading profile...</p>
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
                <p className="text-muted-foreground">Please sign in to view your profile</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  const currentAvatarUrl = avatarPreview || avatarUrl

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto bg-background dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-full px-4 sm:max-w-4xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Account
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Profile
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Manage your personal information and preferences
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <Card>
                  <CardContent className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-start gap-6 mb-6 pb-6 border-b">
                      <div className="relative group">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={currentAvatarUrl || undefined} alt={displayName} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-colors"
                              disabled={uploading}
                            >
                              {uploading ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="text-2xl font-bold mb-2"
                            placeholder="Example: John Smith or Sarah"
                          />
                        ) : (
                          <h2 className="text-2xl font-bold mb-2">{displayName || "Example: John Smith or Sarah"}</h2>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        {user.created_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {formatDate(user.created_at)}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button onClick={handleCancel} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving || uploading} size="sm">
                              {saving ? (
                                <>
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => setIsEditing(true)} size="sm">
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="bio" className="text-base font-semibold mb-2 block">
                          Bio
                        </Label>
                        {isEditing ? (
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="Example: I'm a parent who loves creating bedtime stories for my kids. I enjoy using AI to bring characters to life and make storytelling interactive and fun!"
                            maxLength={500}
                          />
                        ) : (
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {bio || "Example: I'm a parent who loves creating bedtime stories for my kids. I enjoy using AI to bring characters to life and make storytelling interactive and fun!"}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="location" className="text-base font-semibold mb-2 block">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Location
                          </Label>
                          {isEditing ? (
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Example: San Francisco, CA or London, UK"
                            />
                          ) : (
                            <p className="text-muted-foreground">{location || "Example: San Francisco, CA or London, UK"}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="website" className="text-base font-semibold mb-2 block">
                            <Globe className="h-4 w-4 inline mr-1" />
                            Website
                          </Label>
                          {isEditing ? (
                            <Input
                              id="website"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="Example: https://yourwebsite.com or https://twitter.com/yourhandle"
                              type="url"
                            />
                          ) : (
                            <p className="text-muted-foreground">
                              {website ? (
                                <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {website}
                                </a>
                              ) : (
                                "Example: https://yourwebsite.com or https://twitter.com/yourhandle"
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                            <User className="h-4 w-4 inline mr-1" />
                            Contact Info
                          </Label>
                          {isEditing ? (
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Example: +1 (555) 123-4567 or yourname@email.com"
                              type="tel"
                            />
                          ) : (
                            <p className="text-muted-foreground">{phone || "Example: +1 (555) 123-4567 or yourname@email.com"}</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-base font-semibold mb-2 block">Email</Label>
                        <p className="text-muted-foreground">{user.email || "Example: yourname@example.com"}</p>
                        <p className="text-sm text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Stats & Info */}
              <div className="space-y-6">
                {/* Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Your activity on the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Stories</span>
                      </div>
                      <span className="text-lg font-bold">
                        <AnimatedCounter value={stats.storiesCount} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Mic className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Voices</span>
                      </div>
                      <span className="text-lg font-bold">
                        <AnimatedCounter value={stats.voicesCount} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Quests</span>
                      </div>
                      <span className="text-lg font-bold">
                        <AnimatedCounter value={stats.questsCount} />
                      </span>
                    </div>
                    {stats.totalPlays > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Total Plays</span>
                        </div>
                        <span className="text-lg font-bold">
                          <AnimatedCounter value={stats.totalPlays} />
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Credits Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Credits</CardTitle>
                    <CardDescription>Your token balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Available Credits */}
                      <div className="flex items-center justify-between pb-3 border-b">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-2xl font-bold text-primary">
                          <AnimatedCounter value={user.available_credits || 0} />
                        </span>
                      </div>
                      
                      {/* Transaction List */}
                      {creditTransactions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Earned From
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {creditTransactions.map((transaction, index) => (
                              <div key={index} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30">
                                <span className="text-muted-foreground truncate flex-1 mr-2">
                                  {transaction.source}
                                </span>
                                <span className="font-semibold text-primary flex-shrink-0">
                                  +{transaction.amount}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Total Earned */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm font-semibold">Total Earned</span>
                        <span className="text-lg font-bold">
                          <AnimatedCounter value={user.total_credits || 0} />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Member Since</div>
                      <div className="font-medium">{formatDate(user.created_at)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
