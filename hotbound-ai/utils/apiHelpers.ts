import axios from "axios";

export async function fetchPerplexity(searchQuery: string) {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "pplx-7b-online",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that searches for professional information. 
            When given a person's name, position, and company, find their LinkedIn profile and 
            extract key professional details including: current role, company, experience, 
            education, and any relevant background that would be useful for a sales conversation.`
          },
          {
            role: "user",
            content: `Search for and provide detailed professional information about: ${searchQuery}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error in Perplexity API call:", error);
    throw new Error("Failed to fetch profile information");
  }
}

export async function generatePersona(profileData: string, additionalInfo: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI that creates realistic sales prospect personas. 
            Based on LinkedIn profile data and additional context, create a detailed 
            persona including: personality traits, communication style, typical objections, 
            pain points, and decision-making factors. Make it realistic and nuanced.`
          },
          {
            role: "user",
            content: `Create a sales prospect persona based on this profile:\n${profileData}\n\nAdditional context:\n${additionalInfo}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    throw new Error("Failed to generate persona");
  }
}