import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { callTranscript } = await req.json();

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert sales coach analyzing sales call transcripts. 
            Provide detailed, constructive feedback focusing on:
            1. Opening and rapport building
            2. Discovery questions and listening skills
            3. Value proposition presentation
            4. Objection handling
            5. Next steps and call control
            Be specific with examples from the transcript and provide actionable improvements.`
          },
          {
            role: "user",
            content: `Please analyze this sales call transcript and provide detailed feedback:\n\n${callTranscript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json({
      success: true,
      feedback: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error("Error generating feedback:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate feedback",
        details: error.response?.data || error.message
      },
      { status: 500 }
    );
  }
}