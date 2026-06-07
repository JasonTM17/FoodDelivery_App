import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/app_colors.dart';

class KycVerificationScreen extends StatefulWidget {
  const KycVerificationScreen({super.key});

  @override
  State<KycVerificationScreen> createState() => _KycVerificationScreenState();
}

class _KycVerificationScreenState extends State<KycVerificationScreen> {
  final List<bool> _uploaded = [false, false, false, false];
  int _uploading = -1;
  bool _submitting = false;

  static const _docs = [
    (label: 'CCCD mặt trước', icon: Icons.credit_card),
    (label: 'CCCD mặt sau', icon: Icons.credit_card_off_outlined),
    (label: 'Bằng lái xe', icon: Icons.drive_eta_outlined),
    (label: 'Đăng ký xe', icon: Icons.article_outlined),
  ];

  bool get _allUploaded => _uploaded.every((u) => u);

  Future<void> _simulateUpload(int index) async {
    setState(() => _uploading = index);
    await Future.delayed(const Duration(milliseconds: 900));
    if (mounted) {
      setState(() {
        _uploaded[index] = true;
        _uploading = -1;
      });
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _submitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đơn đăng ký đã được gửi thành công!')),
    );
    context.go('/login');
  }

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
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
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
                    fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 6),
              const Text(
                'Vui lòng tải lên đầy đủ các giấy tờ yêu cầu',
                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 24),
              ...List.generate(
                _docs.length,
                (i) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _uploadZone(i),
                ),
              ),
              const SizedBox(height: 8),
              _noteCard(),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _allUploaded && !_submitting ? _submit : null,
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

  Widget _uploadZone(int index) {
    final doc = _docs[index];
    final uploaded = _uploaded[index];
    final loading = _uploading == index;

    return GestureDetector(
      onTap: (loading || uploaded) ? null : () => _simulateUpload(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        height: 100,
        decoration: BoxDecoration(
          color: uploaded
              ? AppColors.primary.withValues(alpha: 0.08)
              : const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: uploaded ? AppColors.primary : const Color(0xFF374151),
            width: uploaded ? 1.5 : 1.0,
          ),
        ),
        child: loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary))
            : uploaded
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle,
                          color: AppColors.primary, size: 28),
                      const SizedBox(width: 10),
                      Text(
                        doc.label,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(doc.icon,
                          color: const Color(0xFF6B7280), size: 28),
                      const SizedBox(height: 6),
                      Text(
                        doc.label,
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

  Widget _noteCard() {
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
