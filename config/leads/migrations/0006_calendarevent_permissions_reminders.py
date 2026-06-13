from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0005_deal_lead_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='calendarevent',
            name='permissions',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='calendarevent',
            name='reminders',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
