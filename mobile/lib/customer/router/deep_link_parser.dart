import 'route_names.dart';

/// Parses deep link URIs (foodflow:// and https://foodflow.vn/) into route paths.
class DeepLinkParser {
  DeepLinkParser._();

  /// Parse a deep link string and return the matching go_router location.
  ///
  /// Returns null if the URI doesn't match any known pattern.
  static String? parse(String uriString) {
    final uri = Uri.tryParse(uriString);
    if (uri == null) return null;

    // Handle foodflow:// scheme
    if (uri.scheme == DeepLinkScheme.foodflow) {
      return _parseFoodflowLink(uri);
    }

    // Handle https://foodflow.vn scheme
    if (uri.scheme == DeepLinkScheme.https && uri.host == 'foodflow.vn') {
      return _parseHttpsLink(uri);
    }

    return null;
  }

  static String? _parseFoodflowLink(Uri uri) {
    final pathSegments = uri.pathSegments;
    if (pathSegments.isEmpty) return null;

    switch (pathSegments[0]) {
      case 'order':
        if (pathSegments.length >= 2) {
          return '${Routes.orderTracking}';
        }
        return null;
      case 'restaurant':
        if (pathSegments.length >= 2) {
          return '${Routes.restaurantDetail}';
        }
        return null;
      case 'promo':
        if (pathSegments.length >= 2) {
          return Routes.vouchers;
        }
        return null;
      default:
        return null;
    }
  }

  static String? _parseHttpsLink(Uri uri) {
    return _parseFoodflowLink(uri);
  }

  /// Parse a route and build path with extras for GoRouter.
  static ({String path, Object? extra})? parseWithExtras(String uriString) {
    final uri = Uri.tryParse(uriString);
    if (uri == null) return null;

    final scheme = uri.scheme;
    final pathSegments = uri.pathSegments;
    if (pathSegments.isEmpty) return null;

    if (scheme == DeepLinkScheme.foodflow ||
        (scheme == DeepLinkScheme.https && uri.host == 'foodflow.vn')) {
      switch (pathSegments[0]) {
        case 'order':
          if (pathSegments.length >= 2) {
            return (path: Routes.orderTracking, extra: pathSegments[1]);
          }
          break;
        case 'restaurant':
          if (pathSegments.length >= 2) {
            return (path: Routes.restaurantDetail, extra: pathSegments[1]);
          }
          break;
        case 'promo':
          if (pathSegments.length >= 2) {
            return (path: Routes.vouchers, extra: null);
          }
          break;
      }
    }

    return null;
  }
}
