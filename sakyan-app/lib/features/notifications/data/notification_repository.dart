import '../../../core/services/api_service.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  const NotificationRepository();

  Future<List<NotificationModel>> getNotifications() async {
    final res = await ApiService.get('/notifications/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markAllRead() async {
    await ApiService.post('/notifications/read-all/');
  }

  Future<void> markRead(String id) async {
    await ApiService.post('/notifications/$id/read/');
  }
}