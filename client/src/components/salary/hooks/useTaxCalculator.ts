import { useMemo } from 'react';

// South African Income Tax Brackets for 2024/2025
const taxBrackets2024 = [
  { min: 0, max: 237100, rate: 0.18, baseAmount: 0 },
  { min: 237101, max: 370500, rate: 0.26, baseAmount: 42678 },
  { min: 370501, max: 512800, rate: 0.31, baseAmount: 77362 },
  { min: 512801, max: 673000, rate: 0.36, baseAmount: 121475 },
  { min: 673001, max: 857900, rate: 0.39, baseAmount: 179147 },
  { min: 857901, max: 1817000, rate: 0.41, baseAmount: 251258 },
  { min: 1817001, max: Infinity, rate: 0.45, baseAmount: 644489 }
];

// UIF
const UIF_RATE = 0.01; // 1%
const UIF_SALARY_CEILING_MONTHLY = 17712; // Employee contribution is 1% of remuneration up to this monthly amount
const UIF_MAX_MONTHLY_CONTRIBUTION = UIF_SALARY_CEILING_MONTHLY * UIF_RATE;

// Medical Tax Credits (MTC) for 2024/2025 (monthly)
const MTC_RATES = {
  mainMember: 364,
  firstDependant: 364,
  additionalDependant: 246,
};

// Pension/RA Deductibility Limits
const PENSION_RA_DEDUCTIBILITY_RATE = 0.275; // 27.5%
const PENSION_RA_ANNUAL_CAP = 350000;

interface TaxDetails {
  incomeTax: number;
  uif: number;
  pension: number;
  medical: number;
  groupLife: number;
  retirement: number;
  totalDeductions: number;
  netIncome: number;
  effectiveTaxRate: number;
  taxableIncomeAnnual: number;
  mtcAppliedMonthly: number;
  actualDeductibleRetirementFundsAnnual: number;
  monthlyGross: number;
  taxBracketInfo: any;
  pieChartData: Array<{name: string, value: number}>;
}

/**
 * Custom hook for calculating South African income tax and deductions
 * 
 * @param annualGross - Annual gross income
 * @param activeDeductions - Object indicating which deductions are active
 * @param deductionRates - Object containing rates for each deduction
 * @param medicalAidMembers - Number of medical aid members for MTC calculation
 * @returns Object containing detailed tax and deduction information
 */
export const useTaxCalculator = (
  annualGross: number,
  activeDeductions: Record<string, boolean>,
  deductionRates: Record<string, number>,
  medicalAidMembers: number = 0
) => {
  const taxDetails = useMemo<TaxDetails>(() => {
    if (annualGross <= 0) {
      return {
        incomeTax: 0, uif: 0, pension: 0, medical: 0, groupLife: 0, retirement: 0,
        totalDeductions: 0, netIncome: 0, effectiveTaxRate: 0, taxableIncomeAnnual: 0,
        mtcAppliedMonthly: 0, actualDeductibleRetirementFundsAnnual: 0,
        monthlyGross: 0, pieChartData: [], taxBracketInfo: {}
      };
    }

    const monthlyGross = annualGross / 12;

    // Calculate individual deductions
    const pensionContribution = activeDeductions.pension ? monthlyGross * deductionRates.pension : 0;
    const medicalAidContribution = activeDeductions.medical ? monthlyGross * deductionRates.medical : 0;
    const groupLifeContribution = activeDeductions.groupLife ? monthlyGross * deductionRates.groupLife : 0;
    const retirementAnnuityContribution = activeDeductions.retirement ? monthlyGross * deductionRates.retirement : 0;

    // Calculate tax-deductible portion of Pension and RA
    const annualPensionContribution = pensionContribution * 12;
    const annualRAContribution = retirementAnnuityContribution * 12;
    const totalRetirementFundContributions = annualPensionContribution + annualRAContribution;
    
    // Calculate allowable deduction for retirement funds
    // The 27.5% is of the greater of remuneration or taxable income *before* this deduction.
    // For simplicity, we use annualGross (remuneration) as the primary base.
    const maxDeductibleOverall = Math.min(annualGross * PENSION_RA_DEDUCTIBILITY_RATE, PENSION_RA_ANNUAL_CAP);
    const actualDeductibleRetirementFunds = Math.min(totalRetirementFundContributions, maxDeductibleOverall);

    const taxableIncome = annualGross - actualDeductibleRetirementFunds;

    // Calculate Income Tax (PAYE)
    let annualTax = 0;
    let taxBracketInfo = {};
    for (const bracket of taxBrackets2024) {
      if (taxableIncome > bracket.min) {
        taxBracketInfo = bracket;
        if (taxableIncome <= bracket.max) {
          annualTax = bracket.baseAmount + (taxableIncome - bracket.min) * bracket.rate;
          break;
        } else if (bracket.max === Infinity) { // Last bracket
          annualTax = bracket.baseAmount + (taxableIncome - bracket.min) * bracket.rate;
          break;
        }
      }
    }
    annualTax = Math.max(0, annualTax); // Ensure tax is not negative

    // Calculate Medical Tax Credits (MTC)
    let monthlyMTC = 0;
    if (activeDeductions.medical && medicalAidMembers > 0) {
      monthlyMTC += MTC_RATES.mainMember;
      if (medicalAidMembers > 1) {
        monthlyMTC += MTC_RATES.firstDependant;
      }
      if (medicalAidMembers > 2) {
        monthlyMTC += (medicalAidMembers - 2) * MTC_RATES.additionalDependant;
      }
    }
    const annualMTC = monthlyMTC * 12;

    // Adjusted annual tax after MTC
    const finalAnnualTax = Math.max(0, annualTax - annualMTC);
    const monthlyIncomeTax = finalAnnualTax / 12;

    // Calculate UIF
    const uifPayable = Math.min(monthlyGross, UIF_SALARY_CEILING_MONTHLY) * UIF_RATE;

    const totalMonthlyDeductions =
      monthlyIncomeTax +
      uifPayable +
      pensionContribution +
      medicalAidContribution +
      groupLifeContribution +
      retirementAnnuityContribution;

    const netMonthlyIncome = monthlyGross - totalMonthlyDeductions;
    const effectiveTaxRate = taxableIncome > 0 ? (finalAnnualTax / taxableIncome) * 100 : 0;

    const pieChartData = [
      { name: 'Net Income', value: parseFloat(netMonthlyIncome.toFixed(2)) },
      { name: 'Income Tax', value: parseFloat(monthlyIncomeTax.toFixed(2)) },
      { name: 'UIF', value: parseFloat(uifPayable.toFixed(2)) },
    ];
    if (activeDeductions.pension && pensionContribution > 0) pieChartData.push({ name: 'Pension', value: parseFloat(pensionContribution.toFixed(2)) });
    if (activeDeductions.medical && medicalAidContribution > 0) pieChartData.push({ name: 'Medical Aid', value: parseFloat(medicalAidContribution.toFixed(2)) });
    if (activeDeductions.groupLife && groupLifeContribution > 0) pieChartData.push({ name: 'Group Life', value: parseFloat(groupLifeContribution.toFixed(2)) });
    if (activeDeductions.retirement && retirementAnnuityContribution > 0) pieChartData.push({ name: 'Ret. Annuity', value: parseFloat(retirementAnnuityContribution.toFixed(2)) });
    
    return {
      incomeTax: monthlyIncomeTax,
      uif: uifPayable,
      pension: pensionContribution,
      medical: medicalAidContribution,
      groupLife: groupLifeContribution,
      retirement: retirementAnnuityContribution,
      totalDeductions: totalMonthlyDeductions,
      netIncome: netMonthlyIncome,
      effectiveTaxRate: effectiveTaxRate,
      taxableIncomeAnnual: taxableIncome,
      mtcAppliedMonthly: monthlyMTC,
      actualDeductibleRetirementFundsAnnual: actualDeductibleRetirementFunds,
      monthlyGross: monthlyGross,
      taxBracketInfo: taxBracketInfo,
      pieChartData: pieChartData.filter(d => d.value > 0.005) // Filter out tiny values for cleaner chart
    };
  }, [annualGross, activeDeductions, deductionRates, medicalAidMembers]);

  return { taxDetails };
};

export default useTaxCalculator;
