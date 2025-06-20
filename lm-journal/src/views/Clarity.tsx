import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Add this style block to your component or global CSS
const fadeInStyle = `
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.fade-in {
  animation: fadeIn 0.7s ease;
  display: inline;
}
/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;     /* Firefox */
}
`;

const modernClarityStyles = `
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
  .clarity-gradient-bg {
    background: #fff;
    min-height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0; left: 0;
    z-index: -1;
  }
  .glass-card::-webkit-scrollbar {
    display: none;
  }
  .glass-card {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function Clarity() {
  const { timeframe } = useParams();
  const [clarityChunks, setClarityChunks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bufferRef = useRef("");

  useEffect(() => {
    if (!timeframe) return;
    setClarityChunks([]);
    setIsLoading(true);
    bufferRef.current = "";
    const fetchClarity = async () => {
      try {
        const response = await fetch("http://localhost:8080/clarity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeframe }),
        });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const result = await reader?.read();
          if (!result) break;
          const { done, value } = result;
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          bufferRef.current += chunk;
          const parts = bufferRef.current.split('data: ');
          bufferRef.current = parts.pop() || "";
          for (const part of parts) {
            const line = part.trim();
            if (!line) continue;
            try {
              const jsonData = JSON.parse(line);
              if (jsonData.content) {
                setClarityChunks((prev) => [...prev, jsonData.content]);
              }
            } catch (error) {
              bufferRef.current = line;
            }
          }
        }
      } catch (error) {
        setClarityChunks(["Sorry, we couldn't get clarity right now. Please try again later."]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClarity();
  }, [timeframe]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      {/* Modern gradient background */}
      <style>{fadeInStyle + modernClarityStyles}</style>
      <div className="clarity-gradient-bg" />
      {/* <div className="flex items-center justify-between p-2 border-b h-18 w-full">
          <SidebarTrigger />
      </div> */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-4 sm:px-8 pt-16 pb-12">
        <div className="glass-card fade-in w-full max-w-2xl p-8 sm:p-10 flex flex-col items-center min-h-[320px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 text-blue-600 mb-6 fade-in">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 drop-shadow-lg mx-auto" />
              {/* <span className="text-base font-medium tracking-wide">Finding clarity in your journal entries...</span> */}
            </div>
          )}
          <div
            className="whitespace-pre-wrap text-lg text-gray-800 w-full text-left fade-in"
            style={{ lineHeight: 1.7 }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ node, ...props }) => (
                  <strong style={{ color: "#3b82f6" }} {...props} />
                ),
              }}
            >
              {clarityChunks.join("") || (!isLoading ? "No clarity summary yet. Try selecting a timeframe from the sidebar." : null)}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}