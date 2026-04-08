"use client";

import { useState, useEffect } from "react";
import { useApp } from "../lib/context/AppContext";
import AuthScreen from "../components/onboarding/AuthScreen";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import type { OnboardingAnswer } from "../lib/types";
import { userService } from "../lib/services/user-service";
import { useRouter } from "next/navigation";
import { CocktailIcon } from "../components/ui/Icons";
import { analyticsService, EVENTS } from "../lib/services/analytics-service";

export default function Page() {
  const { user, loading, refreshUser } = useApp();
  const [phase, setPhase] = useState<"loading" | "auth" | "onboarding" | "ready">("loading");
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPhase("auth");
    } else if (user.onboardingVector.length === 0) {
      setPhase("onboarding");
    } else {
      setPhase("ready");
      router.push("/home");
    }
  }, [user, loading, router]);

  const handleAuthSuccess = async () => {
    analyticsService.track(EVENTS.SIGNUP);
    await refreshUser();
  };

  const handleOnboardingComplete = async (answers: OnboardingAnswer) => {
    analyticsService.track(EVENTS.ONBOARDING_COMPLETE);
    await userService.completeOnboarding(answers);
    await refreshUser();
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse flex justify-center">
            <CocktailIcon size={48} color="#d4a053" />
          </div>
          <p className="text-text-muted">載入中...</p>
        </div>
      </div>
    );
  }

  if (phase === "auth") {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  if (phase === "onboarding") {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return null;
}
