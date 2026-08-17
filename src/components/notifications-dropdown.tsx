"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

interface Notification {
  id: string
  type: 'quest_completed' | 'story_generated' | 'voice_cloned' | 'credits_earned' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Fetch notifications from API and sync with localStorage read status
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        const fetchedNotifications = data.notifications || []
        
        // Get read notifications from localStorage to persist read status
        const readNotifications = JSON.parse(
          localStorage.getItem('read_notifications') || '[]'
        ) as string[]
        
        // Mark notifications as read if they're in localStorage
        const notificationsWithReadStatus = fetchedNotifications.map((n: Notification) => ({
          ...n,
          read: readNotifications.includes(n.id)
        }))
        
        setNotifications(notificationsWithReadStatus)
        const unread = notificationsWithReadStatus.filter((n: Notification) => !n.read).length
        setUnreadCount(unread)
      } else {
        // Handle non-OK responses gracefully
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      // Network errors or other fetch failures - set defaults
      setNotifications([])
      setUnreadCount(0)
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching notifications:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId: string) => {
    // Update local state immediately for better UX
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    // Store read status in localStorage
    const readNotifications = JSON.parse(
      localStorage.getItem('read_notifications') || '[]'
    ) as string[]
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId)
      localStorage.setItem('read_notifications', JSON.stringify(readNotifications))
    }
    
    // Call API to mark as read (for future database implementation)
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
    } catch (error) {
      // Silently fail - local state is already updated
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    
    // Store all as read in localStorage
    localStorage.setItem('read_notifications', JSON.stringify(allIds))
    
    // Call API to mark all as read
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
    } catch (error) {
      // Silently fail - local state is already updated
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'quest_completed':
        return '🎯'
      case 'story_generated':
        return '📖'
      case 'voice_cloned':
        return '🎤'
      case 'credits_earned':
        return '⭐'
      default:
        return '🔔'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative icon-button h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          aria-describedby={unreadCount > 0 ? "notification-count" : undefined}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge 
              id="notification-count"
              className="absolute -right-0.5 -top-0.5 sm:-right-1 sm:-top-1 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 rounded-full p-0 text-xs sm:text-sm bg-accent-warm flex items-center justify-center"
              aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => {
                const content = (
                  <div className="flex items-start gap-3 px-2 py-2 hover:bg-muted/50 rounded-sm">
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            aria-label={`Mark notification as read: ${notification.title}`}
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )

                if (notification.link) {
                  return (
                    <Link key={notification.id} href={notification.link} onClick={() => setOpen(false)}>
                      <DropdownMenuItem className="p-0 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                        {content}
                      </DropdownMenuItem>
                    </Link>
                  )
                }

                return (
                  <DropdownMenuItem key={notification.id} className="p-0" onSelect={(e) => e.preventDefault()}>
                    {content}
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

