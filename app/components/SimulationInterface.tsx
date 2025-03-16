'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioProcessor } from '../utils/deepgramClient';
import AudioVisualizer from './AudioVisualizer';
import TranscriptDisplay from './TranscriptDisplay';
import VolumeControl from './VolumeControl';

interface SimulationInterfaceProps {
  sessionId: string;
  initialMessage?: string;
  onEndCall: () => void;
}

export default function SimulationInterface({
  sessionId,
  initialMessage,
  onEndCall,
}: SimulationInterfaceProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize with the initial message if provided
  useEffect(() => {
    if (initialMessage) {
      setTranscript([`Prospect: ${initialMessage}`]);
    }
  }, [initialMessage]);

  // Handle voice input
  const startVoiceInput = async () => {
    if (!isVoiceMode || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Initialize audio processor
      audioProcessorRef.current = new AudioProcessor((text) => {
        if (text.trim()) {
          handleUserInput(text);
        }
      });
      
      await audioProcessorRef.current.initialize();
      setIsProcessing(false);
    } catch (error) {
      console.error('Error initializing voice input:', error);
      setIsProcessing(false);
      setIsVoiceMode(false); // Fall back to text mode
    }
  };

  // Stop voice input
  const stopVoiceInput = () => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }
  };

  // Toggle voice mode
  const toggleVoiceMode = () => {
    const newMode = !isVoiceMode;
    setIsVoiceMode(newMode);
    
    if (!newMode) {
      stopVoiceInput();
    }
  };

  // Start the call
  const startCall = async () => {
    setIsCallActive(true);
    
    if (isVoiceMode) {
      await startVoiceInput();
    }
  };

  // End the call
  const handleEndCall = async () => {
    setIsCallActive(false);
    stopVoiceInput();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    onEndCall();
  };

  // Handle user input (text or voice)
  const handleUserInput = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    // Add user message to transcript
    setTranscript(prev => [...prev, `You: ${text}`]);
    setInputMessage('');
    setIsStreaming(true);
    
    try {
      // Send message to API
      const response = await fetch('/api/voice-agent/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: text,
          isVoice: isVoiceMode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      
      let responseText = '';
      let decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'chunk') {
              responseText += data.content;
              setTranscript(prev => {
                const newTranscript = [...prev];
                const lastIndex = newTranscript.length - 1;
                
                // If the last message is from the assistant, update it
                if (lastIndex >= 0 && newTranscript[lastIndex].startsWith('Prospect:')) {
                  newTranscript[lastIndex] = `Prospect: ${responseText}`;
                } else {
                  // Otherwise add a new message
                  newTranscript.push(`Prospect: ${responseText}`);
                }
                
                return newTranscript;
              });
            } else if (data.type === 'done') {
              // Play audio if in voice mode
              if (isVoiceMode && data.content) {
                playResponseAudio(data.content);
              }
            }
          } catch (error) {
            console.error('Error parsing streaming response:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle text input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleUserInput(inputMessage);
    }
  };

  // Play response audio
  const playResponseAudio = async (text: string) => {
    try {
      // Get audio from text-to-speech API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }
      
      audioElementRef.current.src = audioUrl;
      audioElementRef.current.volume = volume;
      await audioElementRef.current.play();
      
      // Clean up URL object after playing
      audioElementRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error playing response audio:', error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVoiceInput();
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          {isCallActive ? 'Call in Progress' : 'Start Call'}
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleVoiceMode}
            className={`p-2 rounded-full ${
              isVoiceMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={isVoiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
          >
            {isVoiceMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <VolumeControl volume={volume} onChange={setVolume} />
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <AudioVisualizer isActive={isCallActive && isVoiceMode} />
        </div>
        
        <div className="mb-4 h-64 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
          <TranscriptDisplay messages={transcript} />
        </div>
        
        {isCallActive ? (
          <div className="space-y-4">
            {!isVoiceMode && (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={isStreaming || !inputMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                End Call
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={startCall}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Start Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 