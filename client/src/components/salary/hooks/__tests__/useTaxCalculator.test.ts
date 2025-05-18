import { renderHook } from '@testing-library/react';
import { useTaxCalculator } from '../../hooks/useTaxCalculator';

describe('useTaxCalculator', () => {
  it('calculates tax correctly for a basic scenario', () => {
    const activeDeductions = {
      pension: false,
      medical: false,
      groupLife: false,
      retirement: false
    };
    
    const deductionRates = {
      pension: 0.075,
      medical: 0.06,
      groupLife: 0.01,
      retirement: 0.05
    };
    
    const { result } = renderHook(() => 
      useTaxCalculator(600000, activeDeductions, deductionRates, 0)
    );
    
    const { taxDetails } = result.current;
    
    // Monthly gross: 600000 / 12 = 50000
    expect(taxDetails.monthlyGross).toBeCloseTo(50000);
    
    // For 600000 annual income, tax should be in the 31% bracket
    // Tax = 77362 + (600000 - 370501) * 0.31 = 77362 + 71225.69 = 148587.69
    // Monthly tax = 148587.69 / 12 = 12382.31
    expect(taxDetails.incomeTax).toBeCloseTo(12382.31, 0);
    
    // UIF is capped at 177.12 per month (1% of 17712)
    expect(taxDetails.uif).toBeCloseTo(177.12, 2);
    
    // No other deductions active
    expect(taxDetails.pension).toBe(0);
    expect(taxDetails.medical).toBe(0);
    expect(taxDetails.groupLife).toBe(0);
    expect(taxDetails.retirement).toBe(0);
    
    // Total deductions = 12382.31 + 177.12 = 12559.43
    expect(taxDetails.totalDeductions).toBeCloseTo(12559.43, 0);
    
    // Net income = 50000 - 12559.43 = 37440.57
    expect(taxDetails.netIncome).toBeCloseTo(37440.57, 0);
  });

  it('calculates tax with pension deduction correctly', () => {
    const activeDeductions = {
      pension: true,
      medical: false,
      groupLife: false,
      retirement: false
    };
    
    const deductionRates = {
      pension: 0.075,
      medical: 0.06,
      groupLife: 0.01,
      retirement: 0.05
    };
    
    const { result } = renderHook(() => 
      useTaxCalculator(600000, activeDeductions, deductionRates, 0)
    );
    
    const { taxDetails } = result.current;
    
    // Monthly gross: 600000 / 12 = 50000
    expect(taxDetails.monthlyGross).toBeCloseTo(50000);
    
    // Pension: 50000 * 0.075 = 3750 per month, 45000 per year
    expect(taxDetails.pension).toBeCloseTo(3750);
    
    // Taxable income: 600000 - 45000 = 555000
    // For 555000 annual income, tax should be in the 31% bracket
    // Tax = 77362 + (555000 - 370501) * 0.31 = 77362 + 57155.31 = 134517.31
    // Monthly tax = 134517.31 / 12 = 11209.78
    expect(taxDetails.incomeTax).toBeCloseTo(11209.78, 0);
    
    // UIF is capped at 177.12 per month
    expect(taxDetails.uif).toBeCloseTo(177.12, 2);
    
    // Total deductions = 11209.78 + 177.12 + 3750 = 15136.9
    expect(taxDetails.totalDeductions).toBeCloseTo(15136.9, 0);
    
    // Net income = 50000 - 15136.9 = 34863.1
    expect(taxDetails.netIncome).toBeCloseTo(34863.1, 0);
  });

  it('applies medical tax credits correctly', () => {
    const activeDeductions = {
      pension: false,
      medical: true,
      groupLife: false,
      retirement: false
    };
    
    const deductionRates = {
      pension: 0.075,
      medical: 0.06,
      groupLife: 0.01,
      retirement: 0.05
    };
    
    // Test with 2 medical aid members
    const { result } = renderHook(() => 
      useTaxCalculator(600000, activeDeductions, deductionRates, 2)
    );
    
    const { taxDetails } = result.current;
    
    // Monthly gross: 600000 / 12 = 50000
    expect(taxDetails.monthlyGross).toBeCloseTo(50000);
    
    // Medical aid contribution: 50000 * 0.06 = 3000 per month
    expect(taxDetails.medical).toBeCloseTo(3000);
    
    // Medical tax credits for 2 members: 364 + 364 = 728 per month
    expect(taxDetails.mtcAppliedMonthly).toBeCloseTo(728);
    
    // For 600000 annual income, tax before MTC should be in the 31% bracket
    // Tax before MTC = 77362 + (600000 - 370501) * 0.31 = 77362 + 71225.69 = 148587.69
    // Monthly tax before MTC = 148587.69 / 12 = 12382.31
    // Monthly tax after MTC = 12382.31 - 728 = 11654.31
    expect(taxDetails.incomeTax).toBeCloseTo(11654.31, 0);
    
    // UIF is capped at 177.12 per month
    expect(taxDetails.uif).toBeCloseTo(177.12, 2);
    
    // Total deductions = 11654.31 + 177.12 + 3000 = 14831.43
    expect(taxDetails.totalDeductions).toBeCloseTo(14831.43, 0);
    
    // Net income = 50000 - 14831.43 = 35168.57
    expect(taxDetails.netIncome).toBeCloseTo(35168.57, 0);
  });

  it('handles zero income correctly', () => {
    const activeDeductions = {
      pension: true,
      medical: true,
      groupLife: true,
      retirement: true
    };
    
    const deductionRates = {
      pension: 0.075,
      medical: 0.06,
      groupLife: 0.01,
      retirement: 0.05
    };
    
    const { result } = renderHook(() => 
      useTaxCalculator(0, activeDeductions, deductionRates, 1)
    );
    
    const { taxDetails } = result.current;
    
    // All values should be 0
    expect(taxDetails.monthlyGross).toBe(0);
    expect(taxDetails.incomeTax).toBe(0);
    expect(taxDetails.uif).toBe(0);
    expect(taxDetails.pension).toBe(0);
    expect(taxDetails.medical).toBe(0);
    expect(taxDetails.groupLife).toBe(0);
    expect(taxDetails.retirement).toBe(0);
    expect(taxDetails.totalDeductions).toBe(0);
    expect(taxDetails.netIncome).toBe(0);
  });

  it('respects the pension/RA deduction cap', () => {
    const activeDeductions = {
      pension: true,
      medical: false,
      groupLife: false,
      retirement: true
    };
    
    // Set high rates to test the cap
    const deductionRates = {
      pension: 0.20,
      medical: 0.06,
      groupLife: 0.01,
      retirement: 0.15
    };
    
    // Test with a high income to hit the cap
    const { result } = renderHook(() => 
      useTaxCalculator(2000000, activeDeductions, deductionRates, 0)
    );
    
    const { taxDetails } = result.current;
    
    // Monthly gross: 2000000 / 12 = 166666.67
    expect(taxDetails.monthlyGross).toBeCloseTo(166666.67, 1);
    
    // Combined pension and RA would be 35% of income, but should be capped at 27.5% with annual cap of 350000
    // The cap should be 350000 per year
    expect(taxDetails.actualDeductibleRetirementFundsAnnual).toBeCloseTo(350000);
  });
});
