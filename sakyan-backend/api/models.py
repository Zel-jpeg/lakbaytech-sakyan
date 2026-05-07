import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class User(models.Model):
    ROLE_CHOICES = [('customer', 'Customer'), ('partner', 'Partner'), ('admin', 'Admin')]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    full_name   = models.CharField(max_length=255)
    email       = models.EmailField(unique=True)
    phone       = models.CharField(max_length=20, blank=True)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    avatar_url  = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    @property
    def is_authenticated(self):
        return True

    class Meta:
        db_table = 'users'


class Partner(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('approved', 'Approved'),
        ('rejected', 'Rejected'), ('suspended', 'Suspended')
    ]
    TYPE_CHOICES = [('individual', 'Individual'), ('company', 'Company')]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user                = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner')
    business_name       = models.CharField(max_length=255)
    partner_type        = models.CharField(max_length=20, choices=TYPE_CHOICES)
    business_address    = models.TextField(blank=True)
    business_permit_url = models.TextField(blank=True)
    government_id_url   = models.TextField()
    contact_person      = models.CharField(max_length=255, blank=True)
    contact_phone       = models.CharField(max_length=20, blank=True)
    commission_rate     = models.DecimalField(max_digits=4, decimal_places=2, default=10.00)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason    = models.TextField(blank=True)
    approved_at         = models.DateTimeField(null=True, blank=True)
    approved_by         = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_partners',
        db_column='approved_by'
    )
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'partners'


class Car(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    TRANSMISSION_CHOICES = [('manual', 'Manual'), ('automatic', 'Automatic')]
    FUEL_CHOICES = [
        ('gasoline', 'Gasoline'), ('diesel', 'Diesel'),
        ('electric', 'Electric'), ('hybrid', 'Hybrid')
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4)
    partner       = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='cars')
    name          = models.CharField(max_length=255)
    brand         = models.CharField(max_length=100, blank=True)
    model         = models.CharField(max_length=100, blank=True)
    year          = models.IntegerField(null=True)
    plate_number  = models.CharField(max_length=20, unique=True)
    transmission  = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES, blank=True)
    fuel_type     = models.CharField(max_length=20, choices=FUEL_CHOICES, blank=True)
    seats         = models.IntegerField(default=5)
    color         = models.CharField(max_length=50, blank=True)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    location      = models.CharField(max_length=255)
    location_lat  = models.FloatField(null=True, blank=True)
    location_lng  = models.FloatField(null=True, blank=True)
    description   = models.TextField(blank=True)
    features      = ArrayField(models.TextField(), default=list, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_available  = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cars'


class CarImage(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4)
    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images')
    image_url  = models.TextField()
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'car_images'
        ordering = ['sort_order']


class CustomerProfile(models.Model):
    KYC_STATUS_CHOICES = [
        ('not_submitted', 'Not Submitted'),
        ('pending',       'Pending Review'),
        ('approved',      'Approved'),
        ('rejected',      'Rejected'),
    ]

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user                    = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    birthday                = models.DateField(null=True, blank=True)
    # KYC personal info
    contact_number          = models.CharField(max_length=20, blank=True)
    address                 = models.TextField(blank=True)
    address_lat             = models.FloatField(null=True, blank=True)
    address_lng             = models.FloatField(null=True, blank=True)
    # KYC documents
    drivers_license_number  = models.CharField(max_length=50, blank=True)
    drivers_license_url     = models.TextField(blank=True)
    license_expiry          = models.DateField(null=True, blank=True)
    valid_id_type           = models.CharField(max_length=100, blank=True)
    valid_id_url            = models.TextField(blank=True)
    selfie_url              = models.TextField(blank=True)
    # KYC review pipeline
    kyc_status              = models.CharField(
        max_length=20, choices=KYC_STATUS_CHOICES, default='not_submitted'
    )
    kyc_rejection_reason    = models.TextField(blank=True)
    kyc_submitted_at        = models.DateTimeField(null=True, blank=True)
    kyc_reviewed_at         = models.DateTimeField(null=True, blank=True)
    kyc_reviewed_by         = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='kyc_reviews',
        db_column='kyc_reviewed_by'
    )
    is_verified             = models.BooleanField(default=False)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_profiles'


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_METHOD_CHOICES = [('gcash', 'GCash'), ('cash', 'Cash')]
    PAYMENT_STATUS_CHOICES = [
        ('pending',  'Not Yet Paid'),
        ('partial',  'Partially Paid'),
        ('paid',     'Paid'),
        ('refunded', 'Refunded'),
    ]
    FULFILLMENT_CHOICES = [
        ('pickup',   'Self-Pickup'),
        ('delivery', 'Delivery'),
    ]

    id                = models.UUIDField(primary_key=True, default=uuid.uuid4)
    booking_code      = models.CharField(max_length=20, unique=True)
    car               = models.ForeignKey(Car, on_delete=models.PROTECT, related_name='bookings')
    customer          = models.ForeignKey(User, on_delete=models.PROTECT, related_name='bookings')
    partner           = models.ForeignKey(Partner, on_delete=models.PROTECT, related_name='bookings')
    start_date        = models.DateField()
    end_date          = models.DateField()
    pickup_location   = models.TextField(blank=True)
    return_location   = models.TextField(blank=True)
    total_days        = models.IntegerField()
    price_per_day     = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal          = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method    = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status    = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    gcash_reference   = models.CharField(max_length=100, blank=True)
    booking_status    = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_review')
    special_requests  = models.TextField(blank=True)
    admin_notes       = models.TextField(blank=True)
    booking_fee       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Fulfillment
    fulfillment_type  = models.CharField(max_length=20, choices=FULFILLMENT_CHOICES, default='pickup')
    delivery_address  = models.TextField(blank=True)
    delivery_lat      = models.FloatField(null=True, blank=True)
    delivery_lng      = models.FloatField(null=True, blank=True)
    # Partner-side payment recording (partner collects from customer)
    partner_gcash_reference = models.CharField(max_length=100, blank=True)
    payment_notes           = models.TextField(blank=True)
    # Rental time tracking — logged by partner
    actual_start_time  = models.DateTimeField(null=True, blank=True)   # when car was handed over
    actual_return_time = models.DateTimeField(null=True, blank=True)   # when car was returned
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'


class Message(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    booking     = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='messages',
                                    null=True, blank=True)   # null = support message
    sender      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content     = models.TextField()
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']


class Notification(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title        = models.CharField(max_length=255)
    message      = models.TextField()
    type         = models.CharField(max_length=50, blank=True)
    is_read      = models.BooleanField(default=False)
    reference_id = models.UUIDField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class PlatformSetting(models.Model):
    key        = models.CharField(max_length=100, unique=True)
    value      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    text_value = models.CharField(max_length=500, blank=True, default='')  # for non-numeric settings
    label      = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'platform_settings'

    @classmethod
    def get(cls, key, default=0):
        try:
            obj = cls.objects.get(key=key)
            # Prefer text_value for string-type settings
            if obj.text_value:
                return obj.text_value
            return obj.value
        except cls.DoesNotExist:
            return default


class PartnerSettlement(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('settled',  'Settled'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4)
    partner          = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='settlements')
    period_start     = models.DateField()
    period_end       = models.DateField()
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_fees       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_owed       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_received  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    settled_at       = models.DateTimeField(null=True, blank=True)
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'partner_settlements'
        ordering = ['-created_at']