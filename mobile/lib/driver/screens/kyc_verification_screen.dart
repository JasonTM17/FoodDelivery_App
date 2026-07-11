import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../models/driver_onboarding_draft.dart';
import '../providers/driver_provider.dart';
import '../services/kyc_upload_service.dart';

class KycVerificationScreen extends ConsumerStatefulWidget {
  const KycVerificationScreen({
    super.key,
    required this.draft,
    this.uploadService,
  });

  final DriverOnboardingDraft draft;
  final KycUploadService? uploadService;

  @override
  ConsumerState<KycVerificationScreen> createState() =>
      _KycVerificationScreenState();
}

class _KycVerificationScreenState extends ConsumerState<KycVerificationScreen> {
  final Map<KycDocumentType, String> _objectKeys = {};
  KycDocumentType? _uploading;
  bool _submitting = false;
  KycSubmissionReceipt? _receipt;

  KycUploadService get _service =>
      widget.uploadService ?? KycUploadService.instance;

  bool get _allUploaded =>
      KycDocumentType.values.every(_objectKeys.containsKey);

  Future<void> _pickAndUpload(KycDocumentType documentType) async {
    if (_uploading != null || _submitting) return;
    final source = await _showSourcePicker();
    if (source == null || !mounted) return;

    setState(() => _uploading = documentType);
    final result = await _service.pickAndUpload(
      documentType: documentType,
      source: source,
    );
    if (!mounted) return;

    setState(() {
      _uploading = null;
      if (result.isSuccess) _objectKeys[documentType] = result.objectKey!;
    });
    if (!result.isSuccess && result.error != KycUploadError.cancelled) {
      _showError(_uploadErrorMessage(result.error));
    }
  }

  Future<ImageSource?> _showSourcePicker() {
    final l10n = AppLocalizations.of(context);
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFF374151),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: AppColors.primary),
              title: Text(
                l10n.driverKycTakePhoto,
                style: const TextStyle(color: Colors.white),
              ),
              onTap: () => Navigator.pop(sheetContext, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library,
                color: AppColors.primary,
              ),
              title: Text(
                l10n.driverKycGallery,
                style: const TextStyle(color: Colors.white),
              ),
              onTap: () => Navigator.pop(sheetContext, ImageSource.gallery),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_allUploaded || _submitting) return;
    setState(() => _submitting = true);
    try {
      final receipt = await _service.submitKyc(
        draft: widget.draft,
        documents: Map.unmodifiable(_objectKeys),
      );
      if (!mounted) return;
      ref.read(driverProvider.notifier).markKycPending();
      setState(() => _receipt = receipt);
    } catch (_) {
      if (mounted)
        _showError(AppLocalizations.of(context).driverKycSubmitFailed);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _uploadErrorMessage(KycUploadError? error) {
    final l10n = AppLocalizations.of(context);
    return switch (error) {
      KycUploadError.unsupportedImage => l10n.driverKycUnsupportedImage,
      KycUploadError.fileTooSmall => l10n.driverKycFileTooSmall,
      KycUploadError.fileTooLarge => l10n.driverKycFileTooLarge,
      KycUploadError.invalidGrant => l10n.driverKycInvalidUploadGrant,
      _ => l10n.driverKycUploadFailed,
    };
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final receipt = _receipt;
    if (receipt != null) return _KycSubmittedView(receipt: receipt);

    final l10n = AppLocalizations.of(context);
    final documents = [
      (KycDocumentType.idCardFront, l10n.driverKycCccdFront, Icons.credit_card),
      (
        KycDocumentType.idCardBack,
        l10n.driverKycCccdBack,
        Icons.credit_card_off_outlined,
      ),
      (
        KycDocumentType.driverLicense,
        l10n.driverKycDriverLicense,
        Icons.drive_eta_outlined,
      ),
      (
        KycDocumentType.vehicleRegistration,
        l10n.driverKycVehicleReg,
        Icons.article_outlined,
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverKycTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.driverKycUploadTitle,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.driverKycUploadSubtitle,
                style: const TextStyle(fontSize: 14, color: Color(0xFF9CA3AF)),
              ),
              const SizedBox(height: 24),
              for (final (type, label, icon) in documents) ...[
                _UploadZone(
                  label: label,
                  hint: l10n.driverKycUploadHint,
                  icon: icon,
                  isUploaded: _objectKeys.containsKey(type),
                  isLoading: _uploading == type,
                  enabled: _uploading == null && !_submitting,
                  onTap: () => _pickAndUpload(type),
                  onReset: () => setState(() => _objectKeys.remove(type)),
                ),
                const SizedBox(height: 16),
              ],
              _NoteCard(text: l10n.driverKycNote),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _allUploaded && !_submitting ? _submit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          l10n.driverKycSubmit,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UploadZone extends StatelessWidget {
  const _UploadZone({
    required this.label,
    required this.hint,
    required this.icon,
    required this.isUploaded,
    required this.isLoading,
    required this.enabled,
    required this.onTap,
    required this.onReset,
  });

  final String label;
  final String hint;
  final IconData icon;
  final bool isUploaded;
  final bool isLoading;
  final bool enabled;
  final VoidCallback onTap;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final action = isUploaded ? onReset : onTap;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      value: isUploaded ? 'uploaded' : 'required',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? action : null,
          borderRadius: BorderRadius.circular(14),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: double.infinity,
            height: 100,
            decoration: BoxDecoration(
              color: isUploaded
                  ? AppColors.primary.withValues(alpha: 0.08)
                  : const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isUploaded ? AppColors.primary : const Color(0xFF374151),
                width: isUploaded ? 1.5 : 1,
              ),
            ),
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isUploaded ? Icons.check_circle : icon,
                        color: isUploaded
                            ? AppColors.primary
                            : const Color(0xFF9CA3AF),
                        size: 28,
                      ),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              label,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            if (!isUploaded) ...[
                              const SizedBox(height: 4),
                              Text(
                                hint,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (isUploaded) ...[
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.refresh,
                          color: Color(0xFF9CA3AF),
                          size: 18,
                        ),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  const _NoteCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: AppColors.warning),
            ),
          ),
        ],
      ),
    );
  }
}

class _KycSubmittedView extends StatelessWidget {
  const _KycSubmittedView({required this.receipt});

  final KycSubmissionReceipt receipt;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.verified_outlined,
                  color: AppColors.primary,
                  size: 72,
                ),
                const SizedBox(height: 24),
                Text(
                  l10n.driverKycSubmittedTitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  l10n.driverKycSubmittedMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF9CA3AF), height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/home'),
                    child: Text(l10n.driverKycGoHome),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
