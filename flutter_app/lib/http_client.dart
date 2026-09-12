/// Capa HTTP mínima compartida por los servicios (equivale a `src/services/http.ts`).
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiError implements Exception {
  final String message;
  final int status;
  final String url;
  ApiError(this.message, this.status, this.url);

  @override
  String toString() => message;
}

Future<dynamic> getJson(String url, {Duration timeout = const Duration(seconds: 12)}) async {
  try {
    final res = await http
        .get(Uri.parse(url), headers: {'Accept': 'application/json'})
        .timeout(timeout);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiError('La API respondió ${res.statusCode}', res.statusCode, url);
    }
    return jsonDecode(utf8.decode(res.bodyBytes));
  } on ApiError {
    rethrow;
  } catch (_) {
    throw ApiError('Sin conexión: revisa tu red e inténtalo de nuevo.', 0, url);
  }
}
