/**
 * Maps Supabase Auth errors and network exceptions into calm, parent-friendly messages.
 * Never displays raw technical stack traces or database errors.
 */

export function mapAuthError(rawError: string | Error | null | undefined, action: 'signin' | 'signup' | 'reset' | 'general'): string {
  if (!rawError) return '';

  const message = typeof rawError === 'string' ? rawError : rawError.message || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credential')) {
    return 'The email or password you entered is incorrect. Please try again.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Please use a password with at least 6 characters.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('offline')) {
    return 'Unable to connect to the cloud right now. Your local learning is safe. Please check your connection and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please check your email to confirm your account before signing in.';
  }

  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }

  // Friendly action-specific fallbacks
  switch (action) {
    case 'signup':
      return "We couldn't create your account. Please check your details and try again.";
    case 'signin':
      return "We couldn't sign you in. Please check your email and password and try again.";
    case 'reset':
      return "We couldn't send the reset instructions. Please check your email and try again.";
    default:
      return 'Something unexpected happened. Please try again in a moment.';
  }
}
