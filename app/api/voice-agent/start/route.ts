import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { persona } = await req.json();

    // Initialize Deepgram voice agent
    const response = await axios.post(
      "https://api.deepgram.com/v1/projects/43bf26be-a1c3-43b8-bb6a-539ae774cc20/agents",
      {
        name: "Sales Prospect Agent",
        description: "A voice agent simulating a sales prospect",
        knowledge: persona,
        capabilities: {
          realtime_transcription: true,
          voice_synthesis: true
        },
        system_prompt: `You are a sales prospect with the following background and personality: ${persona}. 
        You should act naturally, raise realistic objections, and ask probing questions about the product. 
        Be skeptical but professional, and make decisions based on your role and company needs.`,
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Store the agent ID in the session or temporary storage
    const agentId = response.data.agent_id;

    return NextResponse.json({
      success: true,
      agentId,
      wsUrl: response.data.websocket_url // URL for real-time communication
    });
  } catch (error) {
    console.error("Error starting voice agent:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to start voice agent",
        details: error.response?.data || error.message
      },
      { status: 500 }
    );
  }
}