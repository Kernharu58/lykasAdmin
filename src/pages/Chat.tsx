import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Search, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

export default function Chat() {
  const location = useLocation();

  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat-sessions');
      setSessions(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
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
    const initChat = async () => {
      const data = await fetchSessions();
      
      if (location.state && location.state.selectedUserId && data) {
        const targetUser = data.find((u: any) => u._id === location.state.selectedUserId);
        if (targetUser) {
          handleUserSelect(targetUser);
          window.history.replaceState({}, document.title);
        }
      }
    };
    initChat(); 

    // 👉 FIX 1: Removed { transports: ['websocket', 'polling'] } so it stops crashing!
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("joinAdmin");
    });

    socketRef.current.on("receiveMessage", (newMessage) => {
      fetchSessions();

      // 👉 FIX 2: Simplified update to instantly show the new message
      if (selectedUserRef.current && newMessage.userId === selectedUserRef.current._id) {
        setMessages((prev) => [...prev, newMessage]);
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

    // 👉 FIX 3: Clear text and let the server bounce the message back to prevent duplicates
    setInputText("");
    socketRef.current.emit("sendMessage", messageData);
    
    setTimeout(fetchSessions, 300);
  };

  const filteredSessions = sessions.filter(user => 
    (user.displayName || "Unknown User").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm mt-10">
              {searchTerm ? "No users found matching that name." : "No users found."}
            </div>
          ) : (
            filteredSessions.map((user) => (
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
                  Connected
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar">
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">
                    <p className="text-sm">No messages yet.</p>
                    <p className="text-xs mt-1">Send a message to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
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
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

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