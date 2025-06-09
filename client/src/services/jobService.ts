import { JobFormValues } from "@/constants/formConstants";

export const fetchCategories = async () => {
  // Simulate API call
  const data = {
    "entry_level": [
      "General Worker",
      "Construction Worker",
      "Picker/Packer",
      "Warehouse Assistant",
      "Cashier",
      "Cleaner",
      "Security Guard",
      "Retail Assistant",
      "Call Center Agent",
      "Domestic Worker",
      "Petrol Attendant",
      "Childcare Worker",
      "Landscaping/Gardener",
      "Driver",
      "Admin Clerk",
      "Hospitality Staff"
    ],
    "professional": [
      "IT/Technology",
      "Healthcare",
      "Education",
      "Finance",
      "Manufacturing",
      "Transport/Logistics"
    ]
  };
  
  // Format the data for the select component
  const formattedCategories = Object.entries(data).flatMap(([group, items]) => {
    return items.map(item => ({
      id: item.toLowerCase().replace(/\s+/g, '-'),
      name: item,
      group
    }));
  });
  
  return formattedCategories;
};

export const generateAIContent = async (prompt: string, type: string, jobInfo: Partial<JobFormValues>) => {
  // In a real app, this would be an API call to your AI service
  // For now, we'll return dummy data
  const wait = () => new Promise(resolve => setTimeout(resolve, 1000));
  await wait();

  switch (type) {
    case "description":
      return {
        content: `# ${jobInfo.title} Position

We're looking for a talented ${jobInfo.title} to join our team at ${jobInfo.companyName || "our company"}. This is a ${jobInfo.jobType || "full-time"} position located in ${jobInfo.location || "South Africa"}.

## Responsibilities
- Perform day-to-day tasks related to ${jobInfo.title}
- Collaborate with team members to achieve goals
- Report to direct supervisor on project progress
- Maintain professional standards and company values

## Requirements
- Experience in related field
- Strong communication skills
- Ability to work independently and in a team
- Problem-solving abilities

## Benefits
- Competitive salary
- Professional development opportunities
- Supportive work environment
- Health benefits

If you're passionate about [industry] and ready to take the next step in your career, we'd love to hear from you!`
      };
      
    case "companyBio":
      return {
        content: `${jobInfo.companyName || "Our company"} is a leading organization in the ${jobInfo.category || "industry"} sector. We are committed to excellence, innovation, and creating a positive impact in our community. With a team of dedicated professionals, we strive to deliver the best products/services to our clients while maintaining a supportive and inclusive workplace for our employees.`
      };
      
    default:
      return {
        content: "AI-generated content would appear here."
      };
  }
};

export const submitJobPost = async (formData: JobFormValues) => {
  // In a real app, this would be an API call to your backend
  console.log('Submitting job post:', formData);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    jobId: 'job_' + Math.random().toString(36).substr(2, 9),
    message: 'Job posted successfully'
  };
};

export const fetchLocationSuggestions = async (query: string) => {
  // Simulate API call with dummy data
  const mockLocations = [
    "Cape Town, Western Cape",
    "Johannesburg, Gauteng",
    "Durban, KwaZulu-Natal",
    "Pretoria, Gauteng",
    "Port Elizabeth, Eastern Cape",
    "Bloemfontein, Free State",
    "Nelspruit, Mpumalanga",
    "Kimberley, Northern Cape",
    "Polokwane, Limpopo"
  ];
  
  // Filter based on query
  const filteredLocations = mockLocations.filter(
    location => location.toLowerCase().includes(query.toLowerCase())
  );
  
  return filteredLocations.map((description, index) => ({
    id: `location-${index}`,
    description
  }));
};
