import { Calendar, Home, Inbox, Link, MessageCircle, Notebook, PlusIcon, Search, Settings } from "lucide-react"
import { memo } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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

// Menu items.
const items = [
  {
    title: "My Notes",
    url: "/",
    icon: Notebook,
  },
]


export const AppSidebar = memo(() => {
  const navigate = useNavigate();
  const createNewNote = async () => {
    const newNoteCreation = await fetch("http://localhost:8080/createnote", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(newNoteCreation);
    const newNote = await newNoteCreation.json();
    navigate(`/notepad/${newNote.NoteId}`);
  }
  
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>cookieman</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* <SidebarMenuButton asChild> */}
              <Button className="cursor-pointer w-2/3 self-center" onClick={() => createNewNote()}>New Note <PlusIcon /></Button>
              {/* </SidebarMenuButton> */}
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <div onClick={() => navigate(item.url)} className="cursor-pointer">
                      <item.icon />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
})