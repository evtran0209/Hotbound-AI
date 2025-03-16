import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Access the active sessions map (shared with start/route.ts and message/route.ts)
declare global {
  var activeSessions: Map<string, {
    messages: Array<{ role: string; content: string }>;
    lastActivity: number;
    personaId?: string;
    profileData?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    // Validate request
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Get the session
    const session = global.activeSessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Generate feedback based on the conversation
    const feedback = await generateFeedback(session.messages);

    // Clean up the session
    global.activeSessions.delete(sessionId);

    return NextResponse.json({
      success: true,
      feedback,
      conversationSummary: {
        messageCount: session.messages.length,
        duration: Math.floor((Date.now() - session.lastActivity) / 1000),
      }
    });
  } catch (error) {
    console.error('Error ending voice agent session:', error);
    return NextResponse.json(
      { error: 'Failed to end voice agent session' },
      { status: 500 }
    );
  }
}

async function generateFeedback(messages: Array<{ role: string; content: string }>) {
  try {
    // Extract the conversation transcript
    const transcript = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => `${msg.role === 'user' ? 'Salesperson' : 'Prospect'}: ${msg.content}`)
      .join('\n\n');

    // Generate feedback using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales coach. Analyze the following sales call transcript and provide constructive feedback to the salesperson. 
          Focus on:
          1. Effectiveness of questioning techniques
          2. Handling of objections
          3. Value proposition clarity
          4. Active listening skills
          5. Next steps and follow-up suggestions
          
          Provide specific examples from the conversation and actionable advice for improvement.`
        },
        {
          role: 'user',
          content: `Here is the transcript of a sales call. Please provide detailed feedback:
          
${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content || 'No feedback available';
  } catch (error) {
    console.error('Error generating feedback:', error);
    return 'Unable to generate feedback due to an error.';
  }
}