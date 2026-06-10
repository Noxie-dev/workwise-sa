import { describe, expect, it } from "vitest";
import { DatabaseStorage } from "../../storage";

class TestStorage extends DatabaseStorage {
  private user: any;
  private files: any[];

  constructor(user: any, files: any[] = []) {
    super();
    this.user = user;
    this.files = files;
  }

  async getUser() {
    return this.user;
  }

  async getFilesByUser() {
    return this.files;
  }

  async updateUser(_id: number, updates: any) {
    this.user = {
      ...this.user,
      ...updates,
    };
    return this.user;
  }
}

describe("DatabaseStorage profile persistence", () => {
  it("reads persisted profile sections from the user JSON fields", async () => {
    const storage = new TestStorage({
      id: 7,
      username: "candidate",
      email: "candidate@example.com",
      name: "Candidate One",
      phoneNumber: "0712345678",
      location: "Cape Town",
      bio: "Retail candidate",
      willingToRelocate: true,
      education: { highestEducation: "Matric", schoolName: "Central High" },
      experience: { hasExperience: true, jobTitle: "Cashier", employer: "Shop" },
      skills: { skills: ["Customer service"], languages: ["English"] },
      preferences: { jobTypes: ["Full-time"], willingToRelocate: true },
      engagementScore: 10,
      createdAt: new Date("2026-01-01"),
    });

    const profile = await storage.getUserProfile(7);

    expect(profile.personal.fullName).toBe("Candidate One");
    expect(profile.education.highestEducation).toBe("Matric");
    expect(profile.experience.jobTitle).toBe("Cashier");
    expect(profile.skills.skills).toEqual(["Customer service"]);
    expect(profile.preferences.willingToRelocate).toBe(true);
  });

  it("merges updates and persists them back to the user row", async () => {
    const storage = new TestStorage({
      id: 8,
      username: "candidate-two",
      email: "candidate2@example.com",
      name: "Candidate Two",
      education: { highestEducation: "Matric", schoolName: "Old School" },
      experience: { hasExperience: true, jobTitle: "Cleaner", employer: "Hotel" },
      skills: { skills: ["Cleaning"], languages: ["English"] },
      preferences: { jobTypes: ["Part-time"], willingToRelocate: false },
      createdAt: new Date("2026-01-01"),
    });

    await storage.updateUserProfile(8, {
      personal: { fullName: "Updated Candidate", location: "Durban" },
      education: { schoolName: "New School" },
      skills: { skills: ["Cleaning", "Stock control"] },
      preferences: { willingToRelocate: true },
    });

    const profile = await storage.getUserProfile(8);

    expect(profile.personal.fullName).toBe("Updated Candidate");
    expect(profile.personal.location).toBe("Durban");
    expect(profile.education.highestEducation).toBe("Matric");
    expect(profile.education.schoolName).toBe("New School");
    expect(profile.skills.skills).toEqual(["Cleaning", "Stock control"]);
    expect(profile.preferences.willingToRelocate).toBe(true);
  });
});
