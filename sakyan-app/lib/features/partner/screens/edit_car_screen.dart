import 'package:flutter/material.dart';

class EditCarScreen extends StatelessWidget {
  final String carId;
  const EditCarScreen({super.key, required this.carId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('EditCarScreen')),
      body: const Center(child: Text('EditCarScreen — coming soon')),
    );
  }
}
