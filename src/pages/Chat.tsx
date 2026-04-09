import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Clock, CheckCheck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';

// 👉 UPGRADE: Dynamically get the backend URL from your api.ts file!
// If you update your Ngrok link in api.ts, the chat automatically updates too!
const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

interface Message {
  _id?: string;
  text: string;
  sender: 'user' | 'shelter';
  time: string;
  createdAt?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 1. Fetch Chat History
    const fetchHistory = async () => {
      try {
        const response = await api.get('/messages');
        setMessages(response.data);
      } catch (error) {
        console.error("Could not fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();

    // 2. Connect Socket.io securely
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Fallback for better mobile connections
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    // 3. Listen for incoming messages
    socketRef.current.on('receiveMessage', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    const messageData = {
      text: inputText,
      sender: 'shelter', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Emit to backend
    socketRef.current.emit('sendMessage', messageData);
    
    // Show instantly on admin screen
    setMessages((prev) => [...prev, messageData as Message]);
    setInputText('');
  };

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A49]">Live Support</h1>
          <p className="text-gray-500 mt-1">Answer questions from potential adopters.</p>
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <div className={`w-2.5 h-2.5 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'System Online' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex overflow-hidden">
        
        {/* Left Side: Active Channels */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-[#1B2A49]">Active Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Global Chat Channel */}
            <div className="p-5 border-b border-gray-100 bg-[#2D6A4F]/10 cursor-pointer border-l-4 border-l-[#2D6A4F]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#1B2A49] flex items-center">
                  <UserIcon size={18} className="mr-2 text-[#2D6A4F] bg-white p-1 rounded-full shadow-sm" />
                  General Community
                </span>
                <span className="text-xs font-bold text-[#2D6A4F] bg-green-100 px-2 py-0.5 rounded-full flex items-center">
                   <Clock size={12} className="mr-1" /> Live
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate mt-2 pl-7">
                {messages.length > 0 ? messages[messages.length - 1].text : "No messages yet..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
          
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {isLoading ? (
               <div className="flex justify-center items-center h-full text-gray-400">Loading history...</div>
            ) : messages.length === 0 ? (
               <div className="flex justify-center items-center h-full text-gray-400">No messages in this channel yet.</div>
            ) : (
              messages.map((msg, idx) => {
                const isShelter = msg.sender === 'shelter';
                return (
                  <div key={idx} className={`flex ${isShelter ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
                      isShelter 
                        ? 'bg-[#2D6A4F] text-white rounded-br-sm' 
                        : 'bg-white border border-gray-100 text-[#1B2A49] rounded-bl-sm'
                    }`}>
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 text-[10px] mt-1.5 ${isShelter ? 'text-green-200 justify-end' : 'text-gray-400 justify-start'}`}>
                        {msg.time}
                        {isShelter && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                placeholder={isConnected ? "Type your reply..." : "Connecting to chat server..."}
                disabled={!isConnected}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-[#1B2A49] bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                className="bg-[#2D6A4F] text-white p-3 rounded-xl hover:bg-[#1f4a37] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-14"
              >
                <Send size={20} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}