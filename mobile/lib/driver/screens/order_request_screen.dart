import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/models/order.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/driver_provider.dart';
import '../widgets/order_request_dialog.dart';

class OrderRequestScreen extends ConsumerWidget {
  final OrderModel order;

  const OrderRequestScreen({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(driverProvider);

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.black87,
        body: OrderRequestDialog(
          order: order,
          onAccept: () async {
            await ref.read(driverProvider.notifier).acceptOrder(order.id);
            if (mounted && ref.read(driverProvider).activeOrder != null) {
              context.go('/delivery-flow');
            }
          },
          onDecline: () {
            ref.read(driverProvider.notifier).declineOrder(order.id);
            if (mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }
}
