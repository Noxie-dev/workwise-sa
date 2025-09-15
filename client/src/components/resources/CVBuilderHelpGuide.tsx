import React, { useState, Suspense, lazy } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, AlertCircle, Download, FileText } from 'lucide-react';

// Lazy load section content components
const GettingStartedContent = lazy(() => import('./help-guide-sections/GettingStartedContent'));
const PersonalInfoContent = lazy(() => import('./help-guide-sections/PersonalInfoContent'));
const ProfessionalSummaryContent = lazy(() => import('./help-guide-sections/ProfessionalSummaryContent'));
const WorkExperienceContent = lazy(() => import('./help-guide-sections/WorkExperienceContent'));
const EducationContent = lazy(() => import('./help-guide-sections/EducationContent'));
const SkillsLanguagesContent = lazy(() => import('./help-guide-sections/SkillsLanguagesContent'));
const ReferencesContent = lazy(() => import('./help-guide-sections/ReferencesContent'));
const GeneratingCVContent = lazy(() => import('./help-guide-sections/GeneratingCVContent'));
const IndustryTipsContent = lazy(() => import('./help-guide-sections/IndustryTipsContent'));
const TroubleshootingSupportContent = lazy(() => import('./help-guide-sections/TroubleshootingSupportContent'));

// Fallback component for Suspense
const SectionLoading = () => (
  <div className="p-4 text-gray-500 text-center">Loading content...</div>
);

/**
 * CV Builder Help Guide component with code-split sections
 */
export default function CVBuilderHelpGuide() {
  const [openSection, setOpenSection] = useState('getting-started');

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? '' : sectionId);
  };

  // Helper component for collapsible sections
  const Section = ({
    id,
    title,
    icon,
    ContentComponent
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    ContentComponent: React.LazyExoticComponent<() => JSX.Element>;
  }) => {
    const isOpen = openSection === id;
    const ariaExpanded = isOpen ? 'true' : 'false';

    return (
      <div className="mb-4 border rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full p-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-expanded={ariaExpanded}
          aria-controls={`section-content-${id}`}
        >
          <div className="flex items-center gap-2 text-lg font-medium text-blue-800">
            {icon}
            {title}
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
        </button>

        {isOpen && (
          <div id={`section-content-${id}`} className="p-4 text-gray-700">
            <Suspense fallback={<SectionLoading />}>
              <ContentComponent />
            </Suspense>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">AI CV Builder Help Guide</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Our AI-powered CV builder helps you create professional, tailored CVs that stand out to South African employers.
        </p>
      </div>

      <Section
        id="getting-started"
        title="Getting Started"
        icon={<FileText className="h-5 w-5" />}
        ContentComponent={GettingStartedContent}
      />
      <Section
        id="personal-info"
        title="Personal Information"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={PersonalInfoContent}
      />
      <Section
        id="professional-summary"
        title="Professional Summary"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={ProfessionalSummaryContent}
      />
      <Section
        id="work-experience"
        title="Work Experience"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={WorkExperienceContent}
      />
      <Section
        id="education"
        title="Education"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={EducationContent}
      />
      <Section
        id="skills"
        title="Skills & Languages"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={SkillsLanguagesContent}
      />
      <Section
        id="references"
        title="References"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={ReferencesContent}
      />
      <Section
        id="generating"
        title="Generating Your CV"
        icon={<Download className="h-5 w-5" />}
        ContentComponent={GeneratingCVContent}
      />
      <Section
        id="industry-tips"
        title="Industry-Specific Tips"
        icon={<HelpCircle className="h-5 w-5" />}
        ContentComponent={IndustryTipsContent}
      />
      <Section
        id="troubleshooting"
        title="Troubleshooting & Support"
        icon={<AlertCircle className="h-5 w-5" />}
        ContentComponent={TroubleshootingSupportContent}
      />

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">Last updated: May 2024</p>
      </div>
    </div>
  );
}
