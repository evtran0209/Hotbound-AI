import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { profileUrl } = await request.json();

    if (!profileUrl || !profileUrl.includes('linkedin.com/')) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn profile URL' },
        { status: 400 }
      );
    }

    // In a production environment, you would use a proper LinkedIn API or scraping solution
    // For this demo, we'll simulate profile extraction with AI
    const profileData = await extractProfileDataWithAI(profileUrl);

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error processing LinkedIn profile:', error);
    return NextResponse.json(
      { error: 'Failed to process LinkedIn profile' },
      { status: 500 }
    );
  }
}

async function extractProfileDataWithAI(profileUrl: string) {
  // Extract username from URL
  const urlParts = profileUrl.split('/');
  const username = urlParts[urlParts.indexOf('in') + 1]?.split('?')[0] || '';

  // Use OpenAI to generate simulated profile data based on the username
  // In a real application, you would extract actual data from LinkedIn
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates realistic professional profile data based on LinkedIn usernames. Create detailed but fictional profile data that would be useful for a sales call simulation."
      },
      {
        role: "user",
        content: `Generate realistic professional profile data for a LinkedIn user with the username "${username}". Include: full name, job title, company, industry, skills, experience (with years), education, recent posts or activities, and potential pain points or business needs. Format as JSON.`
      }
    ],
    response_format: { type: "json_object" }
  });

  // Parse the response
  const responseContent = completion.choices[0].message.content;
  
  try {
    // Parse the JSON response
    const profileData = JSON.parse(responseContent || '{}');
    
    // Add metadata
    return {
      ...profileData,
      source: 'ai_generated',
      profileUrl,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse profile data');
  }
} 