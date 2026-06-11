import { useQuery } from '@tanstack/react-query';

export type UserEntitlements = {
  canGenerateCv: boolean;
  canGenerateCoverLetter: boolean;
  hasUnlimitedAiCv: boolean;
  hasUnlimitedAiCoverLetters: boolean;
  adsEnabled: boolean;
  candidatePromotionLite: boolean;
  remainingFreeCvGenerations: number;
  remainingFreeCoverLetterGenerations: number;
  workwisePlusActive: boolean;
  gracePeriodEndsAt?: string | null;
};

async function fetchEntitlements(): Promise<UserEntitlements> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  const response = await fetch('/api/entitlements/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error('Failed to load entitlements');
  }

  return response.json();
}

export function useEntitlements() {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: fetchEntitlements,
    staleTime: 60_000,
  });
}
