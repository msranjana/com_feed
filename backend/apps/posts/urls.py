from django.urls import path
from . import views
from . import like_views

app_name = 'posts'

urlpatterns = [
    # Post endpoints
    path('', views.PostListCreateView.as_view(), name='post-list-create'),
    path('<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    
    # Comment endpoints
    path('<int:post_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
    path('<int:post_id>/comments/threaded/', views.post_comments, name='post-comments-threaded'),
    path('comments/<int:pk>/', views.CommentDetailView.as_view(), name='comment-detail'),
    
    # Like endpoints
    path('like/<str:content_type>/<int:object_id>/', views.toggle_like, name='toggle-like'),
    path('like-status/', like_views.posts_like_status, name='posts-like-status'),
]
