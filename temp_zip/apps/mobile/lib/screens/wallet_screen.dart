import 'package:flutter/material.dart';

class WalletScreen extends StatelessWidget {
  final String? fixtureId;
  const WalletScreen({super.key, this.fixtureId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: const Center(child: Text('Coming soon')),
    );
  }
}
