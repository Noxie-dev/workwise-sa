import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, MessageSquare, Users, Clock, CheckCircle, AlertCircle, XCircle, Laptop,
  FileText, Award, Coffee, Camera, Smile, ThumbsUp, Search, HelpCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Define interfaces for component props
interface SectionHeaderProps {
  children: React.ReactNode;
  icon: React.ElementType;
}

interface TipProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

interface DoDontCardProps {
  type: 'do' | 'dont';
  title: string;
  items: string[];
}

interface CommonQuestionProps {
  question: string;
  answer: string;
  index: number;
}

interface ChecklistItemProps {
  children: React.ReactNode;
  delay?: number;
}

// Sub-components for InterviewTipsContent
const SectionHeader: React.FC<SectionHeaderProps> = ({ children, icon: Icon }) => (
  <motion.div
    className="flex items-center gap-2 mt-8 mb-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="bg-indigo-100 p-2 rounded-full">
      <Icon className="h-6 w-6 text-indigo-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800">{children}</h2>
  </motion.div>
);

const Tip: React.FC<TipProps> = ({ title, children, delay = 0 }) => (
  <motion.div
    className="bg-white p-6 rounded-lg shadow-md mb-4"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    {children}
  </motion.div>
);

const DoDontCard: React.FC<DoDontCardProps> = ({ type, title, items }) => {
  const isDoCard = type === 'do';

  return (
    <motion.div
      className={`bg-white p-6 rounded-lg shadow-md ${isDoCard ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-full ${isDoCard ? 'bg-green-100' : 'bg-red-100'}`}>
          {isDoCard ? (
            <CheckCircle className={`h-5 w-5 ${isDoCard ? 'text-green-600' : 'text-red-600'}`} />
          ) : (
            <XCircle className={`h-5 w-5 ${isDoCard ? 'text-green-600' : 'text-red-600'}`} />
          )}
        </div>
        <h3 className="font-semibold text-lg ml-2">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className={`inline-block mr-2 mt-1 ${isDoCard ? 'text-green-500' : 'text-red-500'}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const CommonQuestion: React.FC<CommonQuestionProps> = ({ question, answer, index }) => (
  <motion.div
    className="mb-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div
      className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => {
        const element = document.getElementById(`answer-${index}`);
        if (element) {
          element.classList.toggle('hidden');
        }
      }}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{question}</h3>
        <HelpCircle className="h-5 w-5 text-indigo-600" />
      </div>
      <div id={`answer-${index}`} className="mt-4 pt-4 border-t border-gray-100 hidden">
        <p className="text-gray-700">{answer}</p>
      </div>
    </div>
  </motion.div>
);

const ChecklistItem: React.FC<ChecklistItemProps> = ({ children, delay = 0 }) => (
  <motion.div
    className="flex items-start mb-3"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <CheckCircle className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
    <span className="text-indigo-900">{children}</span>
  </motion.div>
);

const InterviewTipsContent: React.FC = () => {
  // Common interview questions data
  const commonQuestions = [
    {
      question: "Tell me about yourself",
      answer: "Keep your answer concise (1-2 minutes) and focused on your professional journey. Start with your current role, mention key achievements, and explain how your experience makes you suitable for this position."
    },
    {
      question: "What is your greatest strength?",
      answer: "Choose a strength relevant to the job. Provide a specific example that demonstrates this strength in action and explain how it would benefit the organization if you're hired."
    },
    {
      question: "What is your greatest weakness?",
      answer: "Select a genuine weakness that isn't critical for the role. More importantly, explain the steps you're taking to improve in this area, showing self-awareness and growth mindset."
    },
    {
      question: "Why do you want to work here?",
      answer: "Research the company beforehand. Mention specific aspects of their culture, mission, products, or reputation that resonate with you. Explain how your skills align with their needs and how you can contribute to their goals."
    },
    {
      question: "Where do you see yourself in 5 years?",
      answer: "Show ambition while being realistic. Discuss how you want to grow professionally in a way that aligns with the company's potential growth trajectory. Emphasize your desire to develop expertise and add increasing value."
    }
  ];

  return (
    <>
      <SectionHeader icon={Clock}>Before the Interview</SectionHeader>
      <Tip title="Research the Company" delay={0.1}>
        <p>Thoroughly research the company's history, culture, products/services, recent news, and competitors. Visit their website, social media profiles, and read employee reviews to gain valuable insights.</p>
      </Tip>
      <Tip title="Understand the Role" delay={0.2}>
        <p>Review the job description carefully. Identify key skills and experiences they're looking for, and prepare examples from your background that demonstrate these competencies.</p>
      </Tip>
      <Tip title="Practice Common Questions" delay={0.3}>
        <p>Prepare answers to standard interview questions. Practice your responses out loud, focusing on clarity and conciseness. Consider recording yourself to identify areas for improvement.</p>
      </Tip>
      <Tip title="Prepare Your Own Questions" delay={0.4}>
        <p>Develop thoughtful questions to ask the interviewer about the role, team, company culture, and growth opportunities. This demonstrates your genuine interest and critical thinking skills.</p>
      </Tip>

      <SectionHeader icon={Users}>During the Interview</SectionHeader>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <DoDontCard
          type="do"
          title="Interview Do's"
          items={[
            "Arrive 10-15 minutes early",
            "Maintain appropriate eye contact",
            "Listen carefully before responding",
            "Use the STAR method for behavioral questions",
            "Showcase your relevant achievements",
            "Demonstrate enthusiasm for the role"
          ]}
        />
        <DoDontCard
          type="dont"
          title="Interview Don'ts"
          items={[
            "Speak negatively about previous employers",
            "Provide vague or overly general answers",
            "Interrupt the interviewer",
            "Check your phone or watch repeatedly",
            "Ask about salary prematurely",
            "Appear disinterested or unprepared"
          ]}
        />
      </div>

      <SectionHeader icon={Briefcase}>Professional Appearance</SectionHeader>
      <motion.div
        className="grid md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Research the Dress Code</h3>
          <p className="text-gray-600">Look up the company's culture or ask the recruiter about the appropriate attire.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Award className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Professional Attire</h3>
          <p className="text-gray-600">Dress one level up from the company's daily dress code to show respect for the opportunity.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Smile className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Personal Grooming</h3>
          <p className="text-gray-600">Ensure neat hair, clean nails, and minimal fragrance to make a polished impression.</p>
        </div>
      </motion.div>

      <SectionHeader icon={Laptop}>Virtual Interview Tips</SectionHeader>
      <motion.div
        className="bg-indigo-50 p-6 rounded-lg mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg text-indigo-800 mb-3">Technical Preparation</h3>
            <ChecklistItem delay={0.1}>Test your camera, microphone, and internet connection before the interview</ChecklistItem>
            <ChecklistItem delay={0.2}>Download and become familiar with the video conferencing platform</ChecklistItem>
            <ChecklistItem delay={0.3}>Have a backup plan (phone number, alternative device) in case of technical issues</ChecklistItem>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-indigo-800 mb-3">Environment Setup</h3>
            <ChecklistItem delay={0.4}>Find a quiet, well-lit location with a neutral background</ChecklistItem>
            <ChecklistItem delay={0.5}>Position your camera at eye level and frame yourself properly</ChecklistItem>
            <ChecklistItem delay={0.6}>Remove potential distractions and notify household members about your interview</ChecklistItem>
          </div>
        </div>
      </motion.div>

      <SectionHeader icon={MessageSquare}>Common Interview Questions</SectionHeader>
      <div className="mb-8">
        {commonQuestions.map((q, idx) => (
          <CommonQuestion
            key={idx}
            question={q.question}
            answer={q.answer}
            index={idx}
          />
        ))}
      </div>

      <SectionHeader icon={FileText}>The STAR Method for Behavioral Questions</SectionHeader>
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-gray-600 mb-4">The STAR method helps structure your answers to behavioral questions effectively:</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">S - Situation</h4>
            <p className="text-gray-600">Describe the context or background of the specific situation you were in.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">T - Task</h4>
            <p className="text-gray-600">Explain the task or challenge you were responsible for in that situation.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">A - Action</h4>
            <p className="text-gray-600">Detail the specific actions you took to address the task or challenge.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">R - Result</h4>
            <p className="text-gray-600">Share the outcomes of your actions, using specific metrics when possible.</p>
          </div>
        </div>
      </motion.div>

      <SectionHeader icon={Coffee}>After the Interview</SectionHeader>
      <Tip title="Send a Thank-You Note" delay={0.1}>
        <p>Within 24 hours, send a personalized thank-you email to each interviewer. Reference specific conversation points and reiterate your interest in the position.</p>
      </Tip>
      <Tip title="Reflect on Your Performance" delay={0.2}>
        <p>Note what went well and areas for improvement while the interview is fresh in your mind. This reflection will help you improve for future interviews.</p>
      </Tip>
      <Tip title="Follow Up Appropriately" delay={0.3}>
        <p>If you haven't heard back within the timeframe mentioned, it's appropriate to send a polite follow-up email expressing your continued interest and asking about the next steps.</p>
      </Tip>

      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Ace Your Interview?</h2>
        <p className="text-gray-600 mb-6">
          Remember that preparation is key. Use these tips to present yourself confidently and professionally.
        </p>
        <p className="text-lg font-medium text-indigo-700">
          Good luck from the WorkWiseSA team!
        </p>
      </motion.div>
    </>
  );
};

export default InterviewTipsContent;
