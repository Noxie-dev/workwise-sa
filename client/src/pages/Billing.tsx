import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { apiRequest } from "@/lib/queryClient";

type BillingPlan = {
  code: string;
  displayName: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingInterval: string;
};

async function fetchPlans(): Promise<BillingPlan[]> {
  const response = await fetch("/api/billing/plans");
  if (!response.ok) {
    throw new Error("Failed to load plans");
  }
  const payload = await response.json();
  return payload.plans || [];
}

function submitPayfastForm(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function Billing() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: entitlements } = useEntitlements();
  const [waitlistEmail, setWaitlistEmail] = useState(currentUser?.email || "");

  const { data: plans = [] } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: fetchPlans,
  });
  const plusPlan = plans.find((plan) => plan.code === "workwise_plus");

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/checkout", { planCode: "workwise_plus" });
      return response.json();
    },
    onSuccess: (checkout) => {
      submitPayfastForm(checkout.actionUrl, checkout.fields);
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout unavailable",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/billing/pro-interest", {
        email,
        source: "billing_page",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "You're on the Pro waitlist",
        description: "We'll let you know when WorkWise Pro opens.",
      });
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not join waitlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWaitlist = (event: FormEvent) => {
    event.preventDefault();
    if (!waitlistEmail.trim()) return;
    waitlistMutation.mutate(waitlistEmail.trim());
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-slate-950">WorkWise Plus</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Unlock unlimited AI CVs and cover letters, remove ads, and get Candidate Promotion Lite.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                WorkWise Plus
              </CardTitle>
              {entitlements?.workwisePlusActive && <Badge>Active</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <span className="text-4xl font-bold">
                R{plusPlan ? Math.round(plusPlan.priceCents / 100) : 49}
              </span>
              <span className="text-sm text-slate-500"> / month</span>
            </div>

            <ul className="grid gap-3 text-sm text-slate-700">
              {[
                "Unlimited AI CV generation",
                "Unlimited AI cover-letter generation",
                "No ads across supported placements",
                "Candidate Promotion Lite",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              disabled={!currentUser || checkoutMutation.isPending || entitlements?.workwisePlusActive}
              onClick={() => checkoutMutation.mutate()}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {entitlements?.workwisePlusActive ? "Plus Active" : "Subscribe with PayFast"}
            </Button>
            {!currentUser && (
              <p className="text-xs text-slate-500">Sign in before subscribing to attach Plus to your account.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>AI CV generations left: {entitlements?.hasUnlimitedAiCv ? "Unlimited" : entitlements?.remainingFreeCvGenerations ?? 0}</p>
            <p>AI cover letters left: {entitlements?.hasUnlimitedAiCoverLetters ? "Unlimited" : entitlements?.remainingFreeCoverLetterGenerations ?? 0}</p>
            <p>Ads: {entitlements?.adsEnabled ? "Enabled" : "Disabled"}</p>
            <p>Promotion Lite: {entitlements?.candidatePromotionLite ? "Enabled" : "Not enabled"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WorkWise Pro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm leading-6 text-slate-600">
              Coming soon: AI Job Match, priority visibility, and Interview AI.
            </p>
            <form onSubmit={handleWaitlist} className="mt-4 flex max-w-md gap-2">
              <Input
                type="email"
                value={waitlistEmail}
                onChange={(event) => setWaitlistEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" disabled={waitlistMutation.isPending}>
                Join Waitlist
              </Button>
            </form>
          </div>
          <Badge variant="outline" className="justify-center py-2">Coming Soon</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
