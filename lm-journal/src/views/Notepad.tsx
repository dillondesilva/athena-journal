import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Note from "@/types/Note";

export default function Notepad({ viewChangeHandler }: { viewChangeHandler: (view: string) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const params = useParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateNoteApiCall = async () => {
    try {
      await fetch("http://localhost:8080/updatenote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          NoteId: note?.NoteId,
          Title: title,
          Content: content,
          UpdatedAt: note?.UpdatedAt,
          CreatedAt: note?.CreatedAt
        }),
      });
      console.log("Note auto-saved");
    } catch (error) {
      console.error('Error auto-saving note:', error);
    }
  }

  // Auto-save function
  const autoSaveNote = async () => {
    if (!note?.NoteId || !hasUserTyped) return;
    updateNoteApiCall();
  };

  // Reset timeout on title change
  useEffect(() => {
    if (!hasUserTyped) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      autoSaveNote();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [title, hasUserTyped, note?.NoteId]);

  // Reset timeout on content change
  useEffect(() => {
    if (!hasUserTyped) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      autoSaveNote();
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, hasUserTyped, note?.NoteId]);

  // Final autosave on component unmount
  useEffect(() => {
    const updateNote = async () => {
      await updateNoteApiCall();
    }
    return () => {
      updateNote();
    };
  }, []); // Empty dependency array means this only runs on mount/unmount

  const handleClarifyThoughts = async () => {
    if (!content.trim()) return;
    
    if (!showAiSection) {
      setShowAiSection(true);
    }
    
    setIsLoading(true);
    setAiResponse(""); // Clear previous response
    
    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          Prompt: content,
          N_predict: 128,
          Stream: true,
        }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const result = await reader?.read();
        if (!result) break;
        const { done, value } = result;
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log(chunk);
        
        // Parse the chunk to extract content from JSON objects
        const lines = chunk.split('data: ').filter(line => line.trim());
        for (const line of lines) {
          try {
            const jsonData = JSON.parse(line.trim());
            if (jsonData.content) {
              setAiResponse((prev) => prev + jsonData.content);
            }
          } catch (error) {
            console.error('Error parsing chunk:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error clarifying thoughts:', error);
      setAiResponse("Sorry, I couldn't process your thoughts right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAiSection = () => {
    setShowAiSection(!showAiSection);
  };

  useEffect(() => {
    const fetchNote = async () => {
      console.log("Fetching note: ", params.id);
      const note = await fetch("http://localhost:8080/getnote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ NoteId: params.id }),
      });
      const noteData = await note.json();
      setNote(noteData);
      setTitle(noteData.Title);
      setContent(noteData.Content);
    };
    fetchNote();
  }, [params.id]);

  return (
    <div className="w-full h-full">
      <SidebarTrigger />
      <div className="flex flex-col items-center justify-center flex-1 p-8 overflow-auto">
        <div className="flex flex-col w-full max-w-7xl space-y-4 flex-1">
          <input 
            placeholder="Enter your title here" 
            className="text-lg font-semibold px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUserTyped(true);
            }}
          />
          
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleClarifyThoughts}
                disabled={!content.trim()}
              >
                <Brain className="h-4 w-4" />
                Clarify Thoughts
              </Button>
              
              {(showAiSection || aiResponse) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleAiSection}
                  className="flex items-center gap-1"
                >
                  {showAiSection ? (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      Hide AI
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      Show AI
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className={`flex-1 flex gap-4 transition-all duration-300 ${showAiSection ? 'flex-row' : 'flex-col'}`}>
              <div className={`flex flex-col ${showAiSection ? 'w-1/2' : 'w-full'}`}>
                <Textarea 
                  placeholder="Enter your content here" 
                  className="flex-1 min-h-[70vh] resize-none outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 shadow-none focus:shadow-none transition-all duration-200"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setHasUserTyped(true);
                  }}
                />
              </div>

              {showAiSection && (
                <div className="w-1/2 flex flex-col animate-in slide-in-from-right-2 duration-300">
                  <div className="border rounded-lg p-4 bg-gray-50/50 space-y-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">AI Thought Clarification</h3>
                    </div>
                    
                    <div className="space-y-4 flex-1 overflow-hidden">
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-medium mb-2 text-sm text-gray-700">AI Clarification:</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm flex-1 overflow-y-auto">
                          <div className="whitespace-pre-wrap">
                            {aiResponse || "Click 'Clarify Thoughts' to get AI insights on your journal entry."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}