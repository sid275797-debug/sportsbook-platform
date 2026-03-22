import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Sportsbook', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              const Text('Log in to your account', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              TextField(controller: _password, decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()), obscureText: true),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _loading ? null : () async {
                  setState(() => _loading = true);
                  await ref.read(authProvider.notifier).login(_email.text.trim(), _password.text);
                  setState(() => _loading = false);
                  final auth = ref.read(authProvider);
                  if (auth.isLoggedIn && mounted) context.go('/');
                },
                child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Log In'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
