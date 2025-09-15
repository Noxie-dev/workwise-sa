import { describe, it, expect } from 'vitest';

describe('useTaxCalculator mock', () => {
  // Mock tax calculation function
  const calculateTax = (annualGross, activeDeductions, deductionRates, medicalAidMembers = 0) => {
    // Default deduction rates
    const rates = {
      uif: 0.01,
      pension: 0.075,
      medical: 0.0175,
      groupLife: 0.0075,
      retirement: 0.05,
      ...deductionRates
    };

    // Calculate deductions
    const uif = activeDeductions.uif ? Math.min(annualGross / 12 * rates.uif, 177.12) * 12 : 0;
    const pension = activeDeductions.pension ? Math.min(annualGross * rates.pension, 350000) : 0;
    const medical = activeDeductions.medical ? annualGross * rates.medical : 0;
    const groupLife = activeDeductions.groupLife ? annualGross * rates.groupLife : 0;
    const retirement = activeDeductions.retirement ? Math.min(annualGross * rates.retirement, 350000) : 0;

    // Total deductions
    const totalDeductions = uif + pension + medical + groupLife + retirement;

    // Taxable income
    const taxableIncome = annualGross - pension - retirement;

    // Calculate income tax (simplified for testing)
    let incomeTax = 0;
    if (taxableIncome > 226000) {
      incomeTax = 40500 + (taxableIncome - 226000) * 0.26;
    } else if (taxableIncome > 91250) {
      incomeTax = 16425 + (taxableIncome - 91250) * 0.31;
    } else if (taxableIncome > 87300) { // Tax threshold
      incomeTax = taxableIncome * 0.18;
    }

    // Apply medical tax credits
    const medicalTaxCredit = medicalAidMembers * 347 * 12; // R347 per member per month
    incomeTax = Math.max(0, incomeTax - medicalTaxCredit);

    // Calculate take-home pay
    const takeHomePay = annualGross - incomeTax - totalDeductions;

    // Calculate effective tax rate
    const effectiveTaxRate = incomeTax / annualGross;

    // Monthly values
    const monthlyGross = annualGross / 12;
    const monthlyTakeHome = takeHomePay / 12;

    return {
      incomeTax,
      uif,
      pension,
      medical,
      groupLife,
      retirement,
      totalDeductions,
      takeHomePay,
      effectiveTaxRate,
      monthlyGross,
      monthlyTakeHome
    };
  };

  it('should calculate zero tax for income below threshold', () => {
    const annualGross = 80000; // Below tax threshold
    const activeDeductions = {
      uif: true,
      pension: false,
      medical: false,
      groupLife: false,
      retirement: false,
    };
    const deductionRates = {
      uif: 0.01,
      pension: 0.075,
      medical: 0.0175,
      groupLife: 0.0075,
      retirement: 0.05,
    };

    const result = calculateTax(annualGross, activeDeductions, deductionRates);

    expect(result.incomeTax).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it('should calculate correct tax for income in first bracket', () => {
    const annualGross = 250000; // In first tax bracket
    const activeDeductions = {
      uif: true,
      pension: false,
      medical: false,
      groupLife: false,
      retirement: false,
    };
    const deductionRates = {
      uif: 0.01,
      pension: 0.075,
      medical: 0.0175,
      groupLife: 0.0075,
      retirement: 0.05,
    };

    const result = calculateTax(annualGross, activeDeductions, deductionRates);

    // Tax should be calculated based on the first bracket
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeLessThan(0.2); // Should be less than 20%
  });

  it('should calculate UIF correctly when active', () => {
    const annualGross = 300000;
    const activeDeductions = {
      uif: true,
      pension: false,
      medical: false,
      groupLife: false,
      retirement: false,
    };
    const deductionRates = {
      uif: 0.01,
      pension: 0.075,
      medical: 0.0175,
      groupLife: 0.0075,
      retirement: 0.05,
    };

    const result = calculateTax(annualGross, activeDeductions, deductionRates);

    // UIF is capped at a certain amount
    const monthlyGross = annualGross / 12;
    const expectedMonthlyUIF = Math.min(monthlyGross * deductionRates.uif, 177.12);
    const expectedAnnualUIF = expectedMonthlyUIF * 12;

    expect(result.uif).toBeCloseTo(expectedAnnualUIF, 1);
  });

  it('should respect the pension/RA deduction cap', () => {
    const annualGross = 5000000; // High income to test cap
    const activeDeductions = {
      uif: false,
      pension: true,
      medical: false,
      groupLife: false,
      retirement: false,
    };
    const deductionRates = {
      uif: 0.01,
      pension: 0.075,
      medical: 0.0175,
      groupLife: 0.0075,
      retirement: 0.05,
    };

    const result = calculateTax(annualGross, activeDeductions, deductionRates);

    // Pension should be capped at R350,000
    expect(result.pension).toBe(350000);
  });
});
