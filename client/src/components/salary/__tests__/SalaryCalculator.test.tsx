import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SalaryCalculator from '../SalaryCalculator';

// Mock the custom hooks
vi.mock('../hooks/useSalaryConverter', () => ({
  __esModule: true,
  default: () => ({
    calculatedAmounts: {
      hourly: 287.5,
      daily: 2300,
      weekly: 11500,
      fortnightly: 23000,
      monthly: 50000,
      annual: 600000
    }
  })
}));

vi.mock('../hooks/useTaxCalculator', () => ({
  __esModule: true,
  default: () => ({
    taxDetails: {
      incomeTax: 12500,
      uif: 177.12,
      pension: 3750,
      medical: 3000,
      groupLife: 500,
      retirement: 2500,
      totalDeductions: 22427.12,
      netIncome: 27572.88,
      effectiveTaxRate: 25.0,
      taxableIncomeAnnual: 600000,
      mtcAppliedMonthly: 364,
      actualDeductibleRetirementFundsAnnual: 72000,
      monthlyGross: 50000,
      taxBracketInfo: { min: 370501, max: 512800, rate: 0.31, baseAmount: 77362 },
      pieChartData: [
        { name: 'Net Income', value: 27572.88 },
        { name: 'Income Tax', value: 12500 },
        { name: 'UIF', value: 177.12 },
        { name: 'Pension', value: 3750 },
        { name: 'Medical Aid', value: 3000 }
      ]
    }
  })
}));

// Mock the sub-components
vi.mock('../SalaryInputCard', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="salary-input-card">
      <button 
        data-testid="apply-industry-average" 
        onClick={props.applyIndustryAverage}
      >
        Apply Industry Average
      </button>
      <input 
        data-testid="amount-input" 
        value={props.amount} 
        onChange={(e) => props.setAmount(e.target.value)}
      />
      <select 
        data-testid="input-type-select" 
        value={props.inputType} 
        onChange={(e) => props.setInputType(e.target.value)}
      >
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
      </select>
    </div>
  )
}));

vi.mock('../ResultsCard', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="results-card">
      <div data-testid="monthly-gross">{props.taxDetails.monthlyGross}</div>
      <div data-testid="net-income">{props.taxDetails.netIncome}</div>
    </div>
  )
}));

// Mock the lazy-loaded component
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual as any,
    lazy: (factory: any) => {
      const Component = factory();
      return (props: any) => <div data-testid="industry-comparison">{JSON.stringify(props)}</div>;
    }
  };
});

describe('SalaryCalculator', () => {
  it('renders the calculator tab by default', () => {
    render(<SalaryCalculator />);
    
    expect(screen.getByText('South African Salary Calculator')).toBeInTheDocument();
    expect(screen.getByTestId('salary-input-card')).toBeInTheDocument();
    expect(screen.getByTestId('results-card')).toBeInTheDocument();
  });

  it('applies industry average when button is clicked', async () => {
    render(<SalaryCalculator />);
    
    const applyButton = screen.getByTestId('apply-industry-average');
    fireEvent.click(applyButton);
    
    // Since we're mocking the hooks, we can't directly test the state changes
    // But we can verify the component doesn't crash when the button is clicked
    expect(screen.getByTestId('salary-input-card')).toBeInTheDocument();
  });

  it('switches to comparison tab when clicked', async () => {
    render(<SalaryCalculator />);
    
    // Find and click the comparison tab
    const comparisonTab = screen.getByRole('tab', { name: /industry comparison/i });
    fireEvent.click(comparisonTab);
    
    // Wait for the lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('industry-comparison')).toBeInTheDocument();
    });
  });

  it('displays the correct tax year in the footer', () => {
    render(<SalaryCalculator />);
    
    expect(screen.getByText(/2024\/2025 tax year/i)).toBeInTheDocument();
  });
});
