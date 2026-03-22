import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';

class AuthState {
  final bool isLoggedIn;
  final Map<String, dynamic>? user;
  final String? error;

  const AuthState({this.isLoggedIn = false, this.user, this.error});

  AuthState copyWith({bool? isLoggedIn, Map<String, dynamic>? user, String? error}) =>
      AuthState(isLoggedIn: isLoggedIn ?? this.isLoggedIn, user: user ?? this.user, error: error);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  AuthNotifier(this._api) : super(const AuthState()) { _loadSession(); }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString('accessToken') != null) {
      try {
        final res = await _api.get('/api/auth/me');
        state = AuthState(isLoggedIn: true, user: res.data['data'] as Map<String, dynamic>);
      } catch (_) { await prefs.clear(); }
    }
  }

  Future<void> login(String email, String password) async {
    try {
      final res = await _api.post('/api/auth/login', data: {'email': email, 'password': password});
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', res.data['data']['accessToken']);
      await prefs.setString('refreshToken', res.data['data']['refreshToken']);
      final me = await _api.get('/api/auth/me');
      state = AuthState(isLoggedIn: true, user: me.data['data'] as Map<String, dynamic>);
    } catch (e) {
      state = state.copyWith(error: 'Invalid credentials');
    }
  }

  Future<void> logout() async {
    await _api.post('/api/auth/logout');
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    state = const AuthState();
  }
}

final apiClientProvider = Provider((_) => ApiClient());
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref.watch(apiClientProvider)));
