import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/driver_provider.dart';

class OnlineToggle extends ConsumerWidget {
  const OnlineToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(driverProvider);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: state.isOnline
              ? AppColors.primary.withValues(alpha: 0.3)
              : const Color(0xFF374151),
        ),
      ),
      child: Row(
        children: [
          _StatusDot(isOnline: state.isOnline),
          const SizedBox(width: 12),
          _StatusLabel(isOnline: state.isOnline),
          const Spacer(),
          SizedBox(
            height: 36,
            child: Switch(
              value: state.isOnline,
              onChanged: (value) {
                if (value) {
                  ref.read(driverProvider.notifier).goOnlineWithGps();
                } else {
                  ref.read(driverProvider.notifier).goOffline();
                }
              },
              activeTrackColor: AppColors.primary,
              inactiveThumbColor: AppColors.textHint,
              inactiveTrackColor: const Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  final bool isOnline;
  const _StatusDot({required this.isOnline});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isOnline ? AppColors.primary : AppColors.textHint,
        boxShadow: isOnline
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.5),
                  blurRadius: 8,
                ),
              ]
            : [],
      ),
    );
  }
}

class _StatusLabel extends StatelessWidget {
  final bool isOnline;
  const _StatusLabel({required this.isOnline});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isOnline ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
        Text(
          isOnline ? 'Sẵn sàng nhận đơn' : 'Bật để nhận đơn hàng',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
      ],
    );
  }
}
