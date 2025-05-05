import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillsRadarChart from '../SkillsRadarChart';

// Mock Recharts components
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    RadarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="radar-chart">{children}</div>
    ),
    PolarGrid: () => <div data-testid="polar-grid" />,
    PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
    Radar: ({ name }: { name: string }) => <div data-testid={`radar-${name.toLowerCase().replace(/\s+/g, '-')}`} />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe('SkillsRadarChart', () => {
  const mockData = {
    marketDemand: [
      { skill: 'JavaScript', demand: 85, growth: 12 },
      { skill: 'Python', demand: 78, growth: 18 },
      { skill: 'React', demand: 72, growth: 15 },
      { skill: 'Data Analysis', demand: 68, growth: 22 },
      { skill: 'Project Management', demand: 65, growth: 8 },
      { skill: 'SQL', demand: 60, growth: 5 },
    ],
    userSkills: [
      { skill: 'JavaScript', level: 'Intermediate' },
      { skill: 'HTML/CSS', level: 'Advanced' },
      { skill: 'Communication', level: 'Advanced' },
    ],
    recommendations: [
      { skill: 'React', reason: 'High demand in your preferred job categories' },
      { skill: 'Python', reason: 'Fastest growing skill in the market' },
      { skill: 'SQL', reason: 'Complements your existing JavaScript skills' }
    ]
  };

  it('renders loading state correctly', () => {
    render(<SkillsRadarChart isLoading={true} />);
    
    expect(screen.getByText('Skills Radar Analysis')).toBeInTheDocument();
    expect(screen.getByText('Comparison of your skills vs market demand')).toBeInTheDocument();
    
    // Check for skeleton loaders
    const skeleton = document.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(<SkillsRadarChart isLoading={false} data={undefined} />);
    
    expect(screen.getByText('Skills Radar Analysis')).toBeInTheDocument();
    expect(screen.getByText('No skills data available')).toBeInTheDocument();
  });

  it('renders radar chart with data correctly', () => {
    render(<SkillsRadarChart isLoading={false} data={mockData} />);
    
    expect(screen.getByText('Skills Radar Analysis')).toBeInTheDocument();
    expect(screen.getByText('Comparison of your skills vs market demand')).toBeInTheDocument();
    
    // Check for chart components
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('polar-grid')).toBeInTheDocument();
    expect(screen.getByTestId('polar-angle-axis')).toBeInTheDocument();
    expect(screen.getByTestId('polar-radius-axis')).toBeInTheDocument();
    expect(screen.getByTestId('radar-market-demand')).toBeInTheDocument();
    expect(screen.getByTestId('radar-your-skills')).toBeInTheDocument();
    expect(screen.getByTestId('radar-growth-rate')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('calls export function when export button is clicked', () => {
    const mockExport = vi.fn();
    render(<SkillsRadarChart isLoading={false} data={mockData} onExport={mockExport} />);
    
    // Find and click the export button
    const exportButton = screen.getByRole('button');
    fireEvent.click(exportButton);
    
    expect(mockExport).toHaveBeenCalledTimes(1);
  });
});
