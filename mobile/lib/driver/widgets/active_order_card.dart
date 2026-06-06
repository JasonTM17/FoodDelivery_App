import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';

class ActiveOrderCard extends StatelessWidget {
  final OrderModel order;

  const ActiveOrderCard({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/delivery-flow', extra: {
        'orderId': order.id,
        'restaurantName': order.restaurantName,
        'restaurantAddress': order.restaurantLatitude?.toString() ?? '',
        'restaurantLat': order.restaurantLatitude,
        'restaurantLng': order.restaurantLongitude,
        'customerAddress': order.deliveryAddress.address,
        'customerLat': order.deliveryAddress.latitude,
        'customerLng': order.deliveryAddress.longitude,
        'items': order.items
            .map((i) => {'name': i.name, 'quantity': i.quantity})
            .toList(),
      }),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withValues(alpha: 0.15),
              const Color(0xFF1F2937),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.delivery_dining,
                color: AppColors.primary,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Đơn đang thực hiện',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    order.restaurantName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    order.statusText,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF6B7280)),
          ],
        ),
      ),
    );
  }
}
