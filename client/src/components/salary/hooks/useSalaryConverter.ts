import { useMemo } from 'react';

interface SalaryAmounts {
  hourly: number;
  daily: number;
  weekly: number;
  fortnightly: number;
  monthly: number;
  annual: number;
}

/**
 * Custom hook for converting salary amounts between different frequencies
 * 
 * @param amount - The salary amount to convert
 * @param inputType - The frequency of the input amount (hourly, daily, weekly, fortnightly, monthly, annual)
 * @param hoursPerDay - Number of working hours per day (default: 8)
 * @param daysPerWeek - Number of working days per week (default: 5)
 * @param weeksPerYear - Number of working weeks per year (default: 52)
 * @returns Object containing converted salary amounts for all frequencies
 */
export const useSalaryConverter = (
  amount: number,
  inputType: string,
  hoursPerDay: number,
  daysPerWeek: number,
  weeksPerYear: number
) => {
  const calculatedAmounts = useMemo(() => {
    let annualGross = 0;
    const parsedAmount = parseFloat(amount.toString()) || 0;

    // Basic calculation: 52 weeks, 5 days/week, 8 hours/day if not advanced
    const effHoursPerDay = hoursPerDay > 0 ? hoursPerDay : 8;
    const effDaysPerWeek = daysPerWeek > 0 ? daysPerWeek : 5;
    const effWeeksPerYear = weeksPerYear > 0 ? weeksPerYear : 52; // Using 52 for gross, specific working weeks for hourly if advanced
    
    const hoursPerWeek = effHoursPerDay * effDaysPerWeek;
    const hoursPerYear = hoursPerWeek * effWeeksPerYear;

    switch (inputType) {
      case 'hourly':
        annualGross = parsedAmount * hoursPerYear;
        break;
      case 'daily':
        annualGross = parsedAmount * effDaysPerWeek * effWeeksPerYear;
        break;
      case 'weekly':
        annualGross = parsedAmount * effWeeksPerYear;
        break;
      case 'fortnightly':
        annualGross = parsedAmount * (effWeeksPerYear / 2);
        break;
      case 'monthly':
        annualGross = parsedAmount * 12;
        break;
      case 'annual':
        annualGross = parsedAmount;
        break;
      default:
        annualGross = 0;
    }

    const monthly = annualGross / 12;
    const fortnightly = annualGross / (effWeeksPerYear/2) || annualGross / 26; // Approx 26 fortnights
    const weekly = annualGross / effWeeksPerYear || annualGross / 52;
    const daily = weekly / effDaysPerWeek || 0;
    const hourly = daily / effHoursPerDay || 0;
    
    return {
      hourly: isFinite(hourly) ? hourly : 0,
      daily: isFinite(daily) ? daily : 0,
      weekly: isFinite(weekly) ? weekly : 0,
      fortnightly: isFinite(fortnightly) ? fortnightly : 0,
      monthly: isFinite(monthly) ? monthly : 0,
      annual: isFinite(annualGross) ? annualGross : 0,
    };
  }, [amount, inputType, hoursPerDay, daysPerWeek, weeksPerYear]);

  return { calculatedAmounts };
};

export default useSalaryConverter;
