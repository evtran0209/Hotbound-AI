'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LinkedInProfileInputProps {
  onProfileProcessed?: (profileData: any) => void;
}

export default function LinkedInProfileInput({ onProfileProcessed }: LinkedInProfileInputProps) {
  const [profileUrl, setProfileUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileUrl.includes('linkedin.com/')) {
      setError('Please enter a valid LinkedIn profile URL');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/linkedin-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process LinkedIn profile');
      }
      
      const data = await response.json();
      
      if (onProfileProcessed) {
        onProfileProcessed(data);
      } else {
        // Store the profile data in session storage for use in the call simulation
        sessionStorage.setItem('linkedinProfileData', JSON.stringify(data));
        router.push('/call-simulation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">LinkedIn Profile Simulation</h2>
      <p className="mb-4 text-gray-600">
        Enter a LinkedIn profile URL to generate a personalized call simulation based on the profile information.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn Profile URL
          </label>
          <input
            type="url"
            id="profileUrl"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Processing...' : 'Generate Call Simulation'}
        </button>
      </form>
    </div>
  );
} 