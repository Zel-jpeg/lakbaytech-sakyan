from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_kyc_fields'),
    ]

    operations = [
        # Pickup vs Delivery choice
        migrations.AddField(
            model_name='booking',
            name='fulfillment_type',
            field=models.CharField(
                max_length=20,
                choices=[('pickup', 'Self-Pickup'), ('delivery', 'Delivery')],
                default='pickup',
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='delivery_address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='delivery_lat',
            field=models.FloatField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='delivery_lng',
            field=models.FloatField(null=True, blank=True),
        ),

        # Booking fee paid to platform
        migrations.AddField(
            model_name='booking',
            name='booking_fee_reference',
            field=models.CharField(max_length=100, blank=True,
                                   help_text='GCash ref # for the ₱100 platform booking fee'),
        ),
        migrations.AddField(
            model_name='booking',
            name='booking_fee_verified',
            field=models.BooleanField(default=False,
                                      help_text='Admin confirmed the booking fee reference number'),
        ),

        # Refund tracking
        migrations.AddField(
            model_name='booking',
            name='booking_fee_refund_status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('not_applicable', 'Not Applicable'),
                    ('pending',        'Refund Pending'),
                    ('processing',     'Processing'),
                    ('refunded',       'Refunded'),
                ],
                default='not_applicable',
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='booking_fee_refunded_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
    ]
