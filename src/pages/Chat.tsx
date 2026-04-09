import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Clock, CheckCheck, Inbox } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface Message {
  _id?: string;
  userId: string; // 👉 Now we track WHO the message belongs to
  text: string;
  sender: 'user' | 'shelter';
  time: string;
}

export default function Chat() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 👉 1. Initial Load: Connect Socket & Fetch User List
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await api.get('/chat-sessions');
        setActiveUsers(response.data);
      } catch (error) {
        console.error("Could not fetch chat sessions:", error);
      }
    };
    fetchActiveSessions();

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // 👉 Join the special master room so Admin hears all incoming messages
      socketRef.current?.emit("joinAdmin");
    });

    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // 👉 2. Listen for incoming messages (Needs to know the selected user)
  useEffect(() => {
    if (!socketRef.current) return;

    // Remove old listener before adding a new one (prevents duplicate messages)
    socketRef.current.off('receiveMessage');

    socketRef.current.on('receiveMessage', (newMessage: Message) => {
      // Only append the message to the screen IF it belongs to the user we are currently talking to!
      if (selectedUser && newMessage.userId === selectedUser._id) {
        setMessages((prev) => [...prev, newMessage]);
      } else {
        // Optional: In the future, you could add a "New!" badge to the sidebar here
        console.log("Received background message from another user");
      }
    });
  }, [selectedUser]);

  // 👉 3. Fetch history when Admin clicks on a user
  useEffect(() => {
    if (!selectedUser) return;

    const fetchUserHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await api.get(`/messages/${selectedUser._id}`);
        setMessages(response.data);
      } catch (error) {
        console.error("Could not fetch user history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchUserHistory();
  }, [selectedUser]);

  // 👉 4. Send Message Logic
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || !selectedUser) return;

    const messageData = {
      userId: selectedUser._id, // Tell backend exactly which room to route this to
      text: inputText,
      sender: 'shelter', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current.emit('sendMessage', messageData);
    setInputText('');
  };

  // Helper to format user display name securely
  const getDisplayName = (u: User) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    if (u.name) return u.name;
    if (u.email) return u.email.split('@')[0];
    return "Anonymous User";
  };

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1B2A49]">Support Inbox</h1>
          <p className="text-gray-500 mt-1">Manage private conversations with adopters.</p>
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
        
        {/* 👉 LEFT SIDEBAR: Active Users List */}
        <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-[#1B2A49] flex items-center">
              <Inbox size={18} className="mr-2 text-[#2D6A4F]" />
              Active Conversations ({activeUsers.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No active conversations yet.</div>
            ) : (
              activeUsers.map((u) => {
                const isSelected = selectedUser?._id === u._id;
                return (
                  <div 
                    key={u._id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-5 border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#2D6A4F]/10 border-l-4 border-l-[#2D6A4F]' : 'hover:bg-gray-100 bg-white border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#1B2A49] flex items-center truncate">
                        <UserIcon size={18} className={`mr-2 p-1 rounded-full shadow-sm ${isSelected ? 'text-[#2D6A4F] bg-white' : 'text-gray-400 bg-gray-100'}`} />
                        {getDisplayName(u)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate pl-7">
                       ID: {u._id.substring(0, 8)}...
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 👉 RIGHT SIDEBAR: Private Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
          
          {!selectedUser ? (
             // No user selected state
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Inbox size={48} className="mb-4 opacity-20" />
               <p>Select a conversation from the left to start chatting.</p>
             </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="bg-white p-4 border-b border-gray-100 flex items-center shadow-sm z-10">
                 <h3 className="font-bold text-[#1B2A49]">Chatting with: {getDisplayName(selectedUser)}</h3>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {isLoadingHistory ? (
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
                    placeholder={isConnected ? `Reply to ${getDisplayName(selectedUser)}...` : "Connecting to chat server..."}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}