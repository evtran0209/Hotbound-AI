import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Get the index
const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'hotbound-personas');

// Function to generate embeddings using OpenAI
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

// Function to store persona data in Pinecone
export async function storePersonaData(
  personaId: string,
  data: Record<string, any>,
  metadata: Record<string, any> = {}
) {
  try {
    // Prepare the text for embedding
    const textToEmbed = JSON.stringify(data);
    
    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);
    
    // Store in Pinecone
    await index.upsert([
      {
        id: personaId,
        values: embedding,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          type: 'persona',
        },
      },
    ]);
    
    return { success: true, personaId };
  } catch (error) {
    console.error('Error storing persona data in Pinecone:', error);
    throw new Error('Failed to store persona data');
  }
}

// Function to retrieve similar personas from Pinecone
export async function querySimilarPersonas(
  queryText: string,
  limit: number = 5,
  filter: Record<string, any> = {}
) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Query Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: filter,
    });
    
    return results.matches;
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error('Failed to query similar personas');
  }
}

// Function to retrieve a specific persona by ID
export async function getPersonaById(personaId: string) {
  try {
    const result = await index.fetch([personaId]);
    return result.records[personaId];
  } catch (error) {
    console.error('Error fetching persona from Pinecone:', error);
    throw new Error('Failed to fetch persona data');
  }
}

// Function to delete a persona
export async function deletePersona(personaId: string) {
  try {
    await index.deleteOne(personaId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting persona from Pinecone:', error);
    throw new Error('Failed to delete persona');
  }
} 