import "./App.css";
import { AppSidebar } from "./components/general/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar"
import Dashboard from "@/views/Dashboard";
import Chat from "@/views/Chat";
import Notepad from "@/views/Notepad";
import { Routes, Route } from "react-router-dom";
import Clarity from "./views/Clarity";
import { Command } from '@tauri-apps/plugin-shell';
import { useEffect } from 'react';
import { appDataDir } from '@tauri-apps/api/path';
// import { logger } from './utils/logger';

function App() {

  useEffect(() => {
    const startAthenaBackend = async () => {
      try {
        console.log('Starting Athena backend...');
        
        const path = await appDataDir();
        const command = Command.sidecar('athena-be/athena-backend', [path]);
        console.log("APP PATH", path)
        console.log('Command created', { command: command.toString() });
        command.on('error', error => console.error(`athena-be error: "${error}"`));
        command.stdout.on('data', line => console.log(`athena-be stdout: "${line}"`));
        command.stderr.on('data', line => console.log(`athena-be stderr: "${line}"`));

        const output = await command.spawn();
        console.log('Athena backend started successfully', { output });
      } catch (error) {
        console.error('Failed to start Athena backend', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
    
    startAthenaBackend();
  }, [])

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex overflow-hidden">
        <AppSidebar/>
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/notepad/:id" element={<Notepad />} />
            <Route path="/clarity/:timeframe" element={<Clarity />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default App;
