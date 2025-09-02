import { generateProfessionalSummary, generateJobDescription, translateText } from '../ai';
import { 
  generateProfessionalSummaryWithClaude, 
  generateJobDescriptionWithClaude, 
  translateTextWithClaude,
  analyzeImage 
} from '../anthropic';
import { secretManager } from './secretManager';

/**
 * AI Service Types
 */
export type AIServiceType = 'gemini' | 'claude';

export interface AIServiceConfig {
  primary: AIServiceType;
  fallback: AIServiceType;
  enableFallback: boolean;
}

export interface AIGenerationRequest {
  name: string;
  skills: string[];
  experience: any[];
  education: any[];
  language?: string;
}

export interface JobDescriptionRequest {
  jobTitle: string;
  employer: string;
  description?: string;
  language?: string;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface ImageAnalysisRequest {
  base64Image: string;
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  service?: AIServiceType;
  fallbackUsed?: boolean;
}

/**
 * Enhanced AI Service Manager
 * Provides intelligent fallback between AI services and robust error handling
 */
export class AIServiceManager {
  private config: AIServiceConfig;
  private serviceAvailability: Map<AIServiceType, boolean> = new Map();
  private lastHealthCheck: Map<AIServiceType, number> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(config: AIServiceConfig = {
    primary: 'claude',
    fallback: 'gemini',
    enableFallback: true
  }) {
    this.config = config;
    this.initializeServiceAvailability();
  }

  /**
   * Initialize service availability tracking
   */
  private initializeServiceAvailability(): void {
    this.serviceAvailability.set('gemini', true);
    this.serviceAvailability.set('claude', true);
    this.lastHealthCheck.set('gemini', 0);
    this.lastHealthCheck.set('claude', 0);
  }

  /**
   * Check if a service is available
   */
  private async isServiceAvailable(service: AIServiceType): Promise<boolean> {
    const lastCheck = this.lastHealthCheck.get(service) || 0;
    const now = Date.now();

    // If we checked recently, return cached result
    if (now - lastCheck < this.HEALTH_CHECK_INTERVAL) {
      return this.serviceAvailability.get(service) || false;
    }

    try {
      let available = false;
      
      switch (service) {
        case 'gemini':
          const geminiKey = await secretManager.getSecret('GOOGLE_GENAI_API_KEY');
          available = !!geminiKey;
          break;
        case 'claude':
          const claudeKey = await secretManager.getSecret('ANTHROPIC_API_KEY');
          available = !!claudeKey;
          break;
      }

      this.serviceAvailability.set(service, available);
      this.lastHealthCheck.set(service, now);
      
      return available;
    } catch (error) {
      console.error(`Error checking ${service} availability:`, error);
      this.serviceAvailability.set(service, false);
      this.lastHealthCheck.set(service, now);
      return false;
    }
  }

  /**
   * Get the best available service for a request
   */
  private async getBestService(): Promise<AIServiceType | null> {
    const primaryAvailable = await this.isServiceAvailable(this.config.primary);
    
    if (primaryAvailable) {
      return this.config.primary;
    }

    if (this.config.enableFallback) {
      const fallbackAvailable = await this.isServiceAvailable(this.config.fallback);
      if (fallbackAvailable) {
        return this.config.fallback;
      }
    }

    return null;
  }

  /**
   * Generate professional summary with intelligent fallback
   */
  async generateProfessionalSummary(request: AIGenerationRequest): Promise<AIResponse> {
    const service = await this.getBestService();
    
    if (!service) {
      return {
        success: false,
        error: 'No AI services are currently available. Please try again later or write your summary manually.',
        data: this.getFallbackSummary(request)
      };
    }

    try {
      let result: string;
      let fallbackUsed = false;

      if (service === this.config.primary) {
        try {
          result = await this.callPrimaryService('summary', request);
        } catch (primaryError) {
          console.error(`Primary service (${this.config.primary}) failed:`, primaryError);
          
          if (this.config.enableFallback) {
            console.log(`Falling back to ${this.config.fallback}`);
            result = await this.callFallbackService('summary', request);
            fallbackUsed = true;
          } else {
            throw primaryError;
          }
        }
      } else {
        result = await this.callFallbackService('summary', request);
        fallbackUsed = true;
      }

      return {
        success: true,
        data: result,
        service,
        fallbackUsed
      };
    } catch (error) {
      console.error('All AI services failed for summary generation:', error);
      return {
        success: false,
        error: 'AI services are temporarily unavailable. Please try again later.',
        data: this.getFallbackSummary(request)
      };
    }
  }

  /**
   * Generate job description with intelligent fallback
   */
  async generateJobDescription(request: JobDescriptionRequest): Promise<AIResponse> {
    const service = await this.getBestService();
    
    if (!service) {
      return {
        success: false,
        error: 'No AI services are currently available. Please try again later or write your description manually.',
        data: this.getFallbackJobDescription(request)
      };
    }

    try {
      let result: string;
      let fallbackUsed = false;

      if (service === this.config.primary) {
        try {
          result = await this.callPrimaryService('jobDescription', request);
        } catch (primaryError) {
          console.error(`Primary service (${this.config.primary}) failed:`, primaryError);
          
          if (this.config.enableFallback) {
            console.log(`Falling back to ${this.config.fallback}`);
            result = await this.callFallbackService('jobDescription', request);
            fallbackUsed = true;
          } else {
            throw primaryError;
          }
        }
      } else {
        result = await this.callFallbackService('jobDescription', request);
        fallbackUsed = true;
      }

      return {
        success: true,
        data: result,
        service,
        fallbackUsed
      };
    } catch (error) {
      console.error('All AI services failed for job description generation:', error);
      return {
        success: false,
        error: 'AI services are temporarily unavailable. Please try again later.',
        data: this.getFallbackJobDescription(request)
      };
    }
  }

  /**
   * Translate text with intelligent fallback
   */
  async translateText(request: TranslationRequest): Promise<AIResponse> {
    const service = await this.getBestService();
    
    if (!service) {
      return {
        success: false,
        error: 'Translation services are temporarily unavailable. Please try again later.',
        data: request.text // Return original text as fallback
      };
    }

    try {
      let result: string;
      let fallbackUsed = false;

      if (service === this.config.primary) {
        try {
          result = await this.callPrimaryService('translate', request);
        } catch (primaryError) {
          console.error(`Primary service (${this.config.primary}) failed:`, primaryError);
          
          if (this.config.enableFallback) {
            console.log(`Falling back to ${this.config.fallback}`);
            result = await this.callFallbackService('translate', request);
            fallbackUsed = true;
          } else {
            throw primaryError;
          }
        }
      } else {
        result = await this.callFallbackService('translate', request);
        fallbackUsed = true;
      }

      return {
        success: true,
        data: result,
        service,
        fallbackUsed
      };
    } catch (error) {
      console.error('All AI services failed for translation:', error);
      return {
        success: false,
        error: 'Translation services are temporarily unavailable. Please try again later.',
        data: request.text // Return original text as fallback
      };
    }
  }

  /**
   * Analyze image (Claude only - no fallback available)
   */
  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse> {
    try {
      const claudeAvailable = await this.isServiceAvailable('claude');
      
      if (!claudeAvailable) {
        return {
          success: false,
          error: 'Image analysis is temporarily unavailable. Please try again later.',
          data: 'Unable to analyze the image at this time. Please ensure your photo is professional and well-lit.'
        };
      }

      const result = await analyzeImage(request.base64Image);
      
      return {
        success: true,
        data: result,
        service: 'claude'
      };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        success: false,
        error: 'Image analysis failed. Please try again later.',
        data: 'Unable to analyze the image. Please ensure your photo is in a supported format (JPEG, PNG) and well-lit.'
      };
    }
  }

  /**
   * Call primary service based on configuration
   */
  private async callPrimaryService(operation: string, request: any): Promise<string> {
    if (this.config.primary === 'claude') {
      return this.callClaudeService(operation, request);
    } else {
      return this.callGeminiService(operation, request);
    }
  }

  /**
   * Call fallback service
   */
  private async callFallbackService(operation: string, request: any): Promise<string> {
    if (this.config.fallback === 'claude') {
      return this.callClaudeService(operation, request);
    } else {
      return this.callGeminiService(operation, request);
    }
  }

  /**
   * Call Claude service
   */
  private async callClaudeService(operation: string, request: any): Promise<string> {
    switch (operation) {
      case 'summary':
        return generateProfessionalSummaryWithClaude(request);
      case 'jobDescription':
        return generateJobDescriptionWithClaude(request, request.language);
      case 'translate':
        return translateTextWithClaude(request.text, request.targetLanguage);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Call Gemini service
   */
  private async callGeminiService(operation: string, request: any): Promise<string> {
    switch (operation) {
      case 'summary':
        return generateProfessionalSummary(request);
      case 'jobDescription':
        return generateJobDescription(request, request.language);
      case 'translate':
        return translateText(request.text, request.targetLanguage);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Generate fallback professional summary when AI services are unavailable
   */
  private getFallbackSummary(request: AIGenerationRequest): string {
    const { name, skills, experience, education } = request;
    
    const skillsList = skills.length > 0 ? skills.slice(0, 5).join(', ') : 'various technical skills';
    const latestJob = experience[0];
    const latestEducation = education[0];
    
    let summary = `I am ${name}, a motivated professional with expertise in ${skillsList}.`;
    
    if (latestJob) {
      summary += ` I have experience working as ${latestJob.jobTitle || 'a professional'} at ${latestJob.employer || 'a reputable organization'}.`;
    }
    
    if (latestEducation) {
      summary += ` I hold ${latestEducation.degree || 'a qualification'} from ${latestEducation.school || 'an educational institution'}.`;
    }
    
    summary += ' I am eager to contribute my skills and experience to new opportunities and continue growing professionally.';
    
    return summary;
  }

  /**
   * Generate fallback job description when AI services are unavailable
   */
  private getFallbackJobDescription(request: JobDescriptionRequest): string {
    const { jobTitle, employer, description } = request;
    
    let fallback = `I worked as ${jobTitle} at ${employer}.`;
    
    if (description) {
      fallback += ` ${description}`;
    } else {
      fallback += ' I was responsible for various tasks related to this role and contributed to the organization\'s goals.';
    }
    
    fallback += ' This experience has enhanced my professional skills and knowledge.';
    
    return fallback;
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current service status
   */
  async getServiceStatus(): Promise<Record<AIServiceType, boolean>> {
    const geminiAvailable = await this.isServiceAvailable('gemini');
    const claudeAvailable = await this.isServiceAvailable('claude');
    
    return {
      gemini: geminiAvailable,
      claude: claudeAvailable
    };
  }
}

// Create singleton instance
export const aiServiceManager = new AIServiceManager();
