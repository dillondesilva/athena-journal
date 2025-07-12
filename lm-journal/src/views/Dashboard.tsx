import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Trash2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import Note from "@/types/Note";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Dashboard() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate();
    
    const fetchJournalEntries = async () => {
        const response = await fetch("http://localhost:8080/getallnotes");
        const data = await response.json();
        setNotes(data as Note[]);
    };
    
    useEffect(() => {
        fetchJournalEntries();
    }, []);

    const handleDeleteNote = async (noteId: string, _e: React.MouseEvent) => {
        try {
            const response = await fetch("http://localhost:8080/deletenote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ NoteId: noteId }),
            });
            
            if (response.ok) {
                // Remove the deleted note from the state
                setNotes(notes.filter(note => note.NoteId !== noteId));
            } else {
                console.error('Failed to delete note');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    // Filter notes based on search query
    const filteredNotes = notes.filter(note => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const titleMatch = note.Title.toLowerCase().includes(query);
        const contentMatch = note.Content.toLowerCase().includes(query);
        
        return titleMatch || contentMatch;
    })
    // Sort by most recently updated
    .sort((a, b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime());

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const formatLastUpdated = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // If it's today, show the time
        if (diffDays === 0) {
            return `Last updated at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // If it's within the last 6 days, show days ago
        if (diffDays <= 6) {
            return `Last updated ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        }
        
        // Otherwise show the full date
        return `Last updated ${date.toLocaleDateString()}`;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b h-18 flex-shrink-0">
                <SidebarTrigger />
                <div className="relative w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto">
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 w-full max-w-6xl">
                    {filteredNotes.map(note => (
                        <Card 
                            key={note.NoteId} 
                            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg relative group h-[200px] flex flex-col" 
                            onClick={() => navigate(`/notepad/${note.NoteId}`)}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-2">
                                    <CardTitle>{note.Title}</CardTitle>
                                    <CardDescription>{formatLastUpdated(note.UpdatedAt.toString())}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        {/* <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                        > */}
                                            <MoreVertical className="h-4 w-4" />
                                        {/* </Button> */}
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteNote(note.NoteId, e);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <p className="line-clamp-2">{note.Content}</p>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                    
                    {filteredNotes.length === 0 && searchQuery.trim() && (
                        <div className="text-center text-gray-500 mt-8 w-full max-w-6xl">
                            <p>No journal entries found matching "{searchQuery}"</p>
                            <p className="text-sm mt-2">Try adjusting your search terms</p>
                        </div>
                    )}
                    
                    {filteredNotes.length === 0 && !searchQuery.trim() && (
                        <div className="text-center text-gray-500 mt-8 w-full max-w-6xl">
                            <p>No journal entries yet</p>
                            <p className="text-sm mt-2">Create your first journal entry to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
