from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_make_message_booking_nullable'),
    ]

    operations = [
        # Make content optional (blank=True) so image-only messages are valid
        migrations.AlterField(
            model_name='message',
            name='content',
            field=models.TextField(blank=True),
        ),
        # Add nullable image_url for GCash receipt / image attachments
        migrations.AddField(
            model_name='message',
            name='image_url',
            field=models.TextField(blank=True, null=True),
        ),
    ]
