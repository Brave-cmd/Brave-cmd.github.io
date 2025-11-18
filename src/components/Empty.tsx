import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Empty component
export function Empty() {
  return (
    <div className={cn("flex h-full items-center justify-center")} onClick={() => toast('Coming soon')}>Empty</div>
  );
}

// 聊天消息组件
export function ChatMessage({ 
  type, 
  text,
  isDark = false
}: { 
  type: "user" | "bot"; 
  text: string;
  isDark?: boolean;
}) {
  return (
    <div className={`flex mb-4 ${type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${
        type === 'user' 
          ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
          : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800')
      } p-3 rounded-lg`}>
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

// 校史概览组件
export function UniversityHistory({ 
  history, 
  isDark = false 
}: { 
  history: { title: string; content: string }[]; 
  isDark?: boolean;
}) {
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index}>
          <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{item.title}</h4>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{item.content}</p>
        </div>
      ))}
    </div>
  );
}

// 校史时间线组件
export function HistoryTimeline({ 
  events, 
  isDark = false 
}: { 
  events: { year: string; event: string }[]; 
  isDark?: boolean;
}) {
  return (
    <div className="relative pl-6 border-l-2 border-dashed border-blue-400 space-y-6">
      {events.map((event, index) => (
        <div key={index} className="relative">
          <div className="absolute -left-[38px] w-4 h-4 bg-blue-500 rounded-full"></div>
          <h4 className={`font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{event.year}</h4>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{event.event}</p>
        </div>
      ))}
    </div>
  );
}

// 提问按钮组件
export function AskButton({ 
  text, 
  onClick 
}: { 
  text: string; 
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
    >
      {text}
    </motion.button>
  );
}