from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0006_calendarevent_permissions_reminders'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('followup', 'Follow-up'),
                    ('payment', 'Payment'),
                    ('assignment', 'Assignment'),
                    ('discount', 'Discount'),
                    ('meeting', 'Meeting'),
                ],
            ),
        ),
    ]
