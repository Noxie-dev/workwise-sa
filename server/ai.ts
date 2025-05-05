import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Use the Gemini Pro model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Generate a professional summary for a CV/resume
 */
export async function generateProfessionalSummary(data: any): Promise<string> {
  try {
    const { name, skills, experience, education, language = 'English' } = data;
    
    // Create a prompt for the AI to generate a professional summary
    let prompt = `Generate a professional and concise CV summary for ${name} in ${language} language. 
    
Their skills include: ${skills.join(', ')}. 

Their most recent work experience is: ${experience[0]?.jobTitle || 'N/A'} at ${experience[0]?.employer || 'N/A'}.

Their highest education is: ${education[0]?.degree || 'N/A'} from ${education[0]?.school || 'N/A'}.

The summary should be professional, highlight their skills and experience, and be appropriate for a job application. 
Keep it between 100-150 words and focus on their strengths and potential contribution to employers.
Write in first person ("I am...").`;

    // Generate content using the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating professional summary:", error);
    return "Unable to generate a professional summary. Please try again or write your own summary.";
  }
}

/**
 * Generate a job description for CV/resume
 */
export async function generateJobDescription(jobInfo: any, language: string = 'English'): Promise<string> {
  try {
    const { jobTitle, employer, description } = jobInfo;
    
    // Create a prompt for the AI to generate a job description
    const prompt = `Generate a professional and concise job description for a CV/resume in ${language} language, for the position of ${jobTitle} at ${employer}.
    
Here's some context about the job: ${description || 'No specific details provided.'}

The description should:
- Be written in first person ("I...")
- Use action verbs
- Highlight responsibilities and achievements
- Be 3-4 bullet points or a paragraph of 2-3 sentences
- Be professional and appropriate for a CV
- Focus on skills and experiences that would be valuable to future employers`;

    // Generate content using the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating job description:", error);
    return "Unable to generate a job description. Please try again or write your own description.";
  }
}

/**
 * Translate text using Gemini
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    if (!text || text.trim() === '') {
      return '';
    }
    
    // Create a prompt for translation
    const prompt = `Translate the following text into ${targetLanguage} language. Maintain the professional tone and meaning:
    
${text}

The translation should sound natural and professional in ${targetLanguage}.`;

    // Generate content using the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();
    
    return translatedText;
  } catch (error) {
    console.error(`Error translating text to ${targetLanguage}:`, error);
    return text; // Return original text if translation fails
  }
}