import 'package:flutter/material.dart';

class BetScreen extends StatelessWidget {
  final String? fixtureId;
  const BetScreen({super.key, this.fixtureId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bet')),
      body: const Center(child: Text('Coming soon')),
    );
  }
}
