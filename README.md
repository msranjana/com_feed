# Community Feed Prototype

A high-performance community feed with threaded discussions and dynamic karma-based leaderboard.

## 🏗️ Architecture

**Backend**: Django + Django REST Framework + SQLite  
**Frontend**: React + Tailwind CSS  
**Database**: SQLite (easily switchable to PostgreSQL)

## ✨ Features

### Core Features
- **Feed**: Display text posts with author and like counts
- **Threaded Comments**: Reddit-style nested comment threads
- **Gamification**: Karma system (Post likes = 5 karma, Comment likes = 1 karma)
- **Dynamic Leaderboard**: Top 5 users based on karma earned in last 24 hours

### Technical Features
- **N+1 Query Prevention**: Efficient comment tree fetching using MPTT
- **Concurrency Safety**: Race condition protection for like operations
- **Dynamic Aggregation**: Real-time karma calculation from activity history
- **Modern UI**: Responsive design with Tailwind CSS

## 🚀 Quick Start

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\Activate  # On Windows
source venv/bin/activate  # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Posts
- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create new post
- `GET /api/posts/{id}/` - Get post details
- `PUT /api/posts/{id}/` - Update post
- `DELETE /api/posts/{id}/` - Delete post

### Comments
- `GET /api/posts/{post_id}/comments/threaded/` - Get threaded comments
- `POST /api/posts/{post_id}/comments/` - Create comment
- `PUT /api/comments/{id}/` - Update comment
- `DELETE /api/comments/{id}/` - Delete comment

### Likes
- `POST /api/like/{content_type}/{object_id}/` - Toggle like/unlike

### Gamification
- `GET /api/gamification/leaderboard/` - Get 24-hour leaderboard
- `GET /api/gamification/users/{user_id}/karma/` - User karma history

## 🔧 Technical Implementation

### N+1 Query Prevention
- **MPTT (Modified Preorder Tree Traversal)** for efficient comment trees
- `select_related` and `prefetch_related` for optimized queries
- Single query to fetch entire comment tree structure

### Concurrency Safety
- **Database-level unique constraints** prevent duplicate likes
- **Atomic transactions** ensure karma updates are consistent
- `select_for_update()` for race condition protection

### Dynamic Karma Aggregation
- **No stored daily karma field** - calculated dynamically
- SQL window functions for efficient aggregation
- Date filtering for 24-hour time windows

### Database Schema
```sql
users (extended Django User)
├── id, username, email, total_karma, ...

posts
├── id, author_id, content, created_at, ...

comments (MPTT)
├── id, author_id, post_id, content, parent_id, tree_id, lft, rght, level, ...

likes (Generic Foreign Key)
├── id, user_id, content_type_id, object_id, created_at, ...

karma_transactions (audit)
├── id, user_id, karma_change, reason, created_at, ...
```

## 🎯 Performance Optimizations

1. **Comment Loading**: MPTT tree structure prevents N+1 queries
2. **Like Counts**: Efficient aggregation with database indexes
3. **Leaderboard**: Optimized SQL with date filtering
4. **Frontend**: React hooks for efficient state management
5. **API**: Pagination and selective field loading

## 🧪 Testing the Technical Constraints

### 1. N+1 Query Testing
```python
# This should trigger only 2-3 queries, not 50+
post = Post.objects.select_related('author').prefetch_related('comments__author').get(id=1)
comments = post.get_comment_tree()
```

### 2. Concurrency Testing
```bash
# Simulate concurrent likes
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/like/post/1/ &
done
wait
# Should result in exactly 10 likes, no duplicates
```

### 3. Leaderboard Performance
```python
# Test with 100k+ likes
# Query should complete in <100ms
gamificationAPI.get_leaderboard()
```

## 🛠️ Development

### Adding New Features
1. **Models**: Add to appropriate app (users, posts, gamification)
2. **Serializers**: Create DRF serializers with proper field selection
3. **Views**: Use class-based views or function views with proper permissions
4. **Frontend**: Create components with API integration hooks

### Database Changes
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Switching to PostgreSQL
1. Install `psycopg2-binary`
2. Update `DATABASES` in `settings.py`
3. Run migrations

## 📊 Monitoring & Debugging

### Performance Monitoring
- Django Debug Toolbar for query analysis
- Browser DevTools for frontend performance
- Database query logging

### Common Issues
- **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in settings
- **MPTT rebuild**: `python manage.py rebuild_mptt posts.Comment`
- **Karma inconsistencies**: Check `KarmaTransaction` audit table

## 🎨 UI Components

### Core Components
- `Feed.jsx` - Main feed with posts and create form
- `Post.jsx` - Individual post with like/comment actions
- `Comment.jsx` - Nested comment with reply functionality
- `CommentModal.jsx` - Modal for viewing/adding comments
- `Leaderboard.jsx` - Dynamic karma leaderboard

### Styling
- Tailwind CSS for responsive design
- Custom animations and transitions
- Mobile-first responsive layout

## 🔐 Security Considerations

- CSRF protection enabled
- Permission-based API access
- Input validation and sanitization
- SQL injection prevention through ORM
- Rate limiting considerations for production

## 📈 Scalability

### Database Optimization
- Proper indexing on foreign keys and frequently queried fields
- Consider read replicas for high-traffic scenarios
- Connection pooling for database connections

### Caching Strategy
- Redis for leaderboard caching (implementation ready)
- Browser caching for static assets
- API response caching where appropriate

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all technical constraints are met


---

**Note**: This prototype demonstrates advanced Django/React capabilities with focus on performance, concurrency, and data integrity - exactly what modern web applications demand.
