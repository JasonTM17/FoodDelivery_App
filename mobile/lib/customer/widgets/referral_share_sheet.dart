import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../l10n/app_localizations.dart';

class ReferralShareSheet extends StatelessWidget {
  final String referralCode;
  final String? message;
  final VoidCallback? onDismiss;

  const ReferralShareSheet({
    super.key,
    required this.referralCode,
    this.message,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final shareMessage = message ?? l10n.referralShareMessage(referralCode);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(l10n.referralShareSheetTitle, style: AppTextStyles.headline4),
            const SizedBox(height: 16),
            // Code display
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                referralCode,
                style: AppTextStyles.headline2.copyWith(
                  color: AppColors.primary,
                  letterSpacing: 6,
                  fontWeight: FontWeight.w800,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),
            // Share options
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareButton(context, Icons.copy, l10n.referralCopyCode, (
                  _,
                ) async {
                  await Clipboard.setData(ClipboardData(text: referralCode));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(l10n.referralCodeCopied),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }),
                _buildShareButton(
                  context,
                  Icons.share,
                  l10n.referralShareCode,
                  (buttonContext) async {
                    final renderObject = buttonContext.findRenderObject();
                    final viewport = MediaQuery.sizeOf(buttonContext);
                    final shareOrigin =
                        renderObject is RenderBox &&
                            renderObject.hasSize &&
                            !renderObject.size.isEmpty
                        ? renderObject.localToGlobal(Offset.zero) &
                              renderObject.size
                        : Rect.fromCenter(
                            center: Offset(
                              viewport.width / 2,
                              viewport.height / 2,
                            ),
                            width: 1,
                            height: 1,
                          );
                    try {
                      await SharePlus.instance.share(
                        ShareParams(
                          text: shareMessage,
                          sharePositionOrigin: shareOrigin,
                        ),
                      );
                    } catch (_) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.referralShareFailed)),
                      );
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildShareButton(
    BuildContext context,
    IconData icon,
    String label,
    Future<void> Function(BuildContext buttonContext) onTap,
  ) {
    return Builder(
      builder: (buttonContext) => Semantics(
        button: true,
        label: label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => unawaited(onTap(buttonContext)),
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.primary, size: 24),
              ),
              const SizedBox(height: 8),
              Text(label, style: AppTextStyles.caption),
            ],
          ),
        ),
      ),
    );
  }
}
