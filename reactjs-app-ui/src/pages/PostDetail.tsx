import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { apiService } from '../services/api';
import type { Post } from '../types/api';
import { 
  Container,
  Box,
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Spinner
} from '@radix-ui/themes';
import { ArrowLeftIcon, Pencil1Icon, PersonIcon } from '@radix-ui/react-icons';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getPost(id);
        
        if (response.success && response.data) {
          setPost(response.data);
          document.title = `${response.data.title} - AGoat Blog`;
        } else {
          setError(response.error || 'Post not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load post');
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRenderedContent = () => {
    if (!post) return '';
    return marked.parse(post.content) as string;
  };

  const handleEdit = () => {
    if (post) {
      navigate(`/post/${post.id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container size="3" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner size="3" />
          <Text ml="3">Loading post...</Text>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="3" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Card>
          <Box p="6">
            <Flex direction="column" align="center" gap="3">
              <Text size="5" weight="bold" color="red">Error</Text>
              <Text>{error}</Text>
              <Button onClick={handleBack}>
                <ArrowLeftIcon />
                Back to Posts
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container size="3" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <Card>
          <Box p="6">
            <Flex direction="column" align="center" gap="3">
              <Text size="5" weight="bold">Post Not Found</Text>
              <Text>The requested post could not be found.</Text>
              <Button onClick={handleBack}>
                <ArrowLeftIcon />
                Back to Posts
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="3" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Flex direction="column" gap="4">
        {/* Back button */}
        <Button 
          variant="soft" 
          onClick={handleBack}
          style={{ alignSelf: 'flex-start' }}
        >
          <ArrowLeftIcon />
          Back to Posts
        </Button>

        {/* Post content */}
        <Card>
          <Box p="6">
            <Flex direction="column" gap="4">
              {/* Title */}
              <Text size="6" weight="bold" style={{ lineHeight: '1.3' }}>
                {post.title}
              </Text>

              {/* Meta information */}
              <Flex align="center" gap="3" wrap="wrap">
                <Flex align="center" gap="1">
                  <PersonIcon />
                  <Text size="2" color="gray">
                    {post.author || 'Admin'}
                  </Text>
                </Flex>
                
                <Text size="2" color="gray">•</Text>
                
                <Text size="2" color="gray">
                  {formatDate(post.created_at)}
                </Text>

                {post.updated_at && post.updated_at !== post.created_at && (
                  <>
                    <Text size="2" color="gray">•</Text>
                    <Text size="2" color="gray">
                      Updated {formatDate(post.updated_at)}
                    </Text>
                  </>
                )}

                <Text size="2" color="gray">•</Text>

                <Badge 
                  color={post.published ? 'green' : 'yellow'} 
                  variant="soft"
                  size="1"
                >
                  {post.published ? 'Published' : 'Draft'}
                </Badge>
              </Flex>

              {/* Post content */}
              <Box 
                style={{ 
                  lineHeight: '1.7',
                  fontSize: 'var(--font-size-3)'
                }}
                dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
              />

              {/* Footer */}
              <Flex justify="between" align="center" style={{ width: '100%' }}>
                <Text size="2" color="gray">
                  Post ID: {post.id}
                </Text>
                
                <Button variant="soft" onClick={handleEdit}>
                  <Pencil1Icon />
                  Edit Post
                </Button>
              </Flex>
            </Flex>
          </Box>
        </Card>
      </Flex>
    </Container>
  );
};

export default PostDetail;
