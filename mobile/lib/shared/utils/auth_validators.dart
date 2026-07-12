/// Client-side auth field validators aligned with backend `auth.zod.ts`.
class AuthValidators {
  AuthValidators._();

  /// Backend: min 8, max 72, at least one upper, lower, and digit.
  static final RegExp passwordComplexity = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$',
  );

  /// Backend phone: optional leading `+`, then 7–15 digits starting 1–9.
  static final RegExp phoneE164ish = RegExp(r'^\+?[1-9]\d{6,14}$');

  static bool isPasswordValid(String password) {
    return passwordComplexity.hasMatch(password);
  }

  static bool isPhoneValid(String phone) {
    return phoneE164ish.hasMatch(phone.trim());
  }

  /// Returns an error message key-friendly code, or null if valid.
  /// Codes: `required`, `minLength`, `complexity`.
  static String? passwordError(String? value, {bool requireComplexity = true}) {
    if (value == null || value.isEmpty) return 'required';
    if (value.length < 8) return 'minLength';
    if (requireComplexity && !isPasswordValid(value)) return 'complexity';
    return null;
  }

  /// Codes: `required`, `invalid`.
  static String? phoneError(String? value, {bool required = true}) {
    if (value == null || value.trim().isEmpty) {
      return required ? 'required' : null;
    }
    if (!isPhoneValid(value)) return 'invalid';
    return null;
  }
}
