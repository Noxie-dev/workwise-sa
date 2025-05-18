import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to safely extract text from Claude's response
function extractTextFromClaudeResponse(content: any[]): string {
  if (!content || content.length === 0) {
    return "No content generated";
  }
  
  const firstBlock = content[0];
  if (typeof firstBlock === 'object' && firstBlock !== null && 'type' in firstBlock) {
    if (firstBlock.type === 'text' && 'text' in firstBlock) {
      return firstBlock.text;
    }
  }
  
  // Fallback for when the structure is different than expected
  return JSON.stringify(content);
}

/**
 * Generate a professional summary for a CV/resume using Anthropic Claude
 */
export async function generateProfessionalSummaryWithClaude(data: any): Promise<string> {
  try {
    const { name, skills, experience, education, language = 'English' } = data;
    
    // Create a prompt for Claude to generate a professional summary
    const prompt = `Generate a professional and concise CV summary for ${name} in ${language} language. 
    
Their skills include: ${skills.join(', ')}. 

Their most recent work experience is: ${experience[0]?.jobTitle || 'N/A'} at ${experience[0]?.employer || 'N/A'}.

Their highest education is: ${education[0]?.degree || 'N/A'} from ${education[0]?.school || 'N/A'}.

The summary should be professional, highlight their skills and experience, and be appropriate for a job application. 
Keep it between 100-150 words and focus on their strengths and potential contribution to employers.
Write in first person ("I am...").`;

    const message = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    return extractTextFromClaudeResponse(message.content);
  } catch (error) {
    console.error("Error generating professional summary with Claude:", error);
    return "Unable to generate a professional summary. Please try again or write your own summary.";
  }
}

/**
 * Generate a job description for CV/resume using Anthropic Claude
 */
export async function generateJobDescriptionWithClaude(jobInfo: any, language: string = 'English'): Promise<string> {
  try {
    const { jobTitle, employer, description } = jobInfo;
    
    // Create a prompt for Claude to generate a job description
    const prompt = `Generate a professional and concise job description for a CV/resume in ${language} language, for the position of ${jobTitle} at ${employer}.
    
Here's some context about the job: ${description || 'No specific details provided.'}

The description should:
- Be written in first person ("I...")
- Use action verbs
- Highlight responsibilities and achievements
- Be 3-4 bullet points or a paragraph of 2-3 sentences
- Be professional and appropriate for a CV
- Focus on skills and experiences that would be valuable to future employers`;

    const message = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    return extractTextFromClaudeResponse(message.content);
  } catch (error) {
    console.error("Error generating job description with Claude:", error);
    return "Unable to generate a job description. Please try again or write your own description.";
  }
}

/**
 * Translate text using Anthropic Claude
 */
export async function translateTextWithClaude(text: string, targetLanguage: string): Promise<string> {
  try {
    if (!text || text.trim() === '') {
      return '';
    }
    
    // Create a prompt for translation with Claude
    const prompt = `Translate the following text into ${targetLanguage} language. Maintain the professional tone and meaning:
    
${text}

The translation should sound natural and professional in ${targetLanguage}.`;

    const message = await anthropic.messages.create({
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-7-sonnet-20250219',
    });

    return extractTextFromClaudeResponse(message.content);
  } catch (error) {
    console.error(`Error translating text to ${targetLanguage} with Claude:`, error);
    return text; // Return original text if translation fails
  }
}

/**
 * Analyze image in a CV context
 */
export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this profile photo for a CV/resume. Comment on the professional appearance, background, lighting, and any suggestions for improvements to make it more suitable for a professional CV."
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });

    return extractTextFromClaudeResponse(response.content);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Unable to analyze the image. Please try again later.";
  }
}