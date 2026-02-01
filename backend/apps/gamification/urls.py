from django.urls import path
from . import views

app_name = 'gamification'

urlpatterns = [
    # Leaderboard endpoints
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('users/<int:user_id>/karma/', views.user_karma_history, name='user-karma-history'),
]
