'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PersonaInputFormProps {
  onPersonaCreated?: (personaData: any) => void;
}

export default function PersonaInputForm({ onPersonaCreated }: PersonaInputFormProps) {
  const [formData, setFormData] = useState({
    linkedInUrl: '',
    jobTitle: '',
    companyName: '',
    industry: '',
    seniorityLevel: 'Mid-level',
    keywords: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.linkedInUrl && !formData.jobTitle) {
      setError('Please provide either a LinkedIn URL or a job title');
      return;
    }

    if (!formData.companyName) {
      setError('Company name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Process keywords into an array
      const keywordsArray = formData.keywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);

      // Prepare data for API
      const personaData = {
        ...formData,
        keywords: keywordsArray,
      };

      // Send to API
      const response = await fetch('/api/create-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create persona');
      }
      
      const data = await response.json();
      
      if (onPersonaCreated) {
        onPersonaCreated(data);
      } else {
        // Store the persona data in session storage
        sessionStorage.setItem('currentPersona', JSON.stringify(data));
        router.push('/call-simulation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Persona for Simulation</h2>
      <p className="mb-6 text-gray-600">
        Enter details about the buyer persona you want to simulate. The more information you provide, the more realistic the simulation will be.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="linkedInUrl" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL (Optional but recommended)
          </label>
          <input
            type="url"
            id="linkedInUrl"
            name="linkedInUrl"
            value={formData.linkedInUrl}
            onChange={handleChange}
            placeholder="https://www.linkedin.com/in/username"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            If provided, we'll extract information from this profile to create a more realistic persona.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title / Role *
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g., Director of Marketing"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!formData.linkedInUrl}
            />
          </div>
          
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g., Acme Corporation"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g., Healthcare, Technology, Finance"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="seniorityLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Seniority Level
            </label>
            <select
              id="seniorityLevel"
              name="seniorityLevel"
              value={formData.seniorityLevel}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Manager">Manager</option>
              <option value="Director">Director</option>
              <option value="VP">VP</option>
              <option value="C-Suite">C-Suite (CXO)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
            Keywords (comma-separated)
          </label>
          <textarea
            id="keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="e.g., compliance, AI budget, vendor lock-in, team reorg"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
          />
          <p className="mt-1 text-xs text-gray-500">
            Add specific topics, pain points, or interests that should be incorporated into the persona.
          </p>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Creating Persona...' : 'Create Persona & Start Simulation'}
        </button>
      </form>
    </div>
  );
} 