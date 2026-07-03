import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/api/api_client.dart';
import '../../shared/theme/app_colors.dart';

const _driverTermsVersion = 'driver-terms-2026-07';

class OnboardingAgreementScreen extends ConsumerStatefulWidget {
  const OnboardingAgreementScreen({super.key});

  @override
  ConsumerState<OnboardingAgreementScreen> createState() => _OnboardingAgreementScreenState();
}

class _OnboardingAgreementScreenState extends ConsumerState<OnboardingAgreementScreen> {
  bool _agreed = false;
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (!_agreed || _submitting) return;
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ApiClient.instance.post<dynamic>(
        '/driver/onboarding/agreement',
        data: {'termsVersion': _driverTermsVersion},
      );
      if (!mounted) return;
      context.go('/kyc');
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _errorMessage(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_onboarding_agreement_title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              l10n.driver_onboarding_agreement_subtitle,
              style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    l10n.driver_onboarding_agreement_terms,
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 13,
                      height: 1.7,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: _submitting ? null : () => setState(() => _agreed = !_agreed),
              child: Row(
                children: [
                  Checkbox(
                    value: _agreed,
                    onChanged: _submitting ? null : (value) => setState(() => _agreed = value ?? false),
                    activeColor: AppColors.primary,
                    side: const BorderSide(color: Color(0xFF6B7280)),
                  ),
                  Expanded(
                    child: Text(
                      l10n.driver_onboarding_agreement_read,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            _AgreementNote(text: l10n.driver_onboarding_agreement_note),
            if (_error != null) ...[
              const SizedBox(height: 10),
              _AgreementError(message: l10n.driver_onboarding_agreement_failed, detail: _error!),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _agreed && !_submitting ? _submit : null,
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(l10n.driver_onboarding_agreement_submit),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AgreementNote extends StatelessWidget {
  final String text;

  const _AgreementNote({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: AppColors.primary, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _AgreementError extends StatelessWidget {
  final String message;
  final String detail;

  const _AgreementError({required this.message, required this.detail});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF3B1111),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF7F1D1D)),
      ),
      child: Text(
        '$message\n$detail',
        style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12, height: 1.4),
      ),
    );
  }
}

String _errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['detail'] is String) return data['detail'] as String;
    if (data is Map && data['message'] is String) return data['message'] as String;
    if (error.message != null && error.message!.isNotEmpty) return error.message!;
  }
  return error.toString();
}
