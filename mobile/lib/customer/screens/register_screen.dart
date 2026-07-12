import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/utils/auth_validators.dart';
import '../router/route_names.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final String initialRole;

  const RegisterScreen({super.key, this.initialRole = 'customer'});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String _selectedRole = 'customer';
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // B-MOB-02: do not send role — backend register schema rejects it.
    await ref
        .read(authProvider.notifier)
        .register(
          fullName: _fullNameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          password: _passwordController.text,
        );

    if (!mounted) return;
    setState(() => _isLoading = false);

    final authState = ref.read(authProvider);
    if (authState.isAuthenticated) {
      context.go(Routes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.registerTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                Text(
                  l10n.registerCreateAccount,
                  style: AppTextStyles.headline2,
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.registerSubtitle,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 28),

                if (authState.error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            authState.error!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () =>
                              ref.read(authProvider.notifier).clearError(),
                          child: const Icon(
                            Icons.close,
                            color: AppColors.error,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                TextFormField(
                  controller: _fullNameController,
                  decoration: InputDecoration(
                    labelText: l10n.fullNameLabel,
                    prefixIcon: const Icon(Icons.person_outlined),
                    hintText: l10n.fullNameHint,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return l10n.fullNameRequired;
                    }
                    if (value.trim().length < 2) {
                      return l10n.fullNameMinLength;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: l10n.emailLabel,
                    prefixIcon: const Icon(Icons.email_outlined),
                    hintText: l10n.emailHint,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return l10n.emailRequired;
                    }
                    if (!RegExp(
                      r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                    ).hasMatch(value.trim())) {
                      return l10n.emailInvalid;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: l10n.phoneLabel,
                    prefixIcon: const Icon(Icons.phone_outlined),
                    hintText: l10n.phoneHint,
                  ),
                  validator: (value) {
                    // B-MOB-13: E.164-ish phone aligned with backend auth.zod.
                    final code = AuthValidators.phoneError(value);
                    if (code == 'required') return l10n.phoneRequired;
                    if (code == 'invalid') return l10n.phoneInvalid;
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: l10n.passwordLabel,
                    prefixIcon: const Icon(Icons.lock_outlined),
                    hintText: l10n.passwordHintLong,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (value) {
                    // B-MOB-13: min 8 + upper/lower/digit complexity.
                    final code = AuthValidators.passwordError(value);
                    if (code == 'required') return l10n.passwordRequired;
                    if (code == 'minLength') return l10n.passwordMinLength;
                    if (code == 'complexity') return l10n.passwordComplexity;
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: l10n.confirmPasswordLabel,
                    prefixIcon: const Icon(Icons.lock_outlined),
                    hintText: l10n.confirmPasswordHint,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return l10n.confirmPasswordRequired;
                    }
                    if (value != _passwordController.text) {
                      return l10n.passwordMismatch;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                Text(l10n.registerAs, style: AppTextStyles.bodyMedium),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildRoleCard(
                        icon: Icons.person,
                        label: l10n.roleCustomer,
                        value: 'customer',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildRoleCard(
                        icon: Icons.delivery_dining,
                        label: l10n.roleDriver,
                        value: 'driver',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRegister,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : Text(l10n.registerButton),
                  ),
                ),
                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      l10n.hasAccount,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text(
                        l10n.loginButton,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    final isSelected = _selectedRole == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: isSelected ? AppColors.primary : AppColors.textHint,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
