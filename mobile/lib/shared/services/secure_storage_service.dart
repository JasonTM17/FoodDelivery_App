import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _accessTokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _userRoleKey = 'user_role';

  static SecureStorageService? _instance;
  final FlutterSecureStorage _storage;

  SecureStorageService._() : _storage = const FlutterSecureStorage();

  static SecureStorageService get instance {
    _instance ??= SecureStorageService._();
    return _instance!;
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<void> setAccessToken(String token) =>
      _storage.write(key: _accessTokenKey, value: token);
  Future<void> deleteAccessToken() => _storage.delete(key: _accessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);
  Future<void> setRefreshToken(String token) =>
      _storage.write(key: _refreshTokenKey, value: token);
  Future<void> deleteRefreshToken() => _storage.delete(key: _refreshTokenKey);

  Future<String?> getUserId() => _storage.read(key: _userIdKey);
  Future<void> setUserId(String id) =>
      _storage.write(key: _userIdKey, value: id);

  Future<String?> getUserRole() => _storage.read(key: _userRoleKey);
  Future<void> setUserRole(String role) =>
      _storage.write(key: _userRoleKey, value: role);

  Future<String?> get(String key) => _storage.read(key: key);
  Future<void> set(String key, String value) =>
      _storage.write(key: key, value: value);
  Future<void> delete(String key) => _storage.delete(key: key);

  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userIdKey),
      _storage.delete(key: _userRoleKey),
    ]);
  }
}
