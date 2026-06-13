from django.db import models
from django.conf import settings


class Target(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='targets'
    )
    month = models.DateField()
    target_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)

    class Meta:
        unique_together = ('user', 'month')
        ordering = ['-month']

    def __str__(self):
        return f"{self.user} - {self.month.strftime('%Y-%m')} - {self.target_amount}"
