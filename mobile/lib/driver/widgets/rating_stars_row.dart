import 'package:flutter/material.dart';

class RatingStarsRow extends StatelessWidget {
  final int rating;
  final double size;
  final bool showRating;
  final Color activeColor;

  const RatingStarsRow({
    super.key,
    required this.rating,
    this.size = 16,
    this.showRating = false,
    this.activeColor = const Color(0xFFF59E0B),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (i) {
          return Icon(
            i < rating ? Icons.star : Icons.star_border,
            size: size,
            color: i < rating ? activeColor : const Color(0xFF4B5563),
          );
        }),
        if (showRating) ...[
          const SizedBox(width: 6),
          Text(
            '$rating/5',
            style: TextStyle(
              fontSize: size - 2,
              fontWeight: FontWeight.w600,
              color: activeColor,
            ),
          ),
        ],
      ],
    );
  }
}
