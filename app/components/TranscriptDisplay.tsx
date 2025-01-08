"use client";

import { useEffect, useRef } from 'react';

interface Message {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: number;
}

interface TranscriptDisplayProps {
  messages: Message[];
}

export default function TranscriptDisplay({ messages }: TranscriptDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto"
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-2 p-2 rounded-lg ${
            message.speaker === 'user'
              ? 'bg-blue-100 ml-8'
              : 'bg-gray-200 mr-8'
          }`}
        >
          <div className="text-xs text-gray-500 mb-1">
            {message.speaker === 'user' ? 'You' : 'Prospect'} • {
              new Date(message.timestamp).toLocaleTimeString()
            }
          </div>
          <div className="text-sm">{message.text}</div>
        </div>
      ))}
    </div>
  );
}