import { renderHook } from '@testing-library/react';
import { useSalaryConverter } from '../../hooks/useSalaryConverter';

describe('useSalaryConverter', () => {
  it('converts monthly salary to other frequencies correctly', () => {
    const { result } = renderHook(() => 
      useSalaryConverter(50000, 'monthly', 8, 5, 52)
    );
    
    const { calculatedAmounts } = result.current;
    
    // Monthly to annual: 50000 * 12 = 600000
    expect(calculatedAmounts.annual).toBeCloseTo(600000);
    
    // Annual to weekly: 600000 / 52 = 11538.46
    expect(calculatedAmounts.weekly).toBeCloseTo(11538.46, 1);
    
    // Weekly to daily: 11538.46 / 5 = 2307.69
    expect(calculatedAmounts.daily).toBeCloseTo(2307.69, 1);
    
    // Daily to hourly: 2307.69 / 8 = 288.46
    expect(calculatedAmounts.hourly).toBeCloseTo(288.46, 1);
  });

  it('converts annual salary to other frequencies correctly', () => {
    const { result } = renderHook(() => 
      useSalaryConverter(600000, 'annual', 8, 5, 52)
    );
    
    const { calculatedAmounts } = result.current;
    
    // Annual to monthly: 600000 / 12 = 50000
    expect(calculatedAmounts.monthly).toBeCloseTo(50000);
    
    // Annual to fortnightly: 600000 / 26 = 23076.92
    expect(calculatedAmounts.fortnightly).toBeCloseTo(23076.92, 1);
  });

  it('converts hourly rate to other frequencies correctly', () => {
    const { result } = renderHook(() => 
      useSalaryConverter(300, 'hourly', 8, 5, 52)
    );
    
    const { calculatedAmounts } = result.current;
    
    // Hourly to daily: 300 * 8 = 2400
    expect(calculatedAmounts.daily).toBeCloseTo(2400);
    
    // Daily to weekly: 2400 * 5 = 12000
    expect(calculatedAmounts.weekly).toBeCloseTo(12000);
    
    // Weekly to annual: 12000 * 52 = 624000
    expect(calculatedAmounts.annual).toBeCloseTo(624000);
    
    // Annual to monthly: 624000 / 12 = 52000
    expect(calculatedAmounts.monthly).toBeCloseTo(52000);
  });

  it('handles zero and invalid inputs gracefully', () => {
    const { result } = renderHook(() => 
      useSalaryConverter(0, 'monthly', 8, 5, 52)
    );
    
    const { calculatedAmounts } = result.current;
    
    // All values should be 0
    expect(calculatedAmounts.annual).toBe(0);
    expect(calculatedAmounts.monthly).toBe(0);
    expect(calculatedAmounts.weekly).toBe(0);
    expect(calculatedAmounts.daily).toBe(0);
    expect(calculatedAmounts.hourly).toBe(0);
  });

  it('uses advanced settings when provided', () => {
    // Test with non-standard work schedule: 6 hours/day, 4 days/week, 48 weeks/year
    const { result } = renderHook(() => 
      useSalaryConverter(50000, 'monthly', 6, 4, 48)
    );
    
    const { calculatedAmounts } = result.current;
    
    // Monthly to annual: 50000 * 12 = 600000
    expect(calculatedAmounts.annual).toBeCloseTo(600000);
    
    // Annual to weekly: 600000 / 48 = 12500
    expect(calculatedAmounts.weekly).toBeCloseTo(12500);
    
    // Weekly to daily: 12500 / 4 = 3125
    expect(calculatedAmounts.daily).toBeCloseTo(3125);
    
    // Daily to hourly: 3125 / 6 = 520.83
    expect(calculatedAmounts.hourly).toBeCloseTo(520.83, 1);
  });
});
