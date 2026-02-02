# Community Feed - Technical Implementation

## The Tree: Nested Comments Modeling and Serialization
I modeled nested comments using MPTT (Modified Preorder Tree Traversal) with TreeForeignKey parent relationships for efficient tree operations, and serialized them by bulk fetching all comments with select_related('author'), prefetching like counts in a single query using values('object_id').annotate(count=Count('id')), then building the threaded tree structure in memory from the flat serialized data, reducing N+1 queries to constant 2 queries regardless of comment count.

## The Math: Last 24h Leaderboard.
post_karma = Like.objects.filter(created_at__gte=twenty_four_hours_ago, content_type=post_content_type).values('object_id').annotate(post_karma=Count('id') * 5)
comment_karma = Like.objects.filter(created_at__gte=twenty_four_hours_ago, content_type=comment_content_type).values('object_id').annotate(comment_karma=Count('id'))
 Filters likes from last 24 hours by content type, aggregates post likes as 5 karma each and comment likes as 1 karma each, then maps to users and sorts descending for top 5 leaderboard.

 ## The AI Audit:
The AI had generated a CommentModal component that caused a runtime error because it accessed post.id before the post object was available, leading to a “Cannot read properties of null” error. I fixed this by adding proper null checks, by the useApi hook call so it only runs when post exists, adding early returns in event handlers, and using optional chaining (post?.content) in the JSX. While testing, I also found an inefficiency in the Feed component where the comment click handler only logged to the console instead of triggering the modal. So i corrected this by properly passing and calling the onCommentClick prop. After these fixes, the frontend compiled successfullyit worked without errors.
