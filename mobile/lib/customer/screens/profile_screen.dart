import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/locale_switcher.dart';
import '../providers/address_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(orderProvider.notifier).fetchOrders();
      ref.read(addressProvider.notifier).fetchAddresses();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authProvider);
    final orderState = ref.watch(orderProvider);
    final addressState = ref.watch(addressProvider);
    final user = authState.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.profileTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              // Navigate to settings
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: AppColors.primaryLight,
                        backgroundImage: user?.avatarUrl != null
                            ? NetworkImage(user!.avatarUrl!) as ImageProvider
                            : null,
                        child: user?.avatarUrl == null
                            ? const Icon(Icons.person, size: 48, color: AppColors.primary)
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.fullName ?? l10n.defaultUser,
                    style: AppTextStyles.headline3,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                  if (user?.phone != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      user?.phone ?? '',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ],
              ),
            ),

            // Stats row
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem(
                    '${orderState.activeOrders.length + orderState.completedOrders.length}',
                    l10n.statsOrders,
                    Icons.receipt_long,
                  ),
                  _buildStatItem(
                    '${orderState.completedOrders.length}',
                    l10n.statsReviews,
                    Icons.star,
                  ),
                  _buildStatItem(
                    '${addressState.addresses.length}',
                    l10n.statsAddresses,
                    Icons.location_on,
                  ),
                  _buildStatItem('0', l10n.statsPoints, Icons.monetization_on),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Menu items
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.location_on_outlined,
                    title: l10n.myAddresses,
                    subtitle: l10n.myAddressesSubtitle,
                    onTap: () => Navigator.of(context).pushNamed('/addresses'),
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.card_giftcard_outlined,
                    title: l10n.profileLoyalty,
                    subtitle: l10n.profileLoyaltySubtitle,
                    onTap: () => context.push('/loyalty'),
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.account_balance_wallet_outlined,
                    title: l10n.profileWallet,
                    subtitle: l10n.profileWalletSubtitle,
                    onTap: () => context.push('/wallet'),
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.group_outlined,
                    title: l10n.profileReferral,
                    subtitle: l10n.profileReferralSubtitle,
                    onTap: () => context.push('/referral'),
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.help_outline,
                    title: l10n.profileHelp,
                    subtitle: l10n.profileHelpSubtitle,
                    onTap: () => context.push('/help'),
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.payment_outlined,
                    title: l10n.paymentMethods,
                    subtitle: l10n.paymentMethodsSubtitle,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.featureInDevelopment)),
                      );
                    },
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.notifications_outlined,
                    title: l10n.notificationsTitle,
                    subtitle: l10n.notificationsSubtitle,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.featureInDevelopment)),
                      );
                    },
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.favorite_outline,
                    title: l10n.favorites,
                    subtitle: l10n.favoritesSubtitle,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.featureInDevelopment)),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.headset_mic_outlined,
                    title: l10n.support,
                    subtitle: l10n.supportSubtitle,
                    onTap: () {
                      // TODO: localize hotline number per locale
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Vui lòng liên hệ hotline: 1900-1234')),
                      );
                    },
                  ),
                  _buildDivider(),
                  _buildMenuItem(
                    icon: Icons.info_outline,
                    title: l10n.aboutApp,
                    subtitle: l10n.aboutSubtitle,
                    onTap: () {
                      showAboutDialog(
                        context: context,
                        applicationName: 'FoodFlow',
                        applicationVersion: '1.0.0',
                        applicationLegalese: '© 2026 FoodFlow. Đặt đồ ăn nhanh chóng, giao hàng tận nơi.',
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Language settings
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.languageTitle,
                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const LocaleSwitcher(),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Logout button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: Text(l10n.logout),
                        content: Text(l10n.logoutConfirm),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: Text(l10n.cancel),
                          ),
                          TextButton(
                            onPressed: () {
                              ref.read(authProvider.notifier).logout();
                              Navigator.of(ctx).pop();
                              Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                            },
                            child: Text(
                              l10n.logout,
                              style: const TextStyle(color: AppColors.error),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.logout, color: AppColors.error),
                  label: Text(
                    l10n.logout,
                    style: const TextStyle(color: AppColors.error),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(height: 6),
        Text(
          value,
          style: AppTextStyles.headline4.copyWith(color: AppColors.primary),
        ),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primary, size: 22),
      ),
      title: Text(title, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: AppTextStyles.bodySmall),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textHint, size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      onTap: onTap,
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, indent: 72, endIndent: 16);
  }
}
