// Test script for RAG components
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Test Perplexity API
async function testPerplexityAPI() {
  console.log('\n--- Testing Perplexity API ---');
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3-sonar-large-32k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides professional information. Return results in JSON format.'
          },
          {
            role: 'user',
            content: 'Provide information about a Director of Marketing at Acme Corp in the technology industry. Focus on: budget concerns, team management. Format as JSON.'
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        options: {
          search_enable: true,
          search_provider: 'perplexity'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Perplexity API test successful!');
    console.log('Sample response content:', response.data.choices[0].message.content.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('Perplexity API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Test OpenAI API
async function testOpenAIAPI() {
  console.log('\n--- Testing OpenAI API ---');
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Generate a brief system prompt for a sales call simulation with a Director of Marketing.'
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('OpenAI API test successful!');
    console.log('Sample response content:', response.data.choices[0].message.content.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.error('OpenAI API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Test OpenAI Embeddings API
async function testOpenAIEmbeddingsAPI() {
  console.log('\n--- Testing OpenAI Embeddings API ---');
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-3-small',
        input: 'Director of Marketing at Acme Corp in the technology industry'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('OpenAI Embeddings API test successful!');
    console.log('Embedding dimensions:', response.data.data[0].embedding.length);
    return true;
  } catch (error) {
    console.error('OpenAI Embeddings API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting RAG components tests...');
  
  const perplexityResult = await testPerplexityAPI();
  const openaiResult = await testOpenAIAPI();
  const embeddingsResult = await testOpenAIEmbeddingsAPI();
  
  console.log('\n--- Test Summary ---');
  console.log(`Perplexity API: ${perplexityResult ? 'PASSED' : 'FAILED'}`);
  console.log(`OpenAI API: ${openaiResult ? 'PASSED' : 'FAILED'}`);
  console.log(`OpenAI Embeddings API: ${embeddingsResult ? 'PASSED' : 'FAILED'}`);
  
  if (perplexityResult && openaiResult && embeddingsResult) {
    console.log('\nAll tests passed! Your RAG components are working correctly.');
  } else {
    console.log('\nSome tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests(); 