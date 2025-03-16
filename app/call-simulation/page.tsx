"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SimulationInterface from '../components/SimulationInterface';
import FeedbackDisplay from '../components/FeedbackDisplay';
import PersonaInputForm from '../components/PersonaInputForm';
import LinkedInProfileInput from '../components/LinkedInProfileInput';

interface PersonaData {
  personaId: string;
  personaData: any;
  systemPrompt: string;
  metadata: {
    linkedInUrl?: string;
    jobTitle?: string;
    companyName?: string;
    industry?: string;
    seniorityLevel?: string;
    keywords?: string[];
    createdAt: string;
  };
}

export default function CallSimulationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'persona' | 'linkedin' | 'simulation'>('persona');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if we have persona data in session storage
    const storedPersona = sessionStorage.getItem('currentPersona');
    if (storedPersona) {
      try {
        const parsedData = JSON.parse(storedPersona);
        setPersonaData(parsedData);
        setInputMode('simulation');
        startSimulation(parsedData);
      } catch (error) {
        console.error('Error parsing stored persona data:', error);
      }
    }

    // Check if we have LinkedIn profile data in session storage
    const storedLinkedInData = sessionStorage.getItem('linkedinProfileData');
    if (storedLinkedInData && !storedPersona) {
      try {
        const parsedData = JSON.parse(storedLinkedInData);
        handleLinkedInProfileProcessed(parsedData);
      } catch (error) {
        console.error('Error parsing stored LinkedIn data:', error);
      }
    }
  }, [session, status, router]);

  const handlePersonaCreated = (data: PersonaData) => {
    setPersonaData(data);
    sessionStorage.setItem('currentPersona', JSON.stringify(data));
    setInputMode('simulation');
    startSimulation(data);
  };

  const handleLinkedInProfileProcessed = (data: any) => {
    setInputMode('simulation');
    startSimulation({ profileData: data, simulationType: 'linkedin' });
  };

  const startSimulation = async (data: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Start the voice agent session
      const response = await fetch('/api/voice-agent/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start simulation');
      }
      
      const responseData = await response.json();
      setSessionId(responseData.sessionId);
      setInitialMessage(responseData.initialMessage);
      setInputMode('simulation');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error starting simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    
    try {
      // End the voice agent session
      const response = await fetch('/api/voice-agent/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to end simulation');
      }
      
      const data = await response.json();
      setFeedback(data.feedback);
      
      // Clear session data
      setSessionId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error ending simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = () => {
    setPersonaData(null);
    setSessionId(null);
    setInitialMessage(null);
    setFeedback(null);
    setInputMode('persona');
    
    // Clear session storage
    sessionStorage.removeItem('currentPersona');
    sessionStorage.removeItem('linkedinProfileData');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Sales Call Simulation
          </h1>
          <p className="mt-2 text-xl text-gray-500">
            Practice your sales pitch with AI-powered buyer personas
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {inputMode === 'persona' && (
          <div className="mb-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Choose Input Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => setInputMode('persona')}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Create Custom Persona</h3>
                  <p className="text-gray-500">
                    Build a detailed buyer persona by providing job title, company, industry, and keywords.
                  </p>
                </div>
                <div 
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => setInputMode('linkedin')}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Use LinkedIn Profile</h3>
                  <p className="text-gray-500">
                    Generate a persona based on a LinkedIn profile URL.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <PersonaInputForm onPersonaCreated={handlePersonaCreated} />
            </div>
          </div>
        )}
        
        {inputMode === 'linkedin' && (
          <div className="mb-6">
            <LinkedInProfileInput onProfileProcessed={handleLinkedInProfileProcessed} />
            <div className="mt-4 text-center">
              <button
                onClick={() => setInputMode('persona')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to persona creation
              </button>
            </div>
          </div>
        )}
        
        {inputMode === 'simulation' && sessionId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Persona Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Buyer Persona</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                {personaData && (
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Name/Role</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {personaData.metadata?.jobTitle || 'Buyer Persona'}
                      </dd>
                    </div>
                    <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Company</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {personaData.metadata?.companyName || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Industry</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {personaData.metadata?.industry || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Focus Areas</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {personaData.metadata?.keywords?.join(', ') || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
            
            {/* Simulation Interface */}
            <div className="lg:col-span-2">
              <SimulationInterface
                sessionId={sessionId}
                initialMessage={initialMessage || undefined}
                onEndCall={handleEndCall}
              />
              
              {feedback && (
                <div className="mt-6">
                  <FeedbackDisplay feedback={feedback} />
                  <div className="mt-4 text-center">
                    <button
                      onClick={resetSimulation}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Start New Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}