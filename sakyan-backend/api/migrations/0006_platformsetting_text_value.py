from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_booking_fulfillment_and_fee'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformsetting',
            name='text_value',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AlterField(
            model_name='platformsetting',
            name='value',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
