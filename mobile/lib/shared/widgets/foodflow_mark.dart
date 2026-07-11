import 'package:flutter/material.dart';

/// Canonical FoodFlow brand mark shared by the customer and driver apps.
class FoodFlowMark extends StatelessWidget {
  const FoodFlowMark({
    super.key,
    required this.size,
    this.borderRadius,
    this.boxShadow = const [],
  });

  final double size;
  final double? borderRadius;
  final List<BoxShadow> boxShadow;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius ?? size * 0.28);

    return Semantics(
      image: true,
      label: 'FoodFlow',
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(borderRadius: radius, boxShadow: boxShadow),
        child: ClipRRect(
          borderRadius: radius,
          child: Image.asset(
            'assets/icons/foodflow-mark.png',
            width: size,
            height: size,
            fit: BoxFit.cover,
            filterQuality: FilterQuality.high,
            excludeFromSemantics: true,
          ),
        ),
      ),
    );
  }
}
