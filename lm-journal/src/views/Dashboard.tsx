import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import Note from "@/types/Note";

function Dashboard({ viewChangeHandler }: { viewChangeHandler: (view: string) => void }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchJournalEntries = async () => {
            const response = await fetch("http://localhost:8080/getallnotes");
            const data = await response.json();
            setNotes(data as Note[]);
        };
        fetchJournalEntries();
    }, []);

    // Filter notes based on search query
    const filteredNotes = notes.filter(note => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase();
        const titleMatch = note.Title.toLowerCase().includes(query);
        const contentMatch = note.Content.toLowerCase().includes(query);
        
        return titleMatch || contentMatch;
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div>
            <div className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex items-center justify-between p-4">
                <SidebarTrigger />
                <div className="flex-1 max-w-2xl mx-auto px-4">
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                        placeholder="Search your journal entries..." 
                        className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    </div>
                </div>
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-1 p-8 overflow-auto">
                {/* Display filtered notes */}
                <div className="grid grid-cols-3 gap-6 mb-6 w-full max-w-6xl">
                {filteredNotes.map(note => (
                    <Card 
                        key={note.NoteId} 
                        className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg" 
                        onClick={() => navigate(`/notepad/${note.NoteId}`)}
                    >
                        <CardHeader>
                            <CardTitle>{note.Title}</CardTitle>
                            <CardDescription>Created at {note.CreatedAt.toString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="line-clamp-2">{note.Content}</p>
                        </CardContent>
                    </Card>
                ))}
                </div>
                
                {/* Show message when no results found */}
                {filteredNotes.length === 0 && searchQuery.trim() && (
                    <div className="text-center text-gray-500 mt-8 w-full max-w-6xl">
                        <p>No journal entries found matching "{searchQuery}"</p>
                        <p className="text-sm mt-2">Try adjusting your search terms</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
