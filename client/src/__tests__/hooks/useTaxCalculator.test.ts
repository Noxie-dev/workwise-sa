import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTaxCalculator } from '../../components/salary/hooks/useTaxCalculator';

describe('useTaxCalculator', () => {
  // Default deduction rates for testing
  const defaultDeductionRates = {
    uif: 0.01,
    pension: 0.075,
    medical: 0.0175,
    groupLife: 0.0075,
    retirement: 0.05,
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

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    expect(result.current.incomeTax).toBe(0);
    expect(result.current.effectiveTaxRate).toBe(0);
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

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    // Tax should be calculated based on the first bracket
    expect(result.current.incomeTax).toBeGreaterThan(0);
    expect(result.current.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.current.effectiveTaxRate).toBeLessThan(0.2); // Should be less than 20%
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

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    // UIF is capped at a certain amount
    const monthlyGross = annualGross / 12;
    const expectedMonthlyUIF = Math.min(monthlyGross * defaultDeductionRates.uif, 177.12);
    const expectedAnnualUIF = expectedMonthlyUIF * 12;

    expect(result.current.uif).toBeCloseTo(expectedAnnualUIF, 1);
  });

  it('should not calculate UIF when inactive', () => {
    const annualGross = 300000;
    const activeDeductions = {
      uif: false,
      pension: false,
      medical: false,
      groupLife: false,
      retirement: false,
    };

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    expect(result.current.uif).toBe(0);
  });

  it('should calculate pension correctly when active', () => {
    const annualGross = 300000;
    const activeDeductions = {
      uif: false,
      pension: true,
      medical: false,
      groupLife: false,
      retirement: false,
    };

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    const expectedPension = annualGross * defaultDeductionRates.pension;
    expect(result.current.pension).toBeCloseTo(expectedPension, 1);
  });

  it('should calculate all deductions correctly when active', () => {
    const annualGross = 500000;
    const activeDeductions = {
      uif: true,
      pension: true,
      medical: true,
      groupLife: true,
      retirement: true,
    };

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    // Check that all deductions are calculated
    expect(result.current.uif).toBeGreaterThan(0);
    expect(result.current.pension).toBeGreaterThan(0);
    expect(result.current.medical).toBeGreaterThan(0);
    expect(result.current.groupLife).toBeGreaterThan(0);
    expect(result.current.retirement).toBeGreaterThan(0);

    // Check that total deductions are the sum of all individual deductions
    const totalDeductions =
      result.current.uif +
      result.current.pension +
      result.current.medical +
      result.current.groupLife +
      result.current.retirement;

    expect(result.current.totalDeductions).toBeCloseTo(totalDeductions, 1);
  });

  it('should calculate take-home pay correctly', () => {
    const annualGross = 400000;
    const activeDeductions = {
      uif: true,
      pension: true,
      medical: false,
      groupLife: false,
      retirement: false,
    };

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    const expectedTakeHome = annualGross - result.current.incomeTax - result.current.totalDeductions;
    expect(result.current.takeHomePay).toBeCloseTo(expectedTakeHome, 1);
  });

  it('should calculate monthly values correctly', () => {
    const annualGross = 360000; // 30,000 per month
    const activeDeductions = {
      uif: true,
      pension: true,
      medical: false,
      groupLife: false,
      retirement: false,
    };

    const { result } = renderHook(() =>
      useTaxCalculator(annualGross, activeDeductions, defaultDeductionRates)
    );

    expect(result.current.monthlyGross).toBeCloseTo(30000, 1);
    expect(result.current.monthlyTakeHome).toBeCloseTo(result.current.takeHomePay / 12, 1);
  });
});
