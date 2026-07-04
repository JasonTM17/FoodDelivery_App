import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';

class SupportDriverScreen extends ConsumerStatefulWidget {
  const SupportDriverScreen({super.key});

  @override
  ConsumerState<SupportDriverScreen> createState() =>
      _SupportDriverScreenState();
}

class _SupportDriverScreenState extends ConsumerState<SupportDriverScreen> {
  final Set<int> _expanded = {};

  void _toggleFaq(int index) {
    setState(() {
      if (_expanded.contains(index)) {
        _expanded.remove(index);
      } else {
        _expanded.add(index);
      }
    });
  }

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).driverNavPhoneError),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    final faqs = [
      (q: l10n.driver_support_faq_q1, a: l10n.driver_support_faq_a1),
      (q: l10n.driver_support_faq_q2, a: l10n.driver_support_faq_a2),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_support_title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.driver_support_subtitle,
              style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
            ),
            const SizedBox(height: 24),
            Text(
              l10n.driver_support_faq,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            for (int i = 0; i < faqs.length; i++)
              _FaqItem(
                question: faqs[i].q,
                answer: faqs[i].a,
                expanded: _expanded.contains(i),
                onToggle: () => _toggleFaq(i),
              ),
            const SizedBox(height: 24),
            Text(
              l10n.driver_support_contact,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            _ContactButton(
              icon: Icons.chat_outlined,
              label: l10n.driver_support_chat,
              onTap: () => _launch('https://foodflow.vn/driver-help'),
            ),
            const SizedBox(height: 10),
            _ContactButton(
              icon: Icons.email_outlined,
              label: l10n.driver_support_email,
              onTap: () => _launch('mailto:driver-support@foodflow.vn'),
            ),
            const SizedBox(height: 10),
            _ContactButton(
              icon: Icons.phone_outlined,
              label: l10n.driver_support_phone,
              onTap: () => _launch('tel:+84-1900-1234'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FaqItem extends StatelessWidget {
  const _FaqItem({
    required this.question,
    required this.answer,
    required this.expanded,
    required this.onToggle,
  });

  final String question;
  final String answer;
  final bool expanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: expanded
              ? AppColors.primary.withValues(alpha: 0.5)
              : const Color(0xFF374151),
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      question,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? Icons.expand_less : Icons.expand_more,
                    color: AppColors.primary,
                  ),
                ],
              ),
            ),
          ),
          if (expanded) ...[
            const Divider(color: Color(0xFF374151), height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                answer,
                style: const TextStyle(
                  color: Color(0xFF9CA3AF),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ContactButton extends StatelessWidget {
  const _ContactButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF374151)),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 14),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            const Spacer(),
            const Icon(Icons.chevron_right, color: Color(0xFF6B7280), size: 20),
          ],
        ),
      ),
    );
  }
}
