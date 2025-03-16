import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Access the active sessions map (shared with start/route.ts)
declare global {
  var activeSessions: Map<string, {
    messages: Array<{ role: string; content: string }>;
    lastActivity: number;
    personaId?: string;
    profileData?: any;
  }>;
}

// Initialize global sessions if not exists
if (!global.activeSessions) {
  global.activeSessions = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, isVoice } = await request.json();

    // Validate request
    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Update last activity timestamp
    session.lastActivity = Date.now();

    // Add user message to conversation history
    session.messages.push({ role: 'user', content: message });

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: session.messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    // Prepare the response
    const stream = new ReadableStream({
      async start(controller) {
        let responseText = '';

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            responseText += content;
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
              type: 'chunk', 
              content 
            }) + '\n'));
          }
        }

        // Add the complete response to the conversation history
        session.messages.push({ role: 'assistant', content: responseText });
        
        // Send the end of stream marker
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
          type: 'done', 
          content: responseText 
        }) + '\n'));
        
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 