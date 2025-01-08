import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      throw new Error("Agent ID is required");
    }

    // End the Deepgram voice agent session
    await axios.delete(
      `https://api.deepgram.com/v1/projects/43bf26be-a1c3-43b8-bb6a-539ae774cc20/agents/${agentId}`,
      {
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Get the call transcript if available
    const transcriptResponse = await axios.get(
      `https://api.deepgram.com/v1/projects/43bf26be-a1c3-43b8-bb6a-539ae774cc20/agents/${agentId}/transcript`,
      {
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json({
      success: true,
      transcript: transcriptResponse.data.transcript
    });
  } catch (error) {
    console.error("Error ending voice agent:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to end voice agent",
        details: error.response?.data || error.message
      },
      { status: 500 }
    );
  }
}