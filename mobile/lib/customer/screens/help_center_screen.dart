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

  static const _categories = ['orders', 'payment', 'delivery', 'account'];

  static const _faqs = [
    {'q': 'Làm thế nào để hủy đơn hàng?', 'a': 'Bạn có thể hủy đơn hàng trong vòng 2 phút sau khi đặt. Vào "Đơn hàng" → chọn đơn → nhấn "Hủy đơn".', 'cat': 'orders'},
    {'q': 'Đơn hàng bị trễ phải làm gì?', 'a': 'Vui lòng liên hệ chat hỗ trợ để chúng tôi kiểm tra trực tiếp với tài xế.', 'cat': 'delivery'},
    {'q': 'Phương thức thanh toán nào được chấp nhận?', 'a': 'Hiện tại chúng tôi chấp nhận tiền mặt khi nhận hàng và ví điện tử FoodFlow.', 'cat': 'payment'},
    {'q': 'Làm thế nào để nạp tiền vào ví?', 'a': 'Vào "Cá nhân" → "Ví điện tử" → nhấn "Nạp tiền" và chọn mệnh giá mong muốn.', 'cat': 'payment'},
    {'q': 'Làm sao để thêm địa chỉ giao hàng?', 'a': 'Vào "Cá nhân" → "Địa chỉ của tôi" → nhấn "Thêm địa chỉ" và nhập thông tin.', 'cat': 'account'},
    {'q': 'Tôi không nhận được đơn hàng, phải làm gì?', 'a': 'Nếu tài xế đã đánh dấu giao thành công nhưng bạn chưa nhận được, hãy liên hệ hỗ trợ ngay.', 'cat': 'delivery'},
    {'q': 'Điểm thưởng được tích như thế nào?', 'a': 'Mỗi đơn hàng hoàn thành bạn nhận được 10 điểm. Giới thiệu bạn bè thành công nhận thêm 50 điểm.', 'cat': 'account'},
    {'q': 'Làm sao để theo dõi đơn hàng real-time?', 'a': 'Sau khi đặt hàng thành công, vào "Đơn hàng" → chọn đơn đang hoạt động → nhấn "Theo dõi".', 'cat': 'orders'},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Map<String, String>> get _filtered {
    return _faqs.where((faq) {
      final matchQuery = _query.isEmpty || faq['q']!.toLowerCase().contains(_query.toLowerCase());
      final matchCat = _selectedCategory == null || faq['cat'] == _selectedCategory;
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
                _buildContactBtn(Icons.chat_bubble_outline, l10n.helpChatSupport, () => context.push('${Routes.chat}', extra: 'support')),
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
            child: _filtered.isEmpty
                ? Center(child: Text(l10n.helpFaqEmpty, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) => _buildFaqTile(_filtered[i]),
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

  Widget _buildFaqTile(Map<String, String> faq) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1))],
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        title: Text(faq['q']!, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500)),
        children: [Text(faq['a']!, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary, height: 1.6))],
      ),
    );
  }
}
