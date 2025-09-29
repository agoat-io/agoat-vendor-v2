import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostsList from '../../components/PostsList';
import { apiService } from '../services/api';
import type { Post } from '../types/api';
import { 
  Container,
  Heading, 
  Text, 
  Button, 
  Flex, 
  Box,
  Card
} from '@radix-ui/themes';
import { 
  PlusIcon, 
  ExitIcon, 
  HomeIcon
} from '@radix-ui/react-icons';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  useEffect(() => {
    // Check API status
    const checkAPI = async () => {
      try {
        await apiService.checkStatus();
        setLoading(false);
      } catch (err) {
        console.error('API check failed:', err);
        setLoading(false);
      }
    };

    checkAPI();
  }, []);

  const handleCreatePost = () => {
    navigate('/new-post');
  };

  const handlePostClick = (post: Post) => {
    // Navigate to edit page
    navigate(`/post/${post.id}/edit`);
  };

  const handlePostsLoaded = (posts: Post[]) => {
    console.log('Posts loaded:', posts.length);
  };

  const handleViewerError = (error: string) => {
    console.error('Error:', error);
  };

  if (loading) {
    return (
      <Container size="2">
        <Box py="9">
          <Card>
            <Flex direction="column" align="center" gap="4" p="6">
              <Text>Loading dashboard...</Text>
            </Flex>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="4">
      <Box py="6">
        {/* Header */}
        <Card mb="6">
          <Flex justify="between" align="center" p="6">
            <Box>
              <Heading size="7" mb="1">Dashboard</Heading>
              <Text color="gray">Manage your blog posts</Text>
            </Box>
            <Flex gap="3">
              <Button onClick={handleCreatePost} size="3">
                <PlusIcon />
                New Post
              </Button>
              <Button onClick={() => navigate('/')} variant="soft" size="3">
                <HomeIcon />
                View Blog
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Main Content */}
        <Box>
          <Heading size="4" mb="2">Your Articles</Heading>
          <Text color="gray" mb="6">Click on any article to edit it</Text>

          <PostsList
            showPublishedOnly={false} // Show all posts (published and drafts)
            page={currentPage}
            limit={postsPerPage}
            maxContentLength={300}
            isAuthenticated={true}
            onPostClicked={handlePostClick}
            onPostsLoaded={handlePostsLoaded}
            onError={handleViewerError}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;
