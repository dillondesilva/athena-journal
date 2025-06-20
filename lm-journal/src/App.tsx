import { useState, useCallback } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { AppSidebar } from "./components/general/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Dashboard from "@/views/Dashboard";
import Chat from "@/views/Chat";
import Notepad from "@/views/Notepad";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Clarity from "./views/Clarity";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");

  // Memoize the callback to prevent unnecessary re-renders
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view);
  }, []);

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex overflow-hidden">
        <AppSidebar/>
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard viewChangeHandler={setCurrentView}/>} />
            <Route path="/chat" element={<Chat viewChangeHandler={setCurrentView}/>} />
            <Route path="/notepad/:id" element={<Notepad />} />
            <Route path="/clarity/:timeframe" element={<Clarity />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default App;
