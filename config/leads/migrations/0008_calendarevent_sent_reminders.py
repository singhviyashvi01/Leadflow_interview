from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0007_notification_meeting_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='calendarevent',
            name='sent_reminders',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
