import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../widgets/help_search_bar.dart';
import '../router/route_names.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  String? _selectedCategory;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<_FaqEntry> _faqs(AppLocalizations l10n) {
    return [
      _FaqEntry(l10n.helpFaqCancelOrderQ, l10n.helpFaqCancelOrderA, 'orders'),
      _FaqEntry(l10n.helpFaqLateDeliveryQ, l10n.helpFaqLateDeliveryA, 'delivery'),
      _FaqEntry(l10n.helpFaqPaymentMethodsQ, l10n.helpFaqPaymentMethodsA, 'payment'),
      _FaqEntry(l10n.helpFaqTopUpWalletQ, l10n.helpFaqTopUpWalletA, 'payment'),
      _FaqEntry(l10n.helpFaqAddAddressQ, l10n.helpFaqAddAddressA, 'account'),
      _FaqEntry(l10n.helpFaqMissingOrderQ, l10n.helpFaqMissingOrderA, 'delivery'),
      _FaqEntry(l10n.helpFaqRewardPointsQ, l10n.helpFaqRewardPointsA, 'account'),
      _FaqEntry(l10n.helpFaqTrackOrderQ, l10n.helpFaqTrackOrderA, 'orders'),
    ];
  }

  List<_FaqEntry> _filtered(AppLocalizations l10n) {
    final faqs = _faqs(l10n);
    return faqs.where((faq) {
      final matchQuery = _query.isEmpty || faq.question.toLowerCase().contains(_query.toLowerCase());
      final matchCat = _selectedCategory == null || faq.category == _selectedCategory;
      return matchQuery && matchCat;
    }).toList();
  }

  Future<void> _launchPhone() async {
    final uri = Uri.parse('tel:19001234');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchEmail() async {
    final uri = Uri.parse('mailto:support@foodflow.vn');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final filtered = _filtered(l10n);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(l10n.helpTitle)),
      body: Column(
        children: [
          // Search bar
          HelpSearchBar(
            controller: _searchCtrl,
            query: _query,
            onChanged: (v) => setState(() => _query = v),
            hintText: l10n.helpCenterSearchHint,
          ),

          // Category chips
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                _buildCategoryChip(null, l10n.cuisineAll),
                _buildCategoryChip('orders', l10n.helpCategoryOrders),
                _buildCategoryChip('payment', l10n.helpCategoryPayment),
                _buildCategoryChip('delivery', l10n.helpCategoryDelivery),
                _buildCategoryChip('account', l10n.helpCategoryAccount),
              ],
            ),
          ),

          // Contact options
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildContactBtn(Icons.chat_bubble_outline, l10n.helpCenterChatCta, () => context.push('${Routes.chat}', extra: 'support')),
                const SizedBox(width: 8),
                _buildContactBtn(Icons.phone_outlined, l10n.helpCallSupport, _launchPhone),
                const SizedBox(width: 8),
                _buildContactBtn(Icons.email_outlined, l10n.helpEmailSupport, _launchEmail),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // FAQ list
          Expanded(
            child: filtered.isEmpty
                ? Center(child: Text(l10n.helpCenterNoResults, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) => _buildFaqTile(filtered[i]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String? cat, String label) {
    final isSelected = _selectedCategory == cat;
    return GestureDetector(
      onTap: () => setState(() => _selectedCategory = cat),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(label, style: AppTextStyles.bodySmall.copyWith(
          color: isSelected ? Colors.white : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
        )),
      ),
    );
  }

  Widget _buildContactBtn(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 4),
              Text(label, style: AppTextStyles.caption.copyWith(color: AppColors.textPrimary), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFaqTile(_FaqEntry faq) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Text(faq.question, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        children: [Text(faq.answer, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, height: 1.6))],
      ),
    );
  }
}

class _FaqEntry {
  final String question;
  final String answer;
  final String category;
  const _FaqEntry(this.question, this.answer, this.category);
}
