import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillsHeatmap from '../SkillsHeatmap';

describe('SkillsHeatmap', () => {
  const mockData = {
    marketDemand: [
      { skill: 'JavaScript', demand: 85, growth: 12 },
      { skill: 'Python', demand: 78, growth: 18 },
      { skill: 'React', demand: 72, growth: 15 },
    ],
    userSkills: [
      { skill: 'JavaScript', level: 'Intermediate' },
      { skill: 'HTML/CSS', level: 'Advanced' },
    ],
    recommendations: [
      { skill: 'React', reason: 'High demand in your preferred job categories' },
      { skill: 'Python', reason: 'Fastest growing skill in the market' },
    ]
  };

  it('renders loading state correctly', () => {
    render(<SkillsHeatmap isLoading={true} />);
    
    expect(screen.getByText('Skills Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Visualization of skills demand and growth')).toBeInTheDocument();
    
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state correctly', () => {
    render(<SkillsHeatmap isLoading={false} data={undefined} />);
    
    expect(screen.getByText('Skills Heatmap')).toBeInTheDocument();
    expect(screen.getByText('No skills data available')).toBeInTheDocument();
  });

  it('renders data correctly', () => {
    render(<SkillsHeatmap isLoading={false} data={mockData} />);
    
    expect(screen.getByText('Skills Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Current market demand for skills')).toBeInTheDocument();
    
    // Check for skill tiles
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('toggles between demand and growth views', () => {
    render(<SkillsHeatmap isLoading={false} data={mockData} />);
    
    // Initially shows demand view
    expect(screen.getByText('Current market demand for skills')).toBeInTheDocument();
    
    // Find and click the select
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    // Select growth view
    const growthOption = screen.getByText('Growth');
    fireEvent.click(growthOption);
    
    // Now shows growth view
    expect(screen.getByText('Year-on-year growth rate for skills')).toBeInTheDocument();
  });

  it('calls export function when export button is clicked', () => {
    const mockExport = vi.fn();
    render(<SkillsHeatmap isLoading={false} data={mockData} onExport={mockExport} />);
    
    // Find and click the export button
    const exportButton = screen.getByRole('button', { name: '' }); // The button only has an icon
    fireEvent.click(exportButton);
    
    expect(mockExport).toHaveBeenCalledTimes(1);
  });
});
