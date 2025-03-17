"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { WebSocketConnection } from "@/utils/websocketHelper";
import AudioVisualizer from '@/components/AudioVisualizer';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import VolumeControl from '@/components/VolumeControl';
import { WebSocketManager } from '@/utils/WebSocketManager';
import { SpeechProcessor } from '@/utils/SpeechProcessor';
import { CallRecorder } from '@/utils/CallRecorder';
import FeedbackDisplay from '@/components/FeedbackDisplay';

interface Persona {
  profileData: string;
  persona: string;
}

interface Message {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export default function CallSimulation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCallActive, setIsCallActive] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const wsConnectionRef = useRef<WebSocketConnection | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const speechProcessorRef = useRef<SpeechProcessor | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const callRecorderRef = useRef<CallRecorder | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const storedPersona = localStorage.getItem("currentPersona");
    if (storedPersona) {
      setPersona(JSON.parse(storedPersona));
    } else {
      router.push("/persona-search");
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (wsConnectionRef.current) {
        wsConnectionRef.current.disconnect();
      }
    };
  }, [session, status, router]);

  const startCall = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/voice-agent/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ persona: persona?.persona }),
      });

      if (!response.ok) {
        throw new Error("Failed to start call");
      }

      const { wsUrl, agentId } = await response.json();
      localStorage.setItem("currentAgentId", agentId);

      // Initialize speech processor
      speechProcessorRef.current = new SpeechProcessor(
        (text) => {
          setMessages(prev => [...prev, {
            speaker: 'user',
            text,
            timestamp: Date.now()
          }]);
        },
        (audioData) => {
          wsManagerRef.current?.send(audioData);
        }
      );

      const stream = await speechProcessorRef.current.initialize();
      setAudioStream(stream);

      // Initialize WebSocket manager
      wsManagerRef.current = new WebSocketManager(
        wsUrl,
        handleWebSocketMessage,
        setConnectionStatus
      );
      await wsManagerRef.current.connect();

      // Initialize call recorder
      callRecorderRef.current = new CallRecorder();
      await callRecorderRef.current.startRecording(stream);

      setIsCallActive(true);
    } catch (error) {
      setError("Failed to start call. Please try again.");
      console.error("Call start error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    setIsLoading(true);
    try {
      // Stop recording and get the recording blob
      if (callRecorderRef.current) {
        const recordingBlob = await callRecorderRef.current.stopRecording();
        const url = URL.createObjectURL(recordingBlob);
        setRecordingUrl(url);
      }

      const agentId = localStorage.getItem("currentAgentId");
      
      if (wsConnectionRef.current) {
        wsConnectionRef.current.disconnect();
      }

      const response = await fetch("/api/voice-agent/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to end call");
      }

      const { transcript } = await response.json();
      setIsCallActive(false);
      
      // Generate feedback using the transcript
      await generateFeedback(transcript);

      setShowFeedback(true);
    } catch (error) {
      setError("Failed to end call. Please try again.");
      console.error("Call end error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFeedback = async (callTranscript: string) => {
    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ callTranscript }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate feedback");
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      setError("Failed to generate feedback. Please try again.");
      console.error("Feedback generation error:", error);
    }
  };

  const handleWebSocketMessage = (event: MessageEvent) => {
    const response = JSON.parse(event.data);
    if (response.type === 'transcript') {
      setMessages(prev => [...prev, {
        speaker: 'agent',
        text: response.text,
        timestamp: Date.now()
      }]);
    }
  };

  useEffect(() => {
    return () => {
      speechProcessorRef.current?.stop();
      wsManagerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  if (status === "loading" || !persona) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Sales Call Simulation</h1>
        
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Prospect Profile</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{persona.persona}</pre>
          </div>
        </div>

        <div className="flex flex-col items-