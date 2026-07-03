import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Analyze text using AI (e.g., email content, customer message)
 */
export const analyzeContent = async (content, purpose = 'general') => {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured. Returning placeholder response.');
    return {
      analysis: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      purpose,
      placeholder: true
    };
  }
  
  try {
    const prompts = {
      general: `Analyze the following content and provide a summary with key points and sentiment.`,
      email: `Analyze this email and extract: 1) Main purpose, 2) Sentiment, 3) Required action, 4) Priority level.`,
      customer_inquiry: `Analyze this customer message and provide: 1) Issue category, 2) Urgency, 3) Suggested response approach.`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompts[purpose] || prompts.general
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      success: true,
      analysis: response.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze content with AI');
  }
};

/**
 * Generate automated response using AI
 */
export const generateResponse = async (context, tone = 'professional') => {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured. Returning placeholder response.');
    return {
      reply: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      placeholder: true
    };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant generating ${tone} responses. Be concise and actionable.`
        },
        {
          role: 'user',
          content: `Generate a response for the following context: ${context}`
        }
      ],
      temperature: 0.8,
      max_tokens: 300
    });

    return {
      success: true,
      response: response.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate response with AI');
  }
};

/**
 * Extract structured data from text using AI
 */
export const extractData = async (content, extractionType = 'contact') => {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured. Returning placeholder response.');
    return {
      extracted: {},
      message: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      placeholder: true
    };
  }
  
  try {
    const prompts = {
      contact: 'Extract contact information (name, email, phone) from the text. Return as JSON.',
      lead: 'Extract lead information (name, company, email, interest) from the text. Return as JSON.',
      task: 'Extract actionable tasks from the text. Return as JSON array.',
      meeting: 'Extract meeting details (date, time, attendees, agenda) from the text. Return as JSON.'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompts[dataType] || prompts.general
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return {
      success: true,
      data: JSON.parse(response.choices[0].message.content)
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to extract data with AI');
  }
};

/**
 * Summarize long content using AI
 */
export const summarizeContent = async (content, maxLength = 200) => {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured. Returning placeholder response.');
    return {
      summary: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      placeholder: true
    };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Summarize the following content in approximately ${maxLength} words. Focus on key points and actionable insights.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.5,
      max_tokens: Math.ceil(maxLength * 1.5)
    });

    return {
      success: true,
      summary: response.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to summarize content with AI');
  }
};

export default {
  analyzeContent,
  generateResponse,
  extractData,
  summarizeContent
};
