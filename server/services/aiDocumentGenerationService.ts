import { storage } from "../storage";
import { aiService } from "./aiService";
import { aiServiceManager } from "./aiServiceManager";
import { Errors } from "../middleware/errorHandler";

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === "object") {
    return [value as T];
  }
  return [];
}

function extractSkills(profile: any): string[] {
  const skills = profile?.skills?.skills;
  if (Array.isArray(skills)) {
    return skills.filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0);
  }
  return [];
}

function normalizeExperience(profile: any) {
  const rawExperience = profile?.experience;
  const records = asArray(rawExperience).filter(Boolean);
  return records.map((item: any) => ({
    jobTitle: item.jobTitle || item.title || "Previous role",
    employer: item.employer || item.company || "Previous employer",
    location: item.location || "",
    startDate: item.startDate || "",
    endDate: item.currentlyEmployed ? "" : item.endDate || "",
    isCurrentJob: Boolean(item.currentlyEmployed || item.isCurrentJob),
    description: item.jobDescription || item.description || item.previousExperience || "",
  }));
}

function normalizeEducation(profile: any) {
  const rawEducation = profile?.education;
  const records = asArray(rawEducation).filter(Boolean);
  return records.map((item: any) => ({
    degree: item.degree || item.highestEducation || "Education",
    school: item.school || item.schoolName || "School",
    location: item.location || "",
    graduationDate: item.graduationDate || item.yearCompleted || "",
    achievements: item.achievements || "",
    additionalCourses: item.additionalCourses || "",
  }));
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class AiDocumentGenerationService {
  async generateCv(userId: number, language = "English") {
    const profile = await storage.getUserProfile(userId);
    if (!profile) {
      throw Errors.notFound("Profile not found");
    }

    const skills = extractSkills(profile);
    const experience = normalizeExperience(profile);
    const education = normalizeEducation(profile);
    const name = profile.personal?.fullName || "WorkWise candidate";

    if (skills.length === 0) {
      throw Errors.validation("Add at least one skill before generating an AI CV");
    }

    const summaryResponse = await aiServiceManager.generateProfessionalSummary({
      name,
      skills,
      experience,
      education,
      language,
    });

    if (!summaryResponse.success || !summaryResponse.data) {
      throw Errors.externalService(summaryResponse.error || "AI summary generation failed");
    }

    const enhancedExperience: typeof experience = [];
    for (const item of experience) {
      if (!item.jobTitle || !item.employer) {
        enhancedExperience.push(item);
        continue;
      }

      const descriptionResponse = await aiServiceManager.generateJobDescription({
        jobTitle: item.jobTitle,
        employer: item.employer,
        description: item.description,
        language,
      });

      enhancedExperience.push({
        ...item,
        description: descriptionResponse.success && descriptionResponse.data
          ? descriptionResponse.data
          : item.description,
      });
    }

    const content = {
      personalInfo: {
        fullName: name,
        email: profile.email || "",
        phone: profile.personal?.phoneNumber || "",
        address: profile.personal?.location || "",
      },
      professionalSummary: summaryResponse.data,
      experience: enhancedExperience,
      education,
      skills,
      languages: Array.isArray(profile.skills?.languages)
        ? profile.skills.languages.map((languageName: string) => ({
            language: languageName,
            proficiency: "Intermediate",
          }))
        : [],
      references: [],
      profileCompletenessHints: {
        hasBio: Boolean(profile.personal?.bio),
        hasCvUpload: Boolean(profile.skills?.cvUpload),
      },
    };

    const serialized = JSON.stringify(content);
    const tokens = estimateTokens(serialized);
    return {
      title: `${name} CV`,
      content,
      model: summaryResponse.service || "ai-service-manager",
      tokens,
      costEstimateCents: Math.ceil(tokens / 1000),
    };
  }

  async generateCoverLetter(userId: number, jobId: number, tone = "professional") {
    const [profile, job] = await Promise.all([
      storage.getUserProfile(userId),
      storage.getJob(jobId),
    ]);

    if (!profile) {
      throw Errors.notFound("Profile not found");
    }
    if (!job) {
      throw Errors.notFound("Job not found");
    }

    const company = await storage.getCompany(job.companyId);
    const skills = extractSkills(profile).join(", ") || "transferable skills";
    const experience = normalizeExperience(profile)[0];
    const prompt = `Write a ${tone} job-specific cover letter for ${profile.personal?.fullName || "a WorkWise SA candidate"} applying for ${job.title} at ${company?.name || "the employer"}.

Candidate profile:
- Location: ${profile.personal?.location || "Not specified"}
- Skills: ${skills}
- Recent experience: ${experience?.jobTitle || "Not specified"} at ${experience?.employer || "Not specified"}
- Bio: ${profile.personal?.bio || "Not specified"}

Job details:
- Title: ${job.title}
- Company: ${company?.name || "Employer"}
- Location: ${job.location}
- Type: ${job.jobType}
- Work mode: ${job.workMode}
- Description: ${job.description}

Return only the cover letter body. Keep it concise, sincere, and suitable for the South African job market.`;

    const startedAt = Date.now();
    const coverLetter = await aiService.generateResponse(prompt);
    const tokens = estimateTokens(prompt + coverLetter);

    return {
      title: `${job.title} cover letter`,
      content: {
        coverLetter,
        job: {
          id: job.id,
          title: job.title,
          company: company?.name || "",
        },
      },
      model: process.env.GOOGLE_GENAI_MODEL || "gemini-1.5-flash",
      tokens,
      costEstimateCents: Math.ceil(tokens / 1000),
      generationTimeMs: Date.now() - startedAt,
    };
  }
}

export const aiDocumentGenerationService = new AiDocumentGenerationService();
