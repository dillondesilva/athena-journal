import { Calendar, Home, HomeIcon, Inbox, Link, MessageCircle, Notebook, PlusIcon, Search, Settings, Wand2Icon } from "lucide-react"
import { memo, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { useNavigate } from "react-router-dom"
import { Input } from "../ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Menu items.
export const AppSidebar = memo(() => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Keyboard shortcuts
  useHotkeys('meta+shift+h', () => navigate('/'), { enableOnFormTags: true });
  useHotkeys('meta+shift+n', () => createNewNote(), { enableOnFormTags: true });
  useHotkeys('meta+shift+c', () => setIsDialogOpen(true), { enableOnFormTags: true });

  const createNewNote = async () => {
    const newNoteCreation = await fetch("http://localhost:8080/createnote", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(newNoteCreation);
    const newNote = await newNoteCreation.json();
    console.log(newNote);
    navigate(`/notepad/${newNote.NoteId}`);
  }

  const handleClarityNavigation = (path: string) => {
    setIsDialogOpen(false);
    navigate(path);
  }
  
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Athena</SidebarGroupLabel>
          <SidebarGroupContent>
            <TooltipProvider delayDuration={75}>
              <SidebarMenu>
                <div className="flex flex-col gap-1 mt-2">
                  {/* Home */}
                  <SidebarMenuItem>
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 opacity-0 group-hover/menu-item:opacity-100 transition-opacity pointer-events-none z-10">
                      <span className="bg-muted text-xs rounded px-2 py-0.5 shadow border select-none">⌘⇧H</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-3 justify-start w-full px-3 py-2 text-left hover:bg-muted/70 transition-colors"
                      onClick={() => navigate("/")}
                    >
                      <HomeIcon className="w-5 h-5" />
                      <span>Home</span>
                    </Button>
                  </SidebarMenuItem>
                  {/* Add Note */}
                  <SidebarMenuItem>
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 opacity-0 group-hover/menu-item:opacity-100 transition-opacity pointer-events-none z-10">
                      <span className="bg-muted text-xs rounded px-2 py-0.5 shadow border select-none">⌘⇧N</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-3 justify-start w-full px-3 py-2 text-left hover:bg-muted/70 transition-colors"
                      onClick={createNewNote}
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add Note</span>
                    </Button>
                  </SidebarMenuItem>
                  {/* Find Clarity (Dialog) */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <SidebarMenuItem>
                      <div className="absolute left-1/2 -translate-x-1/2 -top-4 opacity-0 group-hover/menu-item:opacity-100 transition-opacity pointer-events-none z-10">
                        <span className="bg-muted text-xs rounded px-2 py-0.5 shadow border select-none">⌘⇧C</span>
                      </div>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-3 justify-start w-full px-3 py-2 text-left hover:bg-muted/70 transition-colors"
                        >
                          <Wand2Icon className="w-5 h-5" />
                          <span>Find Clarity</span>
                        </Button>
                      </DialogTrigger>
                    </SidebarMenuItem>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clarity</DialogTitle>
                        <DialogDescription>
                          Find clarity in your journal entries across time. Get advice, see emerging themes and reflect better.
                        </DialogDescription>
                      </DialogHeader>
                      <p className="text-center">I want clarity across</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => handleClarityNavigation("/clarity/week")}>Past Week</Button>
                        <Button onClick={() => handleClarityNavigation("/clarity/month")}>Past Month</Button>
                        <Button onClick={() => handleClarityNavigation("/clarity/6months")}>Past 6 Months</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </SidebarMenu>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
})