from rest_framework import serializers
from .models import User, Partner, Car, CarImage, CustomerProfile, Booking, Message, Notification, PlatformSetting, PartnerSettlement, PartnerBoostRequest


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        exclude = ['user']
        read_only_fields = ['is_verified', 'kyc_status', 'kyc_rejection_reason',
                            'kyc_submitted_at', 'kyc_reviewed_at', 'kyc_reviewed_by']


class KYCSubmitSerializer(serializers.ModelSerializer):
    """Used by customers to submit their KYC data."""
    class Meta:
        model = CustomerProfile
        fields = [
            'birthday', 'contact_number', 'address', 'address_lat', 'address_lng',
            'drivers_license_number', 'license_expiry', 'valid_id_type',
            'drivers_license_url', 'valid_id_url',
            'agreement_accepted', 'agreement_signature', 'agreement_signed_at',
        ]


class KYCAdminSerializer(serializers.ModelSerializer):
    """Used by admin to list & review KYC submissions."""
    user_id    = serializers.UUIDField(source='user.id', read_only=True)
    full_name  = serializers.CharField(source='user.full_name', read_only=True)
    email      = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'user_id', 'full_name', 'email',
            'contact_number', 'address', 'address_lat', 'address_lng',
            'drivers_license_url', 'valid_id_url',
            'kyc_status', 'kyc_rejection_reason',
            'kyc_submitted_at', 'kyc_reviewed_at',
            'is_verified',
            'agreement_accepted', 'agreement_signature', 'agreement_signed_at',
        ]
        read_only_fields = ['id', 'user_id', 'full_name', 'email']


class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(source='profile', read_only=True)
    # 'pending' | 'rejected' | None  — lets frontend redirect pending applicants
    # to the waiting page instead of restarting onboarding from step 1
    partner_status   = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'avatar_url',
                  'created_at', 'customer_profile', 'partner_status']
        read_only_fields = ['id', 'role', 'created_at']

    def get_partner_status(self, obj):
        try:
            return obj.partner.status   # 'pending' | 'approved' | 'rejected'
        except Exception:
            return None



class RegisterSerializer(serializers.Serializer):
    user_id     = serializers.UUIDField()
    full_name   = serializers.CharField(max_length=255)
    email       = serializers.EmailField()
    phone       = serializers.CharField(max_length=20, required=False, allow_blank=True)
    avatar_url  = serializers.URLField(required=False, allow_blank=True)

    def create(self, validated_data):
        user, created = User.objects.get_or_create(
            id=validated_data['user_id'],
            defaults={
                'full_name':  validated_data['full_name'],
                'email':      validated_data['email'],
                'phone':      validated_data.get('phone', ''),
                'avatar_url': validated_data.get('avatar_url', ''),
                'role':       'customer',
            }
        )
        
        if not created:
            # Fix for accounts that were created during the native auth issue
            # where full_name and avatar_url were empty.
            needs_update = False
            if not user.full_name and validated_data.get('full_name'):
                user.full_name = validated_data['full_name']
                needs_update = True
                
            if not user.avatar_url and validated_data.get('avatar_url'):
                user.avatar_url = validated_data['avatar_url']
                needs_update = True
                
            if needs_update:
                user.save(update_fields=['full_name', 'avatar_url'])
                
        return user


class CarImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ['id', 'image_url', 'is_primary', 'sort_order']


class CarListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    partner_name  = serializers.CharField(source='partner.business_name', read_only=True)

    class Meta:
        model = Car
        fields = [
            'id', 'name', 'brand', 'model', 'year', 'transmission',
            'fuel_type', 'seats', 'price_per_day', 'location',
            'location_lat', 'location_lng',
            'is_available', 'primary_image', 'partner_name'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return img.image_url if img else None


class CarDetailSerializer(serializers.ModelSerializer):
    images          = CarImageSerializer(many=True, read_only=True)
    partner_name    = serializers.CharField(source='partner.business_name', read_only=True)
    partner_phone   = serializers.CharField(source='partner.contact_phone', read_only=True)
    partner_id      = serializers.UUIDField(source='partner.id', read_only=True)
    # The USER uuid of the partner — needed for /messages/inquiry/ receiver lookup
    partner_user_id = serializers.UUIDField(source='partner.user.id', read_only=True)
    primary_image   = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = '__all__'

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return img.image_url if img else None


class CarWriteSerializer(serializers.ModelSerializer):
    image_urls = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = Car
        exclude = ['partner', 'created_at', 'updated_at']

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        partner = self.context['request'].user.partner
        car = Car.objects.create(partner=partner, **validated_data)
        for i, url in enumerate(image_urls):
            CarImage.objects.create(car=car, image_url=url, is_primary=(i == 0), sort_order=i)
        return car

    def update(self, instance, validated_data):
        image_urls = validated_data.pop('image_urls', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if image_urls is not None:
            instance.images.all().delete()
            for i, url in enumerate(image_urls):
                CarImage.objects.create(car=instance, image_url=url, is_primary=(i == 0), sort_order=i)
        return instance


class PartnerSerializer(serializers.ModelSerializer):
    user      = UserSerializer(read_only=True)
    car_count = serializers.SerializerMethodField()

    class Meta:
        model = Partner
        fields = '__all__'
        read_only_fields = ['id', 'status', 'approved_at', 'approved_by', 'created_at']

    def get_car_count(self, obj):
        return obj.cars.filter(status='active').count()


class ApprovedPartnerSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public partner filter on Browse Cars."""
    car_count       = serializers.SerializerMethodField()
    user_full_name  = serializers.CharField(source='user.full_name', read_only=True)
    logo_url        = serializers.CharField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Partner
        fields = ['id', 'business_name', 'partner_type', 'car_count', 'user_full_name', 'contact_person', 'logo_url']

    def get_car_count(self, obj):
        return obj.cars.filter(status='active', is_available=True).count()


class PartnerApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = [
            'business_name', 'partner_type', 'business_address',
            'business_lat', 'business_lng',
            'business_permit_url', 'government_id_url',
            'contact_person', 'contact_phone'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        return Partner.objects.create(user=user, **validated_data)





class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'car', 'start_date', 'end_date',
            'pickup_location', 'return_location',
            'payment_method', 'gcash_reference', 'special_requests',
            'fulfillment_type', 'delivery_address', 'delivery_lat', 'delivery_lng',
        ]

    def validate(self, data):
        start = data['start_date']
        end = data['end_date']
        if end <= start:
            raise serializers.ValidationError("End date must be after start date.")

        car = data['car']
        overlapping = Booking.objects.filter(
            car=car,
            booking_status__in=['approved', 'active'],
            start_date__lt=end,
            end_date__gt=start
        ).exists()
        if overlapping:
            raise serializers.ValidationError("Car is not available for the selected dates.")
        return data

    def create(self, validated_data):
        import uuid
        from datetime import date

        customer = self.context['request'].user
        car = validated_data['car']
        start = validated_data['start_date']
        end = validated_data['end_date']
        total_days = (end - start).days
        subtotal = car.price_per_day * total_days
        commission = subtotal * (car.partner.commission_rate / 100)
        booking_fee = PlatformSetting.get('booking_fee', default=100)

        booking_code = f"SKY-{date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

        return Booking.objects.create(
            booking_code=booking_code,
            customer=customer,
            partner=car.partner,
            total_days=total_days,
            price_per_day=car.price_per_day,
            subtotal=subtotal,
            commission_amount=commission,
            total_amount=subtotal + booking_fee,
            booking_fee=booking_fee,
            **validated_data
        )


class BookingSerializer(serializers.ModelSerializer):
    car_name         = serializers.CharField(source='car.name', read_only=True)
    car_id           = serializers.UUIDField(source='car.id', read_only=True)
    car_image        = serializers.SerializerMethodField()
    car_location     = serializers.CharField(source='car.location', read_only=True)
    customer_name    = serializers.CharField(source='customer.full_name', read_only=True)
    customer_email   = serializers.CharField(source='customer.email', read_only=True)
    customer_phone   = serializers.CharField(source='customer.phone', read_only=True)
    customer_profile = serializers.SerializerMethodField()
    partner_name     = serializers.CharField(source='partner.business_name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'

    def get_car_image(self, obj):
        img = obj.car.images.filter(is_primary=True).first()
        return img.image_url if img else None

    def get_customer_profile(self, obj):
        try:
            return CustomerProfileSerializer(obj.customer.profile).data
        except CustomerProfile.DoesNotExist:
            return None


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'booking', 'sender', 'receiver', 'sender_name', 'content', 'image_url', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # booking is optional — null means it's a support message
        self.fields['booking'].required = False
        self.fields['booking'].allow_null = True
        # content is optional when an image_url is provided
        self.fields['content'].required = False
        self.fields['content'].allow_blank = True


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ['key', 'value', 'text_value', 'label']


class PartnerSettlementSerializer(serializers.ModelSerializer):
    partner_name         = serializers.CharField(source='partner.business_name', read_only=True)
    partner_id           = serializers.UUIDField(source='partner.id', read_only=True)
    booking_count        = serializers.SerializerMethodField()

    class Meta:
        model = PartnerSettlement
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_booking_count(self, obj):
        return Booking.objects.filter(
            partner=obj.partner,
            booking_status='completed',
            start_date__gte=obj.period_start,
            end_date__lte=obj.period_end,
        ).count()


class PartnerBoostRequestSerializer(serializers.ModelSerializer):
    partner_name         = serializers.CharField(source='partner.business_name', read_only=True)
    partner_id           = serializers.UUIDField(source='partner.id', read_only=True)
    partner_type         = serializers.CharField(source='partner.partner_type', read_only=True)
    partner_user_id      = serializers.UUIDField(source='partner.user.id', read_only=True)
    boost_type_display   = serializers.CharField(source='get_boost_type_display', read_only=True)
    status_display       = serializers.CharField(source='get_status_display', read_only=True)
    duration_display     = serializers.CharField(source='get_duration_months_display', read_only=True)

    class Meta:
        model = PartnerBoostRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']