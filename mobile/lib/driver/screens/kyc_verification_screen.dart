import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../shared/theme/app_colors.dart';
import '../services/kyc_upload_service.dart';

class KycVerificationScreen extends ConsumerStatefulWidget {
  const KycVerificationScreen({super.key});

  @override
  ConsumerState<KycVerificationScreen> createState() =>
      _KycVerificationScreenState();
}

class _KycVerificationScreenState
    extends ConsumerState<KycVerificationScreen> {
  /// Uploaded public URLs per document slot; null = not yet uploaded.
  final List<String?> _uploadedUrls = [null, null, null, null];
  int _uploading = -1;
  bool _submitting = false;

  static const _docMeta = [
    (label: 'CCCD mặt trước', icon: Icons.credit_card),
    (label: 'CCCD mặt sau', icon: Icons.credit_card_off_outlined),
    (label: 'Bằng lái xe', icon: Icons.drive_eta_outlined),
    (label: 'Đăng ký xe', icon: Icons.article_outlined),
  ];

  static const _docTypes = [
    KycDocumentType.cccdFront,
    KycDocumentType.cccdBack,
    KycDocumentType.driverLicense,
    KycDocumentType.vehicleRegistration,
  ];

  bool get _allUploaded => _uploadedUrls.every((url) => url != null);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _pickAndUpload(int index) async {
    final source = await _showSourcePicker();
    if (source == null) return;

    setState(() => _uploading = index);

    final result = await KycUploadService.instance.pickAndUpload(
      docType: _docTypes[index],
      source: source,
    );

    if (!mounted) return;

    if (result.success && result.fileUrl != null) {
      setState(() {
        _uploadedUrls[index] = result.fileUrl;
        _uploading = -1;
      });
    } else {
      setState(() => _uploading = -1);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.error ?? 'Upload thất bại')),
      );
    }
  }

  Future<ImageSource?> _showSourcePicker() async {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
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
              leading:
                  const Icon(Icons.camera_alt, color: AppColors.primary),
              title: const Text('Chụp ảnh',
                  style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading:
                  const Icon(Icons.photo_library, color: AppColors.primary),
              title: const Text('Chọn từ thư viện',
                  style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);

    final docUrls = <String, String>{};
    for (var i = 0; i < _docTypes.length; i++) {
      final url = _uploadedUrls[i];
      if (url != null) {
        docUrls[_docTypes[i].backendKey] = url;
      }
    }

    final success = await KycUploadService.instance.submitKyc(docUrls);
    if (!mounted) return;

    setState(() => _submitting = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Đơn đăng ký đã được gửi thành công!')),
      );
      context.go('/login');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Gửi đơn thất bại. Vui lòng thử lại.')),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Xác minh KYC',
          style:
              TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Tải lên giấy tờ',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white),
              ),
              const SizedBox(height: 6),
              const Text(
                'Vui lòng tải lên đầy đủ các giấy tờ yêu cầu',
                style:
                    TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 24),
              ...List.generate(
                _docMeta.length,
                (i) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _UploadZone(
                    label: _docMeta[i].label,
                    icon: _docMeta[i].icon,
                    isUploaded: _uploadedUrls[i] != null,
                    isLoading: _uploading == i,
                    onTap: (_uploading == i || _uploadedUrls[i] != null)
                        ? null
                        : () => _pickAndUpload(i),
                    onReset: _uploadedUrls[i] != null
                        ? () => setState(() => _uploadedUrls[i] = null)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const _NoteCard(),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed:
                      _allUploaded && !_submitting ? _submit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text(
                          'GỬI ĐĂNG KÝ',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Colors.white),
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

// ---------------------------------------------------------------------------
// Sub-widgets (kept in same file — total <200 LOC)
// ---------------------------------------------------------------------------

class _UploadZone extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isUploaded;
  final bool isLoading;
  final VoidCallback? onTap;
  final VoidCallback? onReset;

  const _UploadZone({
    required this.label,
    required this.icon,
    required this.isUploaded,
    required this.isLoading,
    this.onTap,
    this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isUploaded ? onReset : onTap,
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
            color: isUploaded
                ? AppColors.primary
                : const Color(0xFF374151),
            width: isUploaded ? 1.5 : 1.0,
          ),
        ),
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary))
            : isUploaded
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle,
                          color: AppColors.primary, size: 28),
                      const SizedBox(width: 10),
                      Text(
                        label,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.refresh,
                          color: Color(0xFF6B7280), size: 16),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon,
                          color: const Color(0xFF6B7280), size: 28),
                      const SizedBox(height: 6),
                      Text(
                        label,
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Chụp ảnh hoặc tải lên',
                        style: TextStyle(
                            fontSize: 12, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  const _NoteCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: AppColors.warning.withValues(alpha: 0.25)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: AppColors.warning, size: 18),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Đơn xét duyệt trong 24-48h. Bạn sẽ nhận thông báo khi được duyệt.',
              style: TextStyle(fontSize: 13, color: AppColors.warning),
            ),
          ),
        ],
      ),
    );
  }
}
