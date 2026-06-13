# Migration to update target_amount: max_digits=20, default=0

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0003_alter_target_options_alter_target_user_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='target',
            name='target_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=20),
        ),
    ]
