import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchChatHistory, sendChatMessage, addMessage } from '../chatSlice';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage } from '../../../api/chatApi';
import socketService from '../../../services/socketService';
import type { RootState } from '../../../app/store';

interface ChatWindowProps {
  sessionId: string;
  currentUserId: string;
  isSocketConnected: boolean; 
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, currentUserId, isSocketConnected }) => {
  const dispatch = useAppDispatch();
  const { messages, loading } = useAppSelector((state: RootState) => state.chat);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchChatHistory(sessionId));
  }, [sessionId, dispatch]);

  useEffect(() => {
    
    if (!isSocketConnected) return;

    const socket = socketService.getSocket();
    if (!socket) return;
    
    console.log('💬 [ChatWindow] Socket connected, attaching listeners');

    const handleNewMessage = (message: ChatMessage) => {
      console.log('📩 [ChatWindow] Received new_message socket event:', message);
      dispatch(addMessage(message));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('system_message', handleNewMessage);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [ChatWindow] Listeners active for session: ${sessionId}`);
    }

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('system_message', handleNewMessage);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔇 [ChatWindow] Listeners removed for session: ${sessionId}`);
      }
    };
  }, [dispatch, isSocketConnected, sessionId]); // Re-run when connection status changes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 [ChatWindow] Sending message:', content);
    }
    setInputText('');
    
    await dispatch(sendChatMessage({ sessionId, content }));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A80]"></div>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <MessageItem 
              key={msg._id} 
              message={msg} 
              isOwnMessage={msg.senderId === currentUserId} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3CB4B4]/50 text-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-[#1A1A80] text-white rounded-xl hover:bg-[#121260] disabled:opacity-50 transition-all shadow-md shadow-[#1A1A80]/20"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

const MessageItem: React.FC<{ message: ChatMessage; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
          isOwnMessage 
            ? 'bg-[#1A1A80] text-white rounded-tr-none' 
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}>
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {message.createdAt ? format(new Date(message.createdAt), 'p') : ''}
        </span>
      </div>
    </div>
  );
};
