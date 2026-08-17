import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, Plus } from "lucide-react"

export default function ProjectsPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-y-auto" role="main" tabIndex={-1}>
          <div className="mx-auto max-w-7xl pt-6 sm:pt-8 md:pt-10 px-6 pb-8 sm:pb-12 md:pb-16">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Projects</h1>
                <p className="text-muted-foreground">Organize your stories into collections</p>
              </div>
              <Button className="gap-2" aria-label="Create new project">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Project
              </Button>
            </div>

            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project to organize your stories into themed collections.
                </p>
                <Button className="gap-2" aria-label="Create your first project">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
