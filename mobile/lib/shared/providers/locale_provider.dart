import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _localeStorageKey = 'app_locale';
const _defaultLocale = Locale('vi');

/// Persists the current [Locale] to FlutterSecureStorage.
/// Defaults to Vietnamese on first launch.
class LocaleNotifier extends Notifier<Locale> {
  static const _storage = FlutterSecureStorage();

  @override
  Locale build() {
    // Kick off async load without blocking initial render.
    _loadPersistedLocale();
    return _defaultLocale;
  }

  Future<void> _loadPersistedLocale() async {
    try {
      final saved = await _storage.read(key: _localeStorageKey);
      if (saved != null && saved != state.languageCode) {
        state = Locale(saved);
      }
    } catch (_) {
      // Storage read failed — keep default locale.
    }
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    try {
      await _storage.write(
        key: _localeStorageKey,
        value: locale.languageCode,
      );
    } catch (_) {
      // Persist failure is non-fatal — locale is still updated in-memory.
    }
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(
  LocaleNotifier.new,
);
