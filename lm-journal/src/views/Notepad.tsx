import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Note from "@/types/Note";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Add glass card and fade-in styles
const glassCardStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in {
    animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1);
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 1.5rem;
    border: 1px solid rgba(200, 200, 255, 0.13);
    transition: box-shadow 0.2s;
    max-height: 70vh;
    overflow-y: auto;
  }
  .glass-card:hover {
    box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.22);
  }
  .glass-card::-webkit-scrollbar {
    display: none;
  }
  .glass-card {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .text-fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.4,0,0.2,1);
  }
`;

export default function Notepad() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [isNoteLoading, setIsNoteLoading] = useState(true);
  const params = useParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateNoteApiCall = async () => {
    if (!note?.NoteId && !params.id) return;
    
    try {
      await fetch("http://localhost:8080/updatenote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          NoteId: note?.NoteId || params.id,
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
    if (!hasUserTyped) return;
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
    return () => {
      // Only save if we have a valid note ID and user has made changes
      if (note?.NoteId && hasUserTyped && (title || content)) {
        updateNoteApiCall();
      }
    };
  }, [note?.NoteId, title, content, hasUserTyped]); // Include dependencies to ensure we have latest values

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
      if (!params.id) return;
      
      // Cancel any ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this fetch
      abortControllerRef.current = new AbortController();
      
      setIsNoteLoading(true);
      console.log("Fetching note: ", params.id);
      
      try {
        const response = await fetch("http://localhost:8080/getnote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ NoteId: params.id }),
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }
        
        const noteData = await response.json();
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.Title || "");
          setContent(noteData.Content || "");
          setHasUserTyped(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching note:', error);
        setNote({ NoteId: params.id, Title: "", Content: "", CreatedAt: new Date(), UpdatedAt: new Date() });
        setTitle("");
        setContent("");
        setHasUserTyped(false);
      } finally {
        setIsNoteLoading(false);
      }
    };
    
    fetchNote();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [params.id]);

  // Focus textarea when note is loaded and user hasn't typed
  useEffect(() => {
    if (!isNoteLoading && !hasUserTyped && textareaRef.current) {
      // Use a timeout to ensure the content is fully rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Move cursor to the end of the content
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 100);
    }
  }, [isNoteLoading, hasUserTyped, content]);

  // Save note when component unmounts
  useEffect(() => {
    return () => {
      if (hasUserTyped && (title || content)) {
        updateNoteApiCall();
      }
    };
  }, [title, content, hasUserTyped]);

  // Add beforeunload event listener to save on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUserTyped && (title || content)) {
        updateNoteApiCall();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [title, content, hasUserTyped]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <style>{glassCardStyles}</style>
      <div className="flex items-center justify-between p-4 border-b h-18 w-full">
          <SidebarTrigger />
      </div>
      <div className="flex-1 w-full">
        <div className="flex flex-col w-full h-full p-4">
          <div className="flex items-center gap-2 w-full">
            {isNoteLoading ? (
              <div className="flex-1 h-10 bg-gray-100 animate-pulse rounded-md" />
            ) : (
              <input 
                placeholder={title ? "" : "Enter your title here"} 
                className="text-lg font-semibold px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md flex-1"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasUserTyped(true);
                }}
              />
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2 shrink-0"
              onClick={handleClarifyThoughts}
              disabled={!content.trim() || isNoteLoading}
            >
              <Brain className="h-4 w-4" />
            </Button>
            {(showAiSection || aiResponse) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleAiSection}
                className="flex items-center gap-1 shrink-0"
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
          
          <div className="flex-1 flex flex-col space-y-4">
            <div className={`flex-1 flex gap-4 transition-all duration-300 ${showAiSection ? 'flex-row' : 'flex-col'}`}>
              <div className={`flex flex-col ${showAiSection ? 'w-1/2' : 'w-full'}`}>
                {isNoteLoading ? (
                  <div className="flex-1 min-h-[70vh] bg-gray-100 animate-pulse rounded-md" />
                ) : (
                  <Textarea 
                    ref={textareaRef}
                    placeholder="Enter your content here" 
                    className="flex-1 min-h-[70vh] resize-none outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 shadow-none focus:shadow-none transition-all duration-200"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setHasUserTyped(true);
                    }}
                  />
                )}
              </div>

              {showAiSection && (
                <div className="w-1/2 flex flex-col animate-in slide-in-from-right-2 duration-300">
                  <div className="glass-card fade-in p-6 h-full flex flex-col">
                    <div className="flex items-center gap-3 border-b border-gray-200/50 pb-4 mb-4">
                      <Brain className="h-6 w-6 text-blue-600" />
                      <h3 className="font-semibold text-xl text-gray-800">Athena</h3>
                    </div>
                    <div className="flex-1 flex flex-col">
                      {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-3 text-blue-600 mb-6 fade-in">
                          <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      
                      <div className="flex-1 overflow-y-auto">
                        <div className="text-fade-in whitespace-pre-wrap text-lg text-gray-800 w-full text-left" style={{ lineHeight: 1.7 }}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({ node, ...props }) => (
                                <strong style={{ color: "#3b82f6" }} {...props} />
                              ),
                            }}
                          >
                            {aiResponse || "Click 'Clarify Thoughts' to get AI insights on your journal entry."}
                          </ReactMarkdown>
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