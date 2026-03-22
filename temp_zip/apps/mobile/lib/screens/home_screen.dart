import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';

final liveFixturesProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ApiClient().get('/api/fixtures/live');
  return res.data['data'] as List<dynamic>;
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fixtures = ref.watch(liveFixturesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sportsbook', style: TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.account_balance_wallet_outlined), onPressed: () => context.push('/wallet')),
          IconButton(icon: const Icon(Icons.person_outline), onPressed: () => context.push('/profile')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(liveFixturesProvider),
        child: fixtures.when(
          data: (data) => data.isEmpty
              ? const Center(child: Text('No live matches right now'))
              : ListView.builder(
                  itemCount: data.length,
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (ctx, i) {
                    final f = data[i] as Map<String, dynamic>;
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title: Text('${f['homeTeam']?['name']} vs ${f['awayTeam']?['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(f['sport']?['name'] ?? ''),
                        trailing: const Chip(label: Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 11)), backgroundColor: Colors.red),
                        onTap: () => context.push('/bet/${f['id']}'),
                      ),
                    );
                  },
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err')),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.sports_cricket_outlined), selectedIcon: Icon(Icons.sports_cricket), label: 'Sports'),
          NavigationDestination(icon: Icon(Icons.casino_outlined), selectedIcon: Icon(Icons.casino), label: 'Casino'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Wallet'),
        ],
        onDestinationSelected: (i) {
          if (i == 2) context.push('/casino');
          if (i == 3) context.push('/wallet');
        },
        selectedIndex: 0,
      ),
    );
  }
}
