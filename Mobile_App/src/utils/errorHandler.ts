/**
 * Centralized error handler utility for React Native mobile application
 * Converts raw backend error messages into user-friendly messages
 */

export const getUserFriendlyError = (error: any): string => {
  // Check for network errors first (no response from server)
  if (!error.response) {
    return "Please check your internet connection and try again.";
  }

  const backendMessage =
    error?.response?.data?.message ||
    error?.message ||
    '';

  const status = error?.response?.status;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      // Bad Request - often validation errors
      return "Something went wrong. Please check your input.";
    case 401:
      // Unauthorized - invalid credentials
      return "Invalid email or password.";
    case 403:
      // Forbidden - not authorized
      return "You are not authorized to perform this action.";
    case 404:
      // Not Found
      return "The requested resource was not found.";
    case 429:
      // Too Many Requests - rate limiting
      return "Too many attempts. Please wait and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors
      return "Server error. Please try again later.";
  }

  // Handle common backend message patterns
  const lowerMessage = backendMessage.toLowerCase();

  if (lowerMessage.includes("invalid")) {
    return "The information you entered is incorrect.";
  }

  if (lowerMessage.includes("expired")) {
    return "This code has expired. Please request a new one.";
  }

  if (lowerMessage.includes("not found")) {
    return "We couldn't find an account with this information.";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("timeout")) {
    return "Connection problem. Please check your internet and try again.";
  }

  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many")) {
    return "Too many attempts. Please wait and try again.";
  }

  // Default fallback for any other errors
  return "Something went wrong. Please try again.";
};
