import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

export default function Chat({ viewChangeHandler }: { viewChangeHandler: (view: string) => void }) {
  return (
    <div className="w-full h-full">
      <SidebarTrigger />
      <div className="flex flex-col items-center justify-center flex-1 p-8 overflow-auto">
        <div className="flex flex-col items-center justify-center flex-1 p-8 overflow-auto">
          <h1 className="text-3xl font-bold">Start yapping</h1>
          <Textarea placeholder="Enter your prompt here" />
        </div>
      </div>
    </div>
  );
}