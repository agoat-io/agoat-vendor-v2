declare module 'viewer/PostsList' {
  import React from 'react'
  
  interface Post {
    id: string
    title: string
    content: string
    slug: string
    published: boolean
    created_at: string
    updated_at: string
    user_id: string
    author?: string
  }

  interface PostsListProps {
    apiUrl?: string
    showPublishedOnly?: boolean
    page?: number
    limit?: number
    isAuthenticated?: boolean
    maxContentLength?: number
    onPostClicked?: (post: Post) => void
    onPostsLoaded?: (posts: Post[]) => void
    onError?: (error: string) => void
  }

  const PostsList: React.FC<PostsListProps>
  export default PostsList
}

declare module 'viewer/PostViewer' {
  import React from 'react'
  
  interface Post {
    id: string
    title: string
    content: string
    slug: string
    published: boolean
    created_at: string
    updated_at: string
    user_id: string
    author?: string
  }

  interface PostViewerProps {
    postId?: string
    postSlug?: string
    apiUrl?: string
    isAuthenticated?: boolean
    onPostLoaded?: (post: Post) => void
    onError?: (error: string) => void
  }

  const PostViewer: React.FC<PostViewerProps>
  export default PostViewer
}

declare module 'viewer/App' {
  import React from 'react'
  
  const App: React.FC
  export default App
}
