import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';

class ReviewScreen extends ConsumerStatefulWidget {
  final String orderId;

  const ReviewScreen({super.key, required this.orderId});

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  double _foodRating = 5.0;
  double _deliveryRating = 5.0;
  final _commentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(orderProvider.notifier).fetchOrderDetail(widget.orderId);
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    setState(() => _isSubmitting = true);

    try {
      await ref.read(orderProvider.notifier).submitReview(
        widget.orderId,
        _foodRating,
        _deliveryRating,
        _commentController.text.trim(),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đánh giá thành công!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Có lỗi xảy ra. Vui lòng thử lại.'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);
    final order = orderState.currentTrackingOrder;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Đánh giá đơn hàng'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order summary
            if (order != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.cardBackground,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: AppColors.shadow, blurRadius: 6, offset: const Offset(0, 2)),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.restaurant, color: AppColors.primary, size: 32),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.restaurantName,
                            style: AppTextStyles.headline4,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${order.items.length} món · ${_formatPrice(order.total)}',
                            style: AppTextStyles.bodySmall,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            order.items.map((item) => item.name).join(', '),
                            style: AppTextStyles.caption,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 32),

            // Food rating
            const Text('Chất lượng món ăn', style: AppTextStyles.headline4),
            const SizedBox(height: 12),
            Center(
              child: Column(
                children: [
                  RatingBar.builder(
                    initialRating: _foodRating,
                    minRating: 1,
                    direction: Axis.horizontal,
                    allowHalfRating: true,
                    itemCount: 5,
                    itemSize: 44,
                    itemPadding: const EdgeInsets.symmetric(horizontal: 4),
                    itemBuilder: (context, _) => const Icon(
                      Icons.star,
                      color: AppColors.accent,
                    ),
                    onRatingUpdate: (rating) => setState(() => _foodRating = rating),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getRatingText(_foodRating),
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Delivery rating
            const Text('Chất lượng giao hàng', style: AppTextStyles.headline4),
            const SizedBox(height: 12),
            Center(
              child: Column(
                children: [
                  RatingBar.builder(
                    initialRating: _deliveryRating,
                    minRating: 1,
                    direction: Axis.horizontal,
                    allowHalfRating: true,
                    itemCount: 5,
                    itemSize: 44,
                    itemPadding: const EdgeInsets.symmetric(horizontal: 4),
                    itemBuilder: (context, _) => const Icon(
                      Icons.star,
                      color: AppColors.primary,
                    ),
                    onRatingUpdate: (rating) => setState(() => _deliveryRating = rating),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getRatingText(_deliveryRating),
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Comment
            const Text('Nhận xét của bạn', style: AppTextStyles.headline4),
            const SizedBox(height: 12),
            TextField(
              controller: _commentController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Chia sẻ trải nghiệm của bạn về món ăn và dịch vụ giao hàng...',
                hintStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textHint),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : const Text('Gửi đánh giá'),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  String _getRatingText(double rating) {
    if (rating >= 4.5) return 'Tuyệt vời!';
    if (rating >= 3.5) return 'Tốt';
    if (rating >= 2.5) return 'Trung bình';
    if (rating >= 1.5) return 'Kém';
    return 'Rất tệ';
  }

  String _formatPrice(double price) {
    return '${price.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]}.',
    )}đ';
  }
}
