from django.urls import path
from .views import (
    pipeline_view, 
    update_deal_stage, 
    close_deal,
    add_deal,
    update_deal,
    delete_deal,
    search_deals
)

urlpatterns=[
    path("pipeline/",pipeline_view),
    path("pipeline/add/", add_deal),
    path("pipeline/search/", search_deals),
    path("pipeline/update-stage/<int:deal_id>/",update_deal_stage),
    path("pipeline/update/<int:deal_id>/", update_deal),
    path("pipeline/delete/<int:deal_id>/", delete_deal),
    path("pipeline/close/<int:deal_id>/",close_deal),
]