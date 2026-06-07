import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';

class OnboardingAgreementScreen extends ConsumerStatefulWidget {
  const OnboardingAgreementScreen({super.key});

  @override
  ConsumerState<OnboardingAgreementScreen> createState() =>
      _OnboardingAgreementScreenState();
}

class _OnboardingAgreementScreenState
    extends ConsumerState<OnboardingAgreementScreen> {
  bool _agreed = false;
  bool _submitting = false;

  Future<void> _submit() async {
    if (!_agreed || _submitting) return;
    setState(() => _submitting = true);
    // Simulates submission delay; replace with real API call when available
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() => _submitting = false);
    context.go('/kyc');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

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
                child: const SingleChildScrollView(
                  child: Text(
                    _termsText,
                    style: TextStyle(
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
              onTap: () => setState(() => _agreed = !_agreed),
              child: Row(
                children: [
                  Checkbox(
                    value: _agreed,
                    onChanged: (v) => setState(() => _agreed = v ?? false),
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
            Container(
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
                      l10n.driver_onboarding_agreement_note,
                      style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _agreed && !_submitting ? _submit : null,
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
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

const _termsText = '''
1. Tài xế FoodFlow

Khi đăng ký làm tài xế FoodFlow, bạn đồng ý cung cấp dịch vụ giao hàng cho khách hàng trong khu vực hoạt động đã đăng ký.

2. Yêu cầu

• Có giấy phép lái xe hợp lệ
• Phương tiện đảm bảo an toàn và được bảo hiểm đầy đủ
• Duy trì điểm đánh giá từ 4.0 trở lên
• Tuân thủ quy định giao thông và pháp luật Việt Nam

3. Thu nhập và thanh toán

Thu nhập được tính dựa trên số đơn hoàn thành và khoảng cách giao hàng. Thanh toán thực hiện hàng tuần vào thứ Hai qua tài khoản ngân hàng đã đăng ký.

4. Hành vi và tiêu chuẩn

Tài xế phải duy trì thái độ chuyên nghiệp, lịch sự với khách hàng và nhà hàng. Mọi hành vi gian lận, lừa đảo sẽ dẫn đến chấm dứt hợp đồng ngay lập tức.

5. Chấm dứt hợp đồng

FoodFlow có quyền tạm ngừng hoặc chấm dứt tài khoản tài xế nếu vi phạm bất kỳ điều khoản nào trong thoả thuận này.
''';
