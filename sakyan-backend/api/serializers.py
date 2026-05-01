from rest_framework import serializers
from .models import User, Partner, Car, CarImage, CustomerProfile, Booking, Message, Notification


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        exclude = ['user']


class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(source='profile', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'avatar_url', 'created_at', 'customer_profile']
        read_only_fields = ['id', 'role', 'created_at']


class RegisterSerializer(serializers.Serializer):
    user_id   = serializers.UUIDField()
    full_name = serializers.CharField(max_length=255)
    email     = serializers.EmailField()
    phone     = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def create(self, validated_data):
        user, _ = User.objects.get_or_create(
            id=validated_data['user_id'],
            defaults={
                'full_name': validated_data['full_name'],
                'email':     validated_data['email'],
                'phone':     validated_data.get('phone', ''),
                'role':      'customer',
            }
        )
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
            'is_available', 'primary_image', 'partner_name'
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return img.image_url if img else None


class CarDetailSerializer(serializers.ModelSerializer):
    images        = CarImageSerializer(many=True, read_only=True)
    partner_name  = serializers.CharField(source='partner.business_name', read_only=True)
    partner_phone = serializers.CharField(source='partner.contact_phone', read_only=True)
    partner_id    = serializers.UUIDField(source='partner.id', read_only=True)

    class Meta:
        model = Car
        fields = '__all__'


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
    user = UserSerializer(read_only=True)

    class Meta:
        model = Partner
        fields = '__all__'
        read_only_fields = ['id', 'status', 'approved_at', 'approved_by', 'created_at']


class PartnerApplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = [
            'business_name', 'partner_type', 'business_address',
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
            'payment_method', 'gcash_reference', 'special_requests'
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

        booking_code = f"SKY-{date.today().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

        return Booking.objects.create(
            booking_code=booking_code,
            customer=customer,
            partner=car.partner,
            total_days=total_days,
            price_per_day=car.price_per_day,
            subtotal=subtotal,
            commission_amount=commission,
            total_amount=subtotal,
            **validated_data
        )


class BookingSerializer(serializers.ModelSerializer):
    car_name         = serializers.CharField(source='car.name', read_only=True)
    car_image        = serializers.SerializerMethodField()
    car_location     = serializers.CharField(source='car.location', read_only=True)  # add this
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
        fields = ['id', 'booking', 'sender', 'receiver', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']