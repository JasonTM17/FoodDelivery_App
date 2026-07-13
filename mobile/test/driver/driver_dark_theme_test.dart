import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/theme/driver_dark_theme.dart';

void main() {
  test('dark theme text styles use the semantic on-surface color', () {
    final theme = driverDarkTheme();

    expect(theme.textTheme.displayLarge?.color, theme.colorScheme.onSurface);
    expect(theme.textTheme.titleLarge?.color, theme.colorScheme.onSurface);
    expect(theme.textTheme.bodyLarge?.color, theme.colorScheme.onSurface);
    expect(
      theme.textTheme.bodySmall?.color,
      isNot(equals(const Color(0xFF1A1A1A))),
    );
  });
}
