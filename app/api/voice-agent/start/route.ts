import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { getPersonaById } from '@/app/utils/pineconeClient';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active sessions
const activeSessions = new Map();

export async function POST(request: NextRequest) {
  try {
    const { personaId, profileData, simulationType, systemPrompt } = await request.json();

    // Generate a unique session ID
    const sessionId = uuidv4();

    let finalSystemPrompt = '';

    if (systemPrompt) {
      // If a system prompt is provided directly, use it
      finalSystemPrompt = systemPrompt;
    } else if (personaId) {
      // If a persona ID is provided, retrieve the persona from Pinecone
      const personaRecord = await getPersonaById(personaId);
      
      if (!personaRecord) {
        return NextResponse.json(
          { error: 'Persona not found' },
          { status: 404 }
        );
      }
      
      // Use the system prompt from the persona record
      finalSystemPrompt = personaRecord.metadata.systemPrompt || 
        `You are simulating a buyer persona based on the following information: ${JSON.stringify(personaRecord.metadata)}`;
    } else if (profileData && simulationType === 'linkedin') {
      // For LinkedIn profile data, generate a system prompt
      finalSystemPrompt = await generateLinkedInPersonaPrompt(profileData);
    } else {
      return NextResponse.json(
        { error: 'Invalid request: missing persona information' },
        { status: 400 }
      );
    }

    // Initialize the conversation with OpenAI
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'assistant', content: 'Hello, this is ' + (profileData?.fullName || 'your prospect') + '. How can I help you today?' }
    ];

    // Store the session
    activeSessions.set(sessionId, {
      messages,
      lastActivity: Date.now(),
      personaId,
      profileData,
    });

    return NextResponse.json({
      sessionId,
      initialMessage: messages[1].content,
    });
  } catch (error) {
    console.error('Error starting voice agent:', error);
    return NextResponse.json(
      { error: 'Failed to start voice agent' },
      { status: 500 }
    );
  }
}

async function generateLinkedInPersonaPrompt(profileData: any) {
  try {
    // Generate a system prompt for the LinkedIn profile
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating realistic buyer personas for sales simulations. Your task is to create a detailed system prompt that will be used to simulate a buyer persona in a sales call scenario.'
        },
        {
          role: 'user',
          content: `Create a detailed system prompt for a sales call simulation where the AI will act as a buyer persona based on this LinkedIn profile data:
          
${JSON.stringify(profileData, null, 2)}

The system prompt should:
1. Instruct the AI to behave realistically as this specific buyer persona
2. Include personality traits, communication style, and decision-making factors
3. Incorporate knowledge about their company, industry challenges, and pain points
4. Define how they would typically respond to sales pitches
5. Include specific objections or concerns they might raise
6. Specify their budget sensitivity and decision-making authority

Format the prompt as a direct instruction to the AI, starting with "You are simulating a buyer persona..."`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating LinkedIn persona prompt:', error);
    throw new Error('Failed to generate persona prompt');
  }
}