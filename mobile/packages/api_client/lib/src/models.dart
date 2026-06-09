/// FoodFlow API client — generated from docs/openapi.yaml
/// @version 0.1.0
library;

// ── Pagination ──

class PaginationMeta {
  final int total;
  final int page;
  final int limit;
  final bool hasMore;

  const PaginationMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.hasMore,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) => PaginationMeta(
    total: json['total'] as int,
    page: json['page'] as int,
    limit: json['limit'] as int,
    hasMore: json['hasMore'] as bool,
  );
}

class PaginatedResponse<T> {
  final List<T> data;
  final PaginationMeta meta;

  const PaginatedResponse({required this.data, required this.meta});
}

// ── Problem Detail (RFC 7807) ──

class ProblemDetail {
  final String type;
  final String title;
  final int status;
  final String? detail;
  final String? instance;
  final List<ValidationError>? errors;

  const ProblemDetail({
    required this.type,
    required this.title,
    required this.status,
    this.detail,
    this.instance,
    this.errors,
  });

  factory ProblemDetail.fromJson(Map<String, dynamic> json) => ProblemDetail(
    type: json['type'] as String,
    title: json['title'] as String,
    status: json['status'] as int,
    detail: json['detail'] as String?,
    instance: json['instance'] as String?,
    errors: (json['errors'] as List<dynamic>?)
        ?.map((e) => ValidationError.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

class ValidationError {
  final String field;
  final String message;
  final String code;

  const ValidationError({
    required this.field,
    required this.message,
    required this.code,
  });

  factory ValidationError.fromJson(Map<String, dynamic> json) => ValidationError(
    field: json['field'] as String,
    message: json['message'] as String,
    code: json['code'] as String,
  );
}

// ── Auth ──

class RegisterRequest {
  final String email;
  final String password;
  final String fullName;
  final String? phone;
  final String? role;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.fullName,
    this.phone,
    this.role,
  });

  Map<String, dynamic> toJson() => {
    'email': email,
    'password': password,
    'fullName': fullName,
    if (phone != null) 'phone': phone,
    if (role != null) 'role': role,
  };
}

class LoginRequest {
  final String email;
  final String password;

  const LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

class RefreshRequest {
  final String refreshToken;

  const RefreshRequest({required this.refreshToken});

  Map<String, dynamic> toJson() => {'refreshToken': refreshToken};
}

class SanitizedUser {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String role;
  final String? avatarUrl;
  final bool isActive;
  final String preferredLocale;

  const SanitizedUser({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    required this.role,
    this.avatarUrl,
    required this.isActive,
    required this.preferredLocale,
  });

  factory SanitizedUser.fromJson(Map<String, dynamic> json) => SanitizedUser(
    id: json['id'] as String,
    email: json['email'] as String,
    fullName: json['fullName'] as String,
    phone: json['phone'] as String?,
    role: json['role'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    isActive: json['isActive'] as bool,
    preferredLocale: json['preferredLocale'] as String,
  );
}

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final int? expiresIn;
  final SanitizedUser user;

  const AuthResult({
    required this.accessToken,
    required this.refreshToken,
    this.expiresIn,
    required this.user,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
    expiresIn: json['expiresIn'] as int?,
    user: SanitizedUser.fromJson(json['user'] as Map<String, dynamic>),
  );
}

class JwksResponse {
  final List<JwkKey> keys;

  const JwksResponse({required this.keys});

  factory JwksResponse.fromJson(Map<String, dynamic> json) => JwksResponse(
    keys: (json['keys'] as List<dynamic>)
        .map((e) => JwkKey.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

class JwkKey {
  final String kty;
  final String kid;
  final String crv;
  final String x;
  final String use;

  const JwkKey({
    required this.kty,
    required this.kid,
    required this.crv,
    required this.x,
    required this.use,
  });

  factory JwkKey.fromJson(Map<String, dynamic> json) => JwkKey(
    kty: json['kty'] as String,
    kid: json['kid'] as String,
    crv: json['crv'] as String,
    x: json['x'] as String,
    use: json['use'] as String,
  );
}

class JwksVersionResponse {
  final String version;
  final String generatedAt;
  final int ttlSeconds;

  const JwksVersionResponse({
    required this.version,
    required this.generatedAt,
    required this.ttlSeconds,
  });

  factory JwksVersionResponse.fromJson(Map<String, dynamic> json) =>
      JwksVersionResponse(
        version: json['version'] as String,
        generatedAt: json['generatedAt'] as String,
        ttlSeconds: json['ttlSeconds'] as int,
      );
}
