import 'package:flutter/material.dart';

class CasinoScreen extends StatelessWidget {
  final String? fixtureId;
  const CasinoScreen({super.key, this.fixtureId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Casino')),
      body: const Center(child: Text('Coming soon')),
    );
  }
}
