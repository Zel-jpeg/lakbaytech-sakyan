# 🚗 Sakyan Flutter App — Complete Booking Flow Implementation Guide

> **PURPOSE:** This file documents ALL files across the Flutter app, web frontend, and Django backend that are needed to implement the complete booking flow. Read this file before writing any code. It contains the exact behavior to replicate, reference file paths, API contracts, and step-by-step code changes.

---

## 📍 Project Locations

```
Flutter app:     c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\lib\
Web frontend:    c:\Users\acer\Downloads\capstone\Sakyan\sakyan-frontend\src\
Django backend:  c:\Users\acer\Downloads\capstone\Sakyan\sakyan-backend\api\
```

---

## 🎯 What Needs to Be Done (4 Features)

1. **KYC Verification Gating** — Check KYC status before allowing "Book Now"
2. **Post-Booking Redirect** — GCash → chat with partner, Cash → confirmation page
3. **Image Upload in Chat** — Attach & view images (GCash receipts) in messages
4. **Message Model Update** — Add `imageUrl` field to support image messages

---

## 📁 ALL Reference Files Needed

### Flutter App Files (TO MODIFY)

| # | File | Purpose |
|---|------|---------|
| 1 | `lib/core/constants/app_constants.dart` | Add `bucketChatImages` constant |
| 2 | `lib/features/cars/screens/car_detail_screen.dart` | Add KYC gating on "Book Now" |
| 3 | `lib/features/booking/screens/checkout_screen.dart` | Add KYC guard + GCash→chat redirect |
| 4 | `lib/features/booking/screens/confirmation_screen.dart` | Add "Chat with Partner" CTA |
| 5 | `lib/features/messages/models/message_model.dart` | Add `imageUrl` field |
| 6 | `lib/features/messages/data/message_repository.dart` | Send `image_url` in payload |
| 7 | `lib/features/messages/providers/message_provider.dart` | Pass `imageUrl` through |
| 8 | `lib/features/messages/screens/chat_screen.dart` | Image picker, upload, display |

### Flutter App Files (READ-ONLY REFERENCE)

| File | Why You Need It |
|------|-----------------|
| `lib/core/router/app_router.dart` | Route definitions, `/chat/:bookingId` already exists |
| `lib/core/services/api_service.dart` | Dio HTTP client with JWT interceptor |
| `lib/core/services/supabase_service.dart` | `uploadFile()` helper for Supabase storage |
| `lib/core/services/storage_service.dart` | Token management |
| `lib/core/constants/api_constants.dart` | All API endpoint paths |
| `lib/core/constants/app_colors.dart` | Color tokens used across app |
| `lib/features/auth/models/user_model.dart` | User model (no KYC status field) |
| `lib/features/auth/providers/auth_provider.dart` | `currentUserProvider`, auth state |
| `lib/features/kyc/providers/kyc_provider.dart` | `kycStatusProvider` — fetches KYC status |
| `lib/features/kyc/data/kyc_repository.dart` | `getKycStatus()` API call |
| `lib/features/kyc/models/kyc_model.dart` | `KycModel` with status field |
| `lib/features/booking/models/booking_model.dart` | `BookingModel` with `partnerUserId`, `id` |
| `lib/features/booking/data/booking_repository.dart` | `createBooking()` API call |
| `lib/features/booking/providers/booking_provider.dart` | `createBookingProvider` |
| `lib/features/booking/screens/my_bookings_screen.dart` | Existing "Message Partner" button (reference) |

### Web Frontend Files (REFERENCE — behavior to replicate)

| File | Why You Need It |
|------|-----------------|
| `src/pages/public/CarDetailPage.jsx` | **KYC gating logic** — lines 351-372 |
| `src/pages/booking/CheckoutPage.jsx` | **KYC guard** (lines 376-385), **post-booking redirect** (lines 467-473) |
| `src/pages/booking/ConfirmationPage.jsx` | **Chat CTA for GCash** (lines 163-170) |
| `src/pages/messages/InboxPage.jsx` | **Image upload, preview, lightbox** (lines 62-119, 328-345) |
| `src/hooks/useFileUpload.js` | **Supabase upload to `chat-images`** bucket |
| `src/hooks/useMessages.js` | **Send message with `image_url`** (lines 58-64) |

### Django Backend Files (REFERENCE — API contracts)

| File | Why You Need It |
|------|-----------------|
| `api/models.py` | **Message model** (lines 210-223): `image_url = TextField(blank=True, null=True)` |
| `api/serializers.py` | **MessageSerializer** (lines 260-275): includes `image_url` field |
| `api/views/message_views.py` | **SendMessageView** (line 33): `image_url=request.data.get('image_url')` |
| `api/views/booking_views.py` | **CreateBookingView** (lines 12-69): returns full booking data |

---

## 🔑 Feature 1: KYC Verification Gating

### How the Web Does It (CarDetailPage.jsx lines 351-372)

```javascript
const handleBookNow = () => {
  if (!user) { navigate('/login'); return; }

  // Both customers and partners must have verified KYC
  if (user.role === 'customer' || user.role === 'partner') {
    const kycStatus = user.customer_profile?.kyc_status
    if (kycStatus === 'pending') { navigate('/kyc/pending'); return; }
    if (!kycStatus || kycStatus === 'not_submitted' || kycStatus === 'rejected') {
      navigate('/kyc/verify'); return;
    }
    // kycStatus === 'approved' — proceed
  }
  navigate(`/booking/checkout/${car.id}`)
}
```

The web also shows different CTA buttons based on KYC status (lines 544-649):
- **approved** → "Book Now" button
- **pending** → amber banner + "Check verification status" button
- **not_submitted/rejected** → orange banner + "Verify My Identity" button

### How the Web Guards Checkout (CheckoutPage.jsx lines 376-385)

```javascript
useEffect(() => {
  if (!user || !profile) return
  const kycStatus = profile?.customer_profile?.kyc_status
  if (kycStatus === 'approved') return  // all good
  if (kycStatus === 'pending') {
    navigate('/kyc/pending', { replace: true })
  } else {
    navigate('/kyc/verify', { state: { from: `/booking/checkout/${carId}` }, replace: true })
  }
}, [user, profile, carId, navigate])
```

### What to Do in Flutter

**File: `car_detail_screen.dart`**

The current "Book Now" button (around line 400+) just checks `user != null` and `car.isAvailable`. Change it to:

1. Import `kycStatusProvider` and `kyc_provider.dart`
2. When user taps "Book Now":
   - Read `kycStatusProvider` to get KYC status
   - If `approved` → navigate to `/checkout/${carId}`
   - If `pending` → navigate to `/kyc/pending`
   - If `not_submitted` or `rejected` or null → navigate to `/kyc/verify`
3. Show KYC status banner above the button when not approved

**Important:** The Flutter `UserModel` does NOT have `customer_profile.kyc_status`. You must fetch it via `kycStatusProvider` which calls `GET /customer/kyc/` and returns a `KycModel` with a `status` field.

**File: `checkout_screen.dart`**

Add a KYC guard in the build method:
1. Watch `kycStatusProvider`
2. If not approved, redirect away (same logic as web)

### KYC Provider (already exists)

```
lib/features/kyc/providers/kyc_provider.dart
```
- `kycStatusProvider` = `FutureProvider` that calls `KycRepository.getKycStatus()`
- Returns `KycModel` with `.status` field (`'pending'`, `'approved'`, `'rejected'`, `'not_submitted'`)

### KYC Repository (already exists)

```
lib/features/kyc/data/kyc_repository.dart
```
- `getKycStatus()` → `GET /customer/kyc/` → returns KYC profile JSON

### Backend KYC Endpoint

```
GET /customer/kyc/  (alias: GET /bookings/kyc/)
```
Returns:
```json
{
  "id": "uuid",
  "kyc_status": "not_submitted | pending | approved | rejected",
  "is_verified": false,
  "contact_number": "",
  "address": "",
  "drivers_license_url": "",
  "valid_id_url": "",
  "selfie_url": "",
  ...
}
```

If no profile exists, returns:
```json
{ "kyc_status": "not_submitted", "is_verified": false }
```

---

## 🔑 Feature 2: Post-Booking Redirect

### How the Web Does It (CheckoutPage.jsx lines 453-476)

```javascript
const booking = await createBooking.mutateAsync({ ...data })

// GCash → go to messages so customer can coordinate with partner
if (paymentMethod === 'gcash') {
  navigate(`/messages?booking=${booking.id}`, {
    state: { booking, car, justBooked: true }
  })
} else {
  navigate(`/booking/confirmation/${booking.booking_code}`, {
    state: { booking, car }
  })
}
```

### What to Do in Flutter

**File: `checkout_screen.dart`** — In the `_submit()` method:

After successful booking creation:
```dart
final booking = await ref.read(createBookingProvider.notifier).create(data);

if (paymentMethod == 'gcash') {
  // Navigate to chat with partner
  context.go('/chat/${booking.id}', extra: {
    'receiverId': booking.partnerUserId,
    'name': booking.partnerName.isNotEmpty ? booking.partnerName : 'Partner',
    'carName': booking.carName,
  });
} else {
  // Navigate to confirmation page
  context.go('/confirmation/${booking.bookingCode}', extra: {
    'booking': booking,
    'paymentMethod': paymentMethod,
  });
}
```

**File: `confirmation_screen.dart`**

Currently shows booking code and "View My Bookings" / "Browse Cars" buttons.

Add:
- Accept optional booking data via `context.extra` for richer display
- Add payment method info note:
  - GCash: "Chat with the partner to coordinate your GCash payment"
  - Cash: "Pay the full amount in cash on pickup/delivery day"
- Add "Chat with Partner" button for GCash bookings (linking to `/chat/${bookingId}`)

### Web Confirmation Page Reference (ConfirmationPage.jsx lines 162-188)

```javascript
{/* CTAs */}
{booking.payment_method === 'gcash' ? (
  <button onClick={() => navigate(`/messages?booking=${booking.id}`)}>
    Chat with Partner
  </button>
) : (
  <button onClick={() => navigate('/booking/my-bookings')}>
    View my bookings
  </button>
)}
```

### Booking Create API Response

```
POST /bookings/
```
**Request body:**
```json
{
  "car": "uuid",
  "start_date": "2026-01-15",
  "end_date": "2026-01-20",
  "payment_method": "gcash",
  "fulfillment_type": "pickup",
  "delivery_address": "",
  "delivery_lat": null,
  "delivery_lng": null,
  "special_requests": ""
}
```

**Response** (full BookingSerializer):
```json
{
  "id": "uuid",
  "booking_code": "SKY-20260115-A1B2",
  "car": "uuid",
  "car_name": "Toyota Wigo 2024",
  "car_id": "uuid",
  "customer": "uuid",
  "customer_name": "John Doe",
  "partner": "uuid",
  "partner_name": "AutoRent Manila",
  "start_date": "2026-01-15",
  "end_date": "2026-01-20",
  "total_days": 5,
  "price_per_day": "1500.00",
  "subtotal": "7500.00",
  "booking_fee": "100.00",
  "total_amount": "7600.00",
  "payment_method": "gcash",
  "payment_status": "pending",
  "booking_status": "pending_review",
  "fulfillment_type": "pickup",
  ...
}
```

### BookingModel.fromJson (Flutter)

The existing `booking_model.dart` already parses `partnerUserId` and `partnerName` from the nested response:
```dart
// Relevant fields:
final String id;
final String bookingCode;
final String carName;
final String partnerUserId;
final String partnerName;
final String paymentMethod;
```

### Router (already configured)

```dart
// /chat/:bookingId route exists at line 328 of app_router.dart:
GoRoute(
  path: '/chat/:bookingId',
  builder: (_, s) {
    final extra = s.extra as Map<String, dynamic>? ?? {};
    return ChatScreen(
      bookingId:    s.pathParameters['bookingId']!,
      receiverId:   extra['receiverId']   as String?,
      receiverName: extra['name']         as String?,
      carName:      extra['carName']       as String?,
    );
  },
),
```

---

## 🔑 Feature 3: Image Upload in Chat

### How the Web Does It

**Upload (useFileUpload.js):**
1. User picks a file via `<input type="file">`
2. Image is compressed to WebP (max 1280px, 82% quality)
3. Uploaded to Supabase `chat-images` bucket
4. Returns public URL

**Send (useMessages.js lines 58-64):**
```javascript
api.post('/messages/', {
  booking:   bookingId,
  receiver:  receiverId,
  content:   content || '',
  image_url: imageUrl || null,
})
```

**Display (InboxPage.jsx MessageBubble lines 62-99):**
- If `msg.image_url` exists, render `<img>` with max height 200px
- On click, open fullscreen lightbox overlay
- Show content text below image if both exist

**Image Preview (InboxPage.jsx lines 101-119):**
- Show preview strip above input bar when image is selected
- 80x80 thumbnail with X button to remove
- "Image ready to send" caption

### Backend API Contract for Messages

**Message model** (`api/models.py` line 210-222):
```python
class Message(models.Model):
    id        = UUIDField(primary_key=True)
    booking   = ForeignKey(Booking, null=True, blank=True)  # null = support
    sender    = ForeignKey(User, related_name='sent_messages')
    receiver  = ForeignKey(User, related_name='received_messages')
    content   = TextField(blank=True)          # optional when image_url provided
    image_url = TextField(blank=True, null=True)  # ← THIS IS THE KEY FIELD
    is_read   = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

**MessageSerializer** (`api/serializers.py` lines 260-275):
```python
class MessageSerializer(serializers.ModelSerializer):
    sender_name = CharField(source='sender.full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'booking', 'sender', 'receiver', 'sender_name',
                  'content', 'image_url', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']
```

**SendMessageView** (`api/views/message_views.py` lines 26-34):
```python
class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            image_url=self.request.data.get('image_url') or None,
        )
```

### What to Do in Flutter

#### Step 3a: Add bucket constant

**File: `app_constants.dart`**
```dart
static const String bucketChatImages = 'chat-images';
```

#### Step 3b: Update MessageModel

**File: `message_model.dart`**

Add `imageUrl` field:
```dart
class MessageModel {
  final String id;
  final String? bookingId;
  final String senderId;
  final String senderName;
  final String senderAvatar;
  final String receiverId;
  final String receiverName;
  final String content;
  final String? imageUrl;  // ← ADD THIS
  final bool isRead;
  final DateTime createdAt;
```

In `fromJson`:
```dart
// Parse image_url
final rawImgUrl = json['image_url'];
final imageUrl = (rawImgUrl is String && rawImgUrl.isNotEmpty) ? rawImgUrl : null;
```

#### Step 3c: Update MessageRepository

**File: `message_repository.dart`**

Update `sendMessage()`:
```dart
Future<MessageModel> sendMessage({
  required String bookingId,
  required String receiverId,
  required String content,
  String? imageUrl,  // ← ADD THIS
}) async {
  final payload = {
    'booking': bookingId,
    'receiver': receiverId,
    'content': content,
    if (imageUrl != null) 'image_url': imageUrl,  // ← ADD THIS
  };
  // ... rest of method uses payload
}
```

The existing repository already has primary/fallback logic for `receiver` vs `receiver_id` field names. Keep that, just add `image_url` to the payload.

#### Step 3d: Update ChatNotifier

**File: `message_provider.dart`**

Update `send()`:
```dart
Future<void> send({
  required String receiverId,
  required String content,
  String? imageUrl,  // ← ADD THIS
}) async {
  final msg = await ref.read(messageRepositoryProvider).sendMessage(
    bookingId:  arg,
    receiverId: receiverId,
    content:    content,
    imageUrl:   imageUrl,  // ← ADD THIS
  );
  // ...
}
```

#### Step 3e: Update ChatScreen

**File: `chat_screen.dart`**

Major changes needed:

1. **Add imports:**
   ```dart
   import 'package:image_picker/image_picker.dart';
   import '../../../core/services/supabase_service.dart';
   import '../../../core/constants/app_constants.dart';
   ```

2. **Add state variables:**
   ```dart
   XFile? _selectedImage;
   bool _uploading = false;
   ```

3. **Add image picker button (📎)** next to the send button:
   ```dart
   IconButton(
     icon: Icon(Icons.attach_file_rounded),
     onPressed: () => _pickImage(),
   )
   ```

4. **Pick image method:**
   ```dart
   Future<void> _pickImage() async {
     final picker = ImagePicker();
     final picked = await picker.pickImage(
       source: ImageSource.gallery,
       maxWidth: 1280,
       maxHeight: 1280,
       imageQuality: 80,
     );
     if (picked != null) setState(() => _selectedImage = picked);
   }
   ```

5. **Image preview strip** above input bar (when image selected):
   ```dart
   if (_selectedImage != null) _ImagePreview(
     file: _selectedImage!,
     onRemove: () => setState(() => _selectedImage = null),
   ),
   ```

6. **Upload & send logic** (modify existing _send method):
   ```dart
   Future<void> _send() async {
     final text = _controller.text.trim();
     if (text.isEmpty && _selectedImage == null) return;

     String? imageUrl;
     if (_selectedImage != null) {
       setState(() => _uploading = true);
       final bytes = await _selectedImage!.readAsBytes();
       final ext = _selectedImage!.name.split('.').last;
       final fileName = '${DateTime.now().millisecondsSinceEpoch}-${UniqueKey()}.${ext}';
       imageUrl = await SupabaseService.uploadFile(
         bucket: AppConstants.bucketChatImages,
         fileName: fileName,
         fileBytes: bytes,
         contentType: 'image/$ext',
       );
       setState(() { _uploading = false; _selectedImage = null; });
     }

     _controller.clear();
     await ref.read(chatProvider(widget.bookingId).notifier).send(
       receiverId: _resolvedReceiverId!,
       content: text,
       imageUrl: imageUrl,
     );
   }
   ```

7. **Render images in message bubbles:**
   In the `_MessageBubble` widget, check `message.imageUrl`:
   ```dart
   if (message.imageUrl != null && message.imageUrl!.isNotEmpty)
     GestureDetector(
       onTap: () => _showFullScreenImage(context, message.imageUrl!),
       child: ClipRRect(
         borderRadius: BorderRadius.circular(12),
         child: Image.network(
           message.imageUrl!,
           width: 200, height: 150,
           fit: BoxFit.cover,
           loadingBuilder: // shimmer,
           errorBuilder: // error icon,
         ),
       ),
     ),
   ```

8. **Fullscreen image viewer:**
   ```dart
   void _showFullScreenImage(BuildContext context, String url) {
     showDialog(
       context: context,
       builder: (_) => Dialog(
         backgroundColor: Colors.black87,
         insetPadding: const EdgeInsets.all(8),
         child: Stack(children: [
           InteractiveViewer(
             child: Image.network(url, fit: BoxFit.contain),
           ),
           Positioned(top: 8, right: 8, child: IconButton(
             icon: Icon(Icons.close, color: Colors.white),
             onPressed: () => Navigator.pop(context),
           )),
         ]),
       ),
     );
   }
   ```

### Supabase Upload Helper (already exists)

```dart
// lib/core/services/supabase_service.dart
static Future<String> uploadFile({
  required String bucket,
  required String fileName,
  required Uint8List fileBytes,
  String contentType = 'image/jpeg',
}) async {
  await client.storage.from(bucket).uploadBinary(
    fileName, fileBytes,
    fileOptions: FileOptions(contentType: contentType, upsert: true),
  );
  return client.storage.from(bucket).getPublicUrl(fileName);
}
```

### Supabase Bucket

The `chat-images` bucket already exists in Supabase and is used by the web frontend via `useFileUpload('chat-images')`.

---

## 📋 Implementation Checklist

### Phase A: Constants & Model Updates
- [ ] Add `bucketChatImages = 'chat-images'` to `app_constants.dart`
- [ ] Add `imageUrl` field to `MessageModel` in `message_model.dart`
- [ ] Update `MessageRepository.sendMessage()` to accept `imageUrl`
- [ ] Update `ChatNotifier.send()` to accept `imageUrl`

### Phase B: KYC Gating
- [ ] Update `car_detail_screen.dart` — check KYC on "Book Now" tap
- [ ] Show KYC status banner (pending/not submitted) above Book Now button
- [ ] Add KYC guard to `checkout_screen.dart` (redirect if not approved)

### Phase C: Post-Booking Redirect
- [ ] Update `checkout_screen.dart` `_submit()` — GCash→chat, Cash→confirmation
- [ ] Update `confirmation_screen.dart` — accept extra data, show payment info, add chat CTA

### Phase D: Image Upload in Chat
- [ ] Add image picker button to `chat_screen.dart` input bar
- [ ] Add image preview strip above input
- [ ] Upload to Supabase `chat-images` on send
- [ ] Render `imageUrl` in message bubbles
- [ ] Add fullscreen image viewer on tap

### Phase E: Testing
- [ ] Run `flutter analyze` — no errors
- [ ] Test KYC flow: Book Now → KYC check → redirect
- [ ] Test Cash booking → confirmation page
- [ ] Test GCash booking → chat screen
- [ ] Test image attach → upload → display
- [ ] Test image tap → fullscreen viewer

---

## ⚠️ Important Gotchas

### 1. DRF Field Name Quirks
The Django backend expects `receiver` (not `receiver_id`) for the message POST. But some DRF versions require `_id` suffix for FK writes. The existing `message_repository.dart` has a primary+fallback pattern:
- First try: `{ 'booking': id, 'receiver': id, 'content': '...', 'image_url': '...' }`
- If 400 error: retry with `{ 'booking_id': id, 'receiver_id': id, ... }`

### 2. KYC Status Not in UserModel
The Flutter `UserModel` does NOT contain `customer_profile.kyc_status` (unlike the web's `user.customer_profile?.kyc_status`). You must use `kycStatusProvider` which calls the separate `GET /customer/kyc/` endpoint.

### 3. BookingModel Has Partner Info
The `BookingModel.fromJson()` already extracts `partnerUserId` (the partner's user UUID, not partner profile UUID). This is needed for the chat `receiverId`.

### 4. Image Upload Returns Public URL
Supabase `uploadBinary()` then `getPublicUrl()` returns a permanent URL like:
```
https://qmgudvzujoxfvilipjgn.supabase.co/storage/v1/object/public/chat-images/1234567890-abc.jpg
```
This URL is sent as `image_url` in the message POST and stored in the database.

### 5. Router Extra Data
The `/chat/:bookingId` route accepts `extra` map with `receiverId`, `name`, `carName`. The `/confirmation/:code` route can be enhanced to accept `extra` booking data.

### 6. `image_picker` Package Already in pubspec.yaml
The `image_picker: ^1.1.2` dependency is already listed. No package install needed.

---

## 💬 How to Continue in a New Conversation

> "I am building a Flutter app for Sakyan (car rental). I need to implement the booking flow with KYC gating, post-booking redirects, and image upload in chat. Read this guide first:
> `c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\BOOKING_FLOW_GUIDE.md`
> Then implement the changes in order from the checklist. The Flutter project is at `c:\Users\acer\Downloads\capstone\Sakyan\sakyan-app\`"

---

*Last updated: 2026-05-10 | Status: ✅ FULLY IMPLEMENTED — all 8 files modified, 0 analyzer errors*
