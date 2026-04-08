import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';

// 👉 Remember to change this if your backend is running elsewhere!
const SOCKET_URL = 'http://localhost:5000';

interface Message {
  _id?: string;
  text: string;
  sender: 'user' | 'shelter';
  time: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 1. Fetch initial message history from MongoDB
    const fetchHistory = async () => {
      try {
        const response = await api.get('/messages');
        setMessages(response.data);
      } catch (error) {
        console.error("Could not fetch messages:", error);
      }
    };
    fetchHistory();

    // 2. Connect to Socket.io
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // 3. Listen for incoming messages
    socketRef.current.on('receiveMessage', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    const messageData = {
      text: inputText,
      sender: 'shelter', // 👉 We identify as the shelter here!
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Emit the message to the backend
    socketRef.current.emit('sendMessage', messageData);
    
    // Optimistically add to UI
    setMessages((prev) => [...prev, messageData]);
    setInputText('');
  };

  return (
    <div className="p-8 h-screen flex flex-col">
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

      {/* Main Chat Layout (Mocking a simple single-channel for now) */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
        
        {/* Left Side: "Active Users" List (Mock UI) */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-[#1B2A49]">Active Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* We just have a single "General Chat" for this capstone scope */}
            <div className="p-4 border-b border-gray-100 bg-[#2D6A4F]/10 cursor-pointer">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#1B2A49] flex items-center">
                  <UserIcon size={16} className="mr-2 text-[#2D6A4F]" />
                  General Community
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                   <Clock size={12} className="mr-1" />
                   Live
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {messages.length > 0 ? messages[messages.length - 1].text : "No messages yet..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isShelter = msg.sender === 'shelter';
              return (
                <div key={idx} className={`flex ${isShelter ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                    isShelter 
                      ? 'bg-[#2D6A4F] text-white rounded-br-sm' 
                      : 'bg-gray-100 text-[#1B2A49] rounded-bl-sm'
                  }`}>
                    <p className="text-[15px]">{msg.text}</p>
                    <span className={`text-[10px] mt-1 block ${isShelter ? 'text-green-200 text-right' : 'text-gray-400 text-left'}`}>
                      {msg.time} {isShelter && "✓"}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your reply..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-[#1B2A49]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                className="bg-[#2D6A4F] text-white p-3 rounded-xl hover:bg-[#1f4a37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-14"
              >
                <Send size={20} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}