import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { queryPerplexity } from '@/app/utils/perplexityApi';
import { storePersonaData } from '@/app/utils/pineconeClient';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      linkedInUrl,
      jobTitle,
      companyName,
      industry,
      seniorityLevel,
      keywords,
    } = await request.json();

    // Validate required fields
    if ((!linkedInUrl && !jobTitle) || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique ID for this persona
    const personaId = uuidv4();

    // Step 1: Query Perplexity API to get enriched persona data
    const perplexityData = await queryPerplexity({
      linkedInUrl,
      jobTitle,
      companyName,
      industry,
      seniorityLevel,
      keywords,
    });

    // Step 2: Store the enriched data in Pinecone
    await storePersonaData(
      personaId,
      perplexityData,
      {
        linkedInUrl,
        jobTitle,
        companyName,
        industry,
        seniorityLevel,
        keywords: keywords.join(', '),
      }
    );

    // Step 3: Generate a system prompt for the persona simulation
    const systemPrompt = await generatePersonaSystemPrompt(
      perplexityData,
      {
        linkedInUrl,
        jobTitle,
        companyName,
        industry,
        seniorityLevel,
        keywords,
      }
    );

    // Return the persona data and system prompt
    return NextResponse.json({
      personaId,
      personaData: perplexityData,
      systemPrompt,
      metadata: {
        linkedInUrl,
        jobTitle,
        companyName,
        industry,
        seniorityLevel,
        keywords,
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}

async function generatePersonaSystemPrompt(
  personaData: any,
  metadata: {
    linkedInUrl?: string;
    jobTitle?: string;
    companyName?: string;
    industry?: string;
    seniorityLevel?: string;
    keywords?: string[];
  }
) {
  try {
    // Create a prompt for GPT-4 to generate a system prompt for the persona
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating realistic buyer personas for sales simulations. Your task is to create a detailed system prompt that will be used to simulate a buyer persona in a sales call scenario.'
        },
        {
          role: 'user',
          content: `Create a detailed system prompt for a sales call simulation where the AI will act as a buyer persona with the following characteristics:
          
Role: ${metadata.seniorityLevel} ${metadata.jobTitle} at ${metadata.companyName}
Industry: ${metadata.industry || 'Not specified'}
Keywords/Focus Areas: ${metadata.keywords?.join(', ') || 'Not specified'}

Here is additional information about the persona:
${JSON.stringify(personaData, null, 2)}

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

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating persona system prompt:', error);
    throw new Error('Failed to generate persona system prompt');
  }
} 