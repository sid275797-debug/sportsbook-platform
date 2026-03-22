import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  final String? fixtureId;
  const ProfileScreen({super.key, this.fixtureId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(child: Text('Coming soon')),
    );
  }
}
