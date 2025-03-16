"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PersonaInputForm from "../components/PersonaInputForm";

export default function PersonaCreationPage() {
  const [isCreated, setIsCreated] = useState(false);
  const [personaData, setPersonaData] = useState<any>(null);
  const router = useRouter();

  const handlePersonaCreated = (data: any) => {
    setPersonaData(data);
    setIsCreated(true);
    
    // Store the persona data in session storage
    sessionStorage.setItem("currentPersona", JSON.stringify(data));
    
    // Redirect to call simulation after a short delay
    setTimeout(() => {
      router.push("/call-simulation");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create a Buyer Persona
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Generate a realistic buyer persona for your sales call simulation
          </p>
        </div>
        
        {isCreated ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Persona Created Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your buyer persona has been created and is ready for simulation.
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Redirecting to call simulation...
            </p>
            <button
              onClick={() => router.push("/call-simulation")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Call Simulation
            </button>
          </div>
        ) : (
          <>
            <PersonaInputForm onPersonaCreated={handlePersonaCreated} />
            
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">How it works</h2>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>
                    1. Enter details about the buyer persona you want to simulate<br />
                    2. Our AI will enrich the profile with data from LinkedIn and the web<br />
                    3. A realistic buyer persona will be generated based on your inputs<br />
                    4. Practice your sales pitch with the AI-powered voice agent
                  </p>
                </div>
                <div className="mt-5">
                  <p className="text-xs text-gray-500">
                    Note: The more information you provide, the more realistic and detailed the persona will be.
                    Including a LinkedIn URL will significantly enhance the quality of the simulation.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}