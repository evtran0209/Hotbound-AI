import { NextResponse } from "next/server";
import { fetchPerplexity, generatePersona } from "@/utils/apiHelpers";

export async function POST(req: Request) {
  try {
    const { searchInput, additionalInfo } = await req.json();

    // Get profile information from Perplexity
    const profileData = await fetchPerplexity(searchInput);

    // Generate detailed persona using OpenAI
    const persona = await generatePersona(profileData, additionalInfo);

    return NextResponse.json({
      success: true,
      profileData,
      persona
    });
  } catch (error) {
    console.error("Error in persona search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create persona" },
      { status: 500 }
    );
  }
}