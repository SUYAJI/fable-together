import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Heart, MessageCircle, Share2, Send } from "lucide-react"

const posts = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "SJ",
    avatarColor: "bg-primary",
    time: "2 hours ago",
    content:
      'Just finished reading "The Brave Butterfly Astronaut" with my daughter. She loved the courage theme and asked if she could be an astronaut too! 🚀',
    likes: 12,
    comments: 5,
  },
  {
    id: 2,
    author: "Mike Rodriguez",
    avatar: "MR",
    avatarColor: "bg-blue-500",
    time: "4 hours ago",
    content:
      "Looking for story recommendations about family traditions. My son is curious about different cultures and how families celebrate.",
    likes: 8,
    comments: 3,
  },
]

const communityCircles = [
  {
    name: "Indigenous Stories Circle",
    description: "Sharing traditional stories and cultural wisdom",
    members: "1,200 members",
    color: "bg-orange-500",
    joined: true,
  },
  {
    name: "Family Traditions",
    description: "Stories that celebrate family bonds and traditions",
    members: "856 members",
    color: "bg-green-500",
    joined: false,
  },
  {
    name: "Multilingual Tales",
    description: "Stories in different languages and cultures",
    members: "2,100 members",
    color: "bg-blue-500",
    joined: true,
  },
  {
    name: "STEM Adventures",
    description: "Science and technology themed stories",
    members: "643 members",
    color: "bg-purple-500",
    joined: false,
  },
]

const activeMembers = [
  { name: "Emma Chen", status: "Online now", avatar: "EC", color: "bg-blue-500" },
  { name: "David Kim", status: "Online now", avatar: "DK", color: "bg-green-500" },
  { name: "Lisa Garcia", status: "Online now", avatar: "LG", color: "bg-pink-500" },
  { name: "Ahmed Hassan", status: "Online now", avatar: "AH", color: "bg-orange-500" },
]

export default function CommunityPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto dark:bg-[#1a1a1a]" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-7xl pt-6 sm:pt-8 md:pt-10 px-6 pb-8 sm:pb-12 md:pb-16">
            {/* Header Section */}
            <div className="mb-12 sm:mb-16">
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                Community
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Community Circle
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Connect with storytellers worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Share Post */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Share with the Community</h3>
                    <Textarea
                      placeholder="Share your story experiences, ask questions, or connect with other families..."
                      className="min-h-24 mb-4 resize-none"
                    />
                    <div className="flex justify-end">
                      <Button className="gap-2">
                        <Send className="h-4 w-4" />
                        Share Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts */}
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className={`h-12 w-12 ${post.avatarColor}`}>
                          <AvatarFallback className={`${post.avatarColor} text-white font-semibold`}>
                            {post.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{post.author}</h4>
                          <p className="text-sm text-muted-foreground">{post.time}</p>
                        </div>
                      </div>
                      <p className="mb-4 text-sm leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <button className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          {post.comments}
                        </button>
                        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Community Circles */}
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Community Circles</h3>
                    </div>
                    <div className="space-y-4">
                      {communityCircles.map((circle, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full ${circle.color} flex-shrink-0`}
                            >
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{circle.name}</h4>
                                  {circle.joined && <span className="text-xs text-green-600 font-medium">Joined</span>}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{circle.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{circle.members}</p>
                            </div>
                          </div>
                          {!circle.joined && (
                            <Button size="sm" variant="outline" className="w-full bg-transparent">
                              <Users className="h-3 w-3 mr-1.5" />
                              Join
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Members */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Active Members</h3>
                    <div className="space-y-3">
                      {activeMembers.map((member, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={`h-10 w-10 ${member.color}`}>
                              <AvatarFallback className={`${member.color} text-white font-semibold text-sm`}>
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.status}</p>
                          </div>
                        </div>
                      ))}
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
