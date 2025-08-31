import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostsList from '../../components/PostsList';
import { buildApiUrl, API_CONFIG } from '../config/api';
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

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.STATUS), {
          withCredentials: true
        });
        setIsAuthenticated(response.data.data?.authenticated || false);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {}, {
        withCredentials: true
      });
      setIsAuthenticated(false);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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

  if (!isAuthenticated) {
    return null; // Will redirect to login
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
              <Button onClick={handleLogout} variant="outline" size="3">
                <ExitIcon />
                Logout
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Main Content */}
        <Box>
          <Heading size="4" mb="2">Your Articles</Heading>
          <Text color="gray" mb="6">Click on any article to edit it</Text>

          <PostsList
            apiUrl={API_CONFIG.BASE_URL}
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
