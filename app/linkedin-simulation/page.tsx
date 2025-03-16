'use client';

import LinkedInProfileInput from '../components/LinkedInProfileInput';

export default function LinkedInSimulationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            LinkedIn Profile Call Simulation
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Generate a personalized call simulation based on a LinkedIn profile
          </p>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <LinkedInProfileInput />
          </div>
        </div>
        
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">How it works</h2>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                1. Enter a LinkedIn profile URL<br />
                2. Our AI will analyze the profile and extract relevant information<br />
                3. A personalized call simulation will be generated based on the profile<br />
                4. Practice your sales pitch with the AI-powered voice agent
              </p>
            </div>
            <div className="mt-5">
              <p className="text-xs text-gray-500">
                Note: This is a simulation tool and does not access actual LinkedIn data directly.
                The AI generates realistic but fictional profile information based on the username.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 