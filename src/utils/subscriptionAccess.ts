/**
 * Unified Access Controller for Subscription Logic
 * 
 * Enforces core rule:
 * - Business flows depend ONLY on businessProfile.subscriptionStatus
 * - Global flows continue using isSubscribed safely
 */

export type AccessState =
  | "ACTIVE"
  | "PROCESSING" 
  | "PENDING"
  | "PAYMENT_FAILED"
  | "INACTIVE";

export interface AccessStateInput {
  businessProfile?: any;
  isSubscribed: boolean;
}

export function getAccessState({
  businessProfile,
  isSubscribed,
}: AccessStateInput): AccessState {
  console.log("[AccessState] Determining access state:", {
    profileId: businessProfile?.id,
    subscriptionStatus: businessProfile?.subscriptionStatus,
    isSubscribed,
    hasBusinessProfile: !!businessProfile,
  });

  // BUSINESS FLOW: Use business profile subscription status
  if (businessProfile) {
    const status = businessProfile.subscriptionStatus;
    const normalizedStatus = status?.toString().toUpperCase().trim();
    
    console.log("[AccessState] Business profile detected, using subscriptionStatus:", normalizedStatus);
    
    switch (normalizedStatus) {
      case "ACTIVE":
        return "ACTIVE";
      case "PROCESSING":
        return "PROCESSING";
      case "PENDING":
        return "PENDING";
      case "PAYMENT_FAILED":
        return "PAYMENT_FAILED";
      case "EXPIRED":
      case "CANCELLED":
      case "INACTIVE":
      default:
        return "INACTIVE";
    }
  }

  // GLOBAL FLOW: Use global subscription status
  console.log("[AccessState] No business profile, using global subscription:", isSubscribed);
  return isSubscribed ? "ACTIVE" : "INACTIVE";
}

export function isAccessGranted(state: AccessState): boolean {
  return state === "ACTIVE";
}

export function getAccessStateMessage(state: AccessState): string {
  switch (state) {
    case "ACTIVE":
      return "Access granted";
    case "PROCESSING":
      return "Your business profile will be activated within 24 hours";
    case "PENDING":
      return "Payment is being processed. Please wait...";
    case "PAYMENT_FAILED":
      return "Payment failed. Please try again or contact support.";
    case "INACTIVE":
    default:
      return "Subscription required to access this feature";
  }
}

export function isTransitionalState(state: AccessState): boolean {
  return state === "PROCESSING" || state === "PENDING";
}

export function needsActivation(state: AccessState): boolean {
  return state === "PAYMENT_FAILED" || state === "INACTIVE";
}
