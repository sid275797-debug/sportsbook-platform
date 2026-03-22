import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'screens/home_screen.dart';
import 'screens/bet_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/casino_screen.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'providers/auth_provider.dart';

void main() {
  runApp(const ProviderScope(child: SportsbookApp()));
}

final _router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (ctx, state) => const HomeScreen()),
    GoRoute(path: '/login', builder: (ctx, state) => const LoginScreen()),
    GoRoute(path: '/bet/:fixtureId', builder: (ctx, state) => BetScreen(fixtureId: state.pathParameters['fixtureId']!)),
    GoRoute(path: '/wallet', builder: (ctx, state) => const WalletScreen()),
    GoRoute(path: '/casino', builder: (ctx, state) => const CasinoScreen()),
    GoRoute(path: '/profile', builder: (ctx, state) => const ProfileScreen()),
  ],
  redirect: (ctx, state) {
    // Auth guard handled by Riverpod
    return null;
  },
);

class SportsbookApp extends StatelessWidget {
  const SportsbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Sportsbook',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB), brightness: Brightness.dark),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      routerConfig: _router,
    );
  }
}
