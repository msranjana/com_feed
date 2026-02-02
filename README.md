# Community Feed Prototype

A feed with threaded discussions and dynamic karma-based leaderboard.

##  Architecture

**Backend**: Django + Django REST Framework + SQLite  
**Frontend**: React + Tailwind CSS  
**Database**: SQLite (easily switchable to PostgreSQL)

##  Features

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

##  Quick Start

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

##  API Endpoints

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

##  Technical Implementation

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

