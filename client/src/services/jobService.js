// Mock API functions
const MOCK_CATEGORIES_DATA = {
  "entry_level": [
    "General Worker", "Construction Worker", "Picker/Packer", "Warehouse Assistant",
    "Cashier", "Cleaner", "Security Guard", "Retail Assistant", "Call Center Agent",
    "Domestic Worker", "Petrol Attendant", "Childcare Worker", "Landscaping/Gardener",
    "Driver", "Admin Clerk", "Hospitality Staff"
  ],
  "professional": [
    "IT/Technology", "Healthcare", "Education", "Finance", "Engineering",
    "Manufacturing", "Transport/Logistics", "Sales/Marketing", "Human Resources"
  ]
};

const MOCK_LOCATIONS_DATA = [
  "Cape Town, Western Cape", "Johannesburg, Gauteng", "Durban, KwaZulu-Natal",
  "Pretoria, Gauteng", "Port Elizabeth, Eastern Cape", "Bloemfontein, Free State",
  "Nelspruit, Mpumalanga", "Kimberley, Northern Cape", "Polokwane, Limpopo",
  "Stellenbosch, Western Cape", "Sandton, Gauteng", "Midrand, Gauteng",
  "East London, Eastern Cape", "George, Western Cape"
];

export const fetchCategories = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const formattedCategories = Object.entries(MOCK_CATEGORIES_DATA).flatMap(([group, items]) =>
    items.map(item => ({ id: item.toLowerCase().replace(/[\s/]+/g, '-'), name: item, group }))
  );
  return formattedCategories;
};

export const fetchLocationSuggestions = async (query) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const filteredLocations = MOCK_LOCATIONS_DATA.filter(loc => loc.toLowerCase().includes(query.toLowerCase()));
  return filteredLocations.map((desc, idx) => ({ id: `loc-${idx}`, description: desc }));
};

export const generateAIContent = async (type, jobInfo, aiPrefs) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  let content = "";
  const { title, category, companyName, location, jobType } = jobInfo;
  const { aiDescriptionType, aiCustomPrompt } = aiPrefs;

  if (type === "description") {
    if (aiDescriptionType === "custom" && aiCustomPrompt) {
      content = `# ${title || "Job Title"} - Custom Request\n\n${aiCustomPrompt}\n\nWe are looking for a ${title || 'talented individual'} at ${companyName || 'our company'}. This is a ${jobType || 'great'} opportunity in ${location || 'our area'}.`;
    } else if (aiDescriptionType === "detailed") {
      content = `# Detailed Job: ${title || "Job Title"} at ${companyName || "Our Company"}\n\n## Overview\nWe are seeking a highly motivated and skilled ${title || "professional"} to join our dynamic team. This ${jobType || "full-time"} role, based in ${location || "our vibrant city"}, offers an excellent opportunity for growth within the ${category || "relevant"} industry.\n\n## Key Responsibilities\n- Execute tasks related to the ${title || "position"}.\n- Collaborate effectively with cross-functional teams.\n- Contribute to project planning and execution.\n- Uphold company standards and best practices.\n\n## Qualifications\n- Proven experience in a similar role or ${category || "field"}.\n- Strong problem-solving and analytical skills.\n- Excellent communication and interpersonal abilities.\n- Bachelor's degree in a relevant field (preferred).\n\n## Why Join Us?\n- Competitive salary and benefits package.\n- Opportunities for professional development and training.\n- A supportive and innovative work culture at ${companyName || "our company"}.\n- Make a significant impact in the ${category || "industry"}.`;
    } else { // Basic
      content = `# Position: ${title || "Job Title"}\n\nWe're hiring a ${title || "dedicated individual"} for our team at ${companyName || "our company"}. This ${jobType || "role"} is located in ${location || "our area"}.\n\n## Core Duties\n- Perform daily tasks for the ${title || "position"}.\n- Work with colleagues to meet objectives.\n\n## Requirements\n- Relevant experience.\n- Good communication skills.`;
    }
  } else if (type === "companyBio") {
    content = `## About ${companyName || "Our Company"}\n\n${companyName || "Our company"} is a forward-thinking leader in the ${category || "XYZ"} industry. We are dedicated to fostering innovation, driving excellence, and making a positive contribution to our community and clients. Our team is composed of passionate professionals who are committed to delivering outstanding results. We believe in a collaborative and inclusive work environment where every employee can thrive and grow. Join us as we continue to shape the future of ${category || "our field"}.`;
  } else {
    content = "AI-generated content would appear here.";
  }
  return content;
};

export const submitJobPost = async (formData) => {
  console.log("Submitting job post:", formData);
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (formData.title && formData.title.toLowerCase().includes("error")) {
    throw new Error("Simulated server error: Invalid job title.");
  }
  return { success: true, jobId: `job_${Date.now()}`, message: "Job posted successfully!" };
};
