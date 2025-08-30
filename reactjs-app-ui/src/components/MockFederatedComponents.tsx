import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Card, 
  CardContent, 
  CardHeader,
  Spinner,
  Badge
} from '@radix-ui/themes';
import { ArrowLeftIcon, PersonIcon } from '@radix-ui/react-icons';

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  author?: string;
}

interface PostsListProps {
  apiUrl?: string;
  showPublishedOnly?: boolean;
  page?: number;
  limit?: number;
  isAuthenticated?: boolean;
  maxContentLength?: number;
  onPostClicked?: (post: Post) => void;
  onPostsLoaded?: (posts: Post[]) => void;
  onError?: (error: string) => void;
}

interface PostViewerProps {
  post: Post;
  postId?: string;
  postSlug?: string;
  apiUrl?: string;
  showLoginPrompt?: boolean;
  maxContentLength?: number;
  isAuthenticated?: boolean;
  onLoginRequested?: () => void;
  onPostLoaded?: (post: Post) => void;
  onError?: (error: string) => void;
}

// Mock PostsList Component
export const MockPostsList: React.FC<PostsListProps> = ({
  onPostClicked,
  onError
}) => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Welcome to AGoat Blog',
          content: 'This is a sample blog post content. It demonstrates how the blog system works.',
          slug: 'welcome-to-agoat-blog',
          published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
          author: 'Admin'
        },
        {
          id: '2',
          title: 'Getting Started with Development',
          content: 'Learn how to set up your development environment and start building amazing applications.',
          slug: 'getting-started-with-development',
          published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
          author: 'Developer'
        }
      ];
      setPosts(mockPosts);
      setLoading(false);
      onPostsLoaded?.(mockPosts);
    }, 1000);
  }, [onPostsLoaded]);

  if (loading) {
    return (
      <Flex justify="center" align="center" py="9">
        <Spinner size="3" />
        <Text ml="3">Loading posts...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      {posts.map((post) => (
        <Card key={post.id} style={{ cursor: 'pointer' }} onClick={() => onPostClicked?.(post)}>
          <CardContent>
            <Flex direction="column" gap="2">
              <Text size="4" weight="bold">{post.title}</Text>
              <Flex gap="2" align="center">
                <PersonIcon />
                <Text size="2" color="gray">{post.author}</Text>
                <Text size="2" color="gray">•</Text>
                <Text size="2" color="gray">
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
                <Badge color={post.published ? 'green' : 'yellow'} variant="soft" size="1">
                  {post.published ? 'Published' : 'Draft'}
                </Badge>
              </Flex>
              <Text size="2" color="gray" style={{ lineHeight: '1.5' }}>
                {post.content.substring(0, 150)}...
              </Text>
            </Flex>
          </CardContent>
        </Card>
      ))}
    </Flex>
  );
};

// Mock PostViewer Component
export const MockPostViewer: React.FC<PostViewerProps> = ({ post }) => {
  return (
    <Card>
      <CardHeader>
        <Flex direction="column" gap="2">
          <Text size="6" weight="bold">{post.title}</Text>
          <Flex gap="2" align="center">
            <PersonIcon />
            <Text size="2" color="gray">{post.author || 'Unknown Author'}</Text>
            <Text size="2" color="gray">•</Text>
            <Text size="2" color="gray">
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
            <Badge color={post.published ? 'green' : 'yellow'} variant="soft" size="1">
              {post.published ? 'Published' : 'Draft'}
            </Badge>
          </Flex>
        </Flex>
      </CardHeader>
      <CardContent>
        <Box 
          style={{ 
            lineHeight: '1.7',
            fontSize: '16px'
          }}
          dangerouslySetInnerHTML={{ 
            __html: post.content.replace(/\n/g, '<br>') 
          }}
        />
      </CardContent>
    </Card>
  );
};

// Export as default for compatibility
export default {
  PostsList: MockPostsList,
  PostViewer: MockPostViewer
};
