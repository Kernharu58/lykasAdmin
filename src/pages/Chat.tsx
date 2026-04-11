import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

export default function Chat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // We use a ref for selectedUser so the Socket listener always knows who is currently open
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat-sessions');
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchSessions(); // Initial load

    // Connect to Socket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("joinAdmin");
    });

    // Listen for incoming messages from ANY user
    socketRef.current.on("receiveMessage", (newMessage) => {
      
      // 1. Instantly refresh the sidebar! (This brings the sender to the top)
      fetchSessions();

      // 2. If the admin is actively looking at the sender's chat, show the message on screen
      if (selectedUserRef.current && newMessage.userId === selectedUserRef.current._id) {
        setMessages((prev) => {
          // 👉 FIX: The Silent Swap Logic
          // Find if this is a message we already optimistically added to the screen
          const existingIndex = prev.findIndex(
            (msg) => msg.text === newMessage.text && msg.time === newMessage.time && msg.sender === newMessage.sender
          );

          if (existingIndex !== -1) {
            // Silent Swap: Replace the local mock message with the real Database message
            const newArray = [...prev];
            newArray[existingIndex] = newMessage;
            return newArray;
          }

          // Otherwise, it's a brand new message from the user, add it to the bottom
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !selectedUser || !socketRef.current) return;

    const messageData = {
      userId: selectedUser._id,
      text: inputText.trim(),
      sender: "shelter",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Emit to backend
    socketRef.current.emit("sendMessage", messageData);
    
    // 👉 FIX: Optimistically update the UI instantly using a clear local ID
    const optimisticMessage = { ...messageData, _id: "local_" + Date.now().toString() };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    
    // Slight delay to allow the DB to save before refreshing the sidebar to bump this chat to the top
    setTimeout(fetchSessions, 300);
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden m-8">
      
      {/* Sidebar: Chat List */}
      <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-white flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm mt-10">No active chats.</div>
          ) : (
            sessions.map((user) => (
              <button 
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-4 border-b border-gray-100 flex items-center gap-3 transition-colors ${
                  selectedUser?._id === user._id ? 'bg-emerald-50' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200 flex-shrink-0">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={20} />
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-semibold truncate ${selectedUser?._id === user._id ? 'text-emerald-800' : 'text-gray-800'}`}>
                    {user.displayName || "Unknown User"}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">Click to view conversation</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Chat Window Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200">
                {selectedUser.profilePicture ? (
                  <img src={selectedUser.profilePicture} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : <UserIcon size={18} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{selectedUser.displayName || "Unknown User"}</h3>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                  Active session
                </p>
              </div>
            </div>

            {/* Chat Bubbles */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar">
              <div className="flex flex-col gap-4">
                {messages.map((msg, index) => {
                  const isShelter = msg.sender === 'shelter';
                  return (
                    <div key={msg._id || index} className={`flex flex-col max-w-[75%] ${isShelter ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        isShelter ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a response to the user..." 
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-all"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600 shadow-sm"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UserIcon size={40} className="text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-600">Select a conversation</p>
            <p className="text-sm mt-1 text-gray-500">Choose a user from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}