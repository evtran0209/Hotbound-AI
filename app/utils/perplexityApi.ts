import axios from 'axios';

interface PerplexityQueryParams {
  linkedInUrl?: string;
  jobTitle?: string;
  companyName?: string;
  industry?: string;
  seniorityLevel?: string;
  keywords?: string[];
}

export async function queryPerplexity({
  linkedInUrl,
  jobTitle,
  companyName,
  industry,
  seniorityLevel,
  keywords
}: PerplexityQueryParams) {
  try {
    // Construct the query based on available parameters
    let query = '';
    
    if (linkedInUrl) {
      // Primary query using LinkedIn profile
      query += `Extract detailed professional information from this LinkedIn profile: ${linkedInUrl}. `;
    }
    
    // Add additional context from other parameters
    query += `Provide comprehensive information about a ${seniorityLevel || ''} ${jobTitle || ''} `;
    query += `at ${companyName || ''} in the ${industry || ''} industry. `;
    
    // Add keywords for specific focus areas
    if (keywords && keywords.length > 0) {
      query += `Focus on these specific areas: ${keywords.join(', ')}. `;
    }
    
    // Add instructions for the type of information we want
    query += `Include: professional background, company context, industry challenges, recent news, ` +
             `thought leadership, behavioral traits, decision-making factors, and potential pain points. ` +
             `Format the response as structured JSON.`;

    // Make the API call to Perplexity
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3-sonar-large-32k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides comprehensive professional information by searching the web and LinkedIn profiles. Return results in JSON format.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        options: {
          search_enable: true,
          search_provider: 'perplexity'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the response
    const content = response.data.choices[0].message.content;
    let jsonData;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON format is found, parse the whole content
        jsonData = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      // Return the raw content if parsing fails
      return { rawContent: content };
    }

    return jsonData;
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    throw new Error('Failed to retrieve information from Perplexity');
  }
} 