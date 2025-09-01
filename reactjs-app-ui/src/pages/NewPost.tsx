import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Post } from '../types/api';
import { 
  Container,
  Box,
  Card,
  Flex,
  Text,
  TextField,
  TextArea,
  Button,
  Checkbox
} from '@radix-ui/themes';

const NewPost: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPost: Partial<Post> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        status: formData.published ? 'published' : 'draft',
        published: formData.published
      };

      const response = await apiService.createPost(newPost);
      
      if (response.success && response.data) {
        navigate('/dashboard');
      } else {
        setError(response.error || 'Failed to create post');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create post');
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="2">
      <Box py="6">
        <Card>
          <Flex direction="column" gap="4" p="6">
            <Box>
              <Text size="6" weight="bold" mb="2">Create New Post</Text>
              <Text color="gray">Write and publish your next article</Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                {/* Title */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Title *
                  </Text>
                  <TextField.Root
                    size="3"
                    placeholder="Enter post title..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </Box>

                {/* Content */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2">
                    Content *
                  </Text>
                  <TextArea
                    size="3"
                    placeholder="Write your post content here..."
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    style={{ minHeight: '300px' }}
                    required
                  />
                </Box>

                {/* Published checkbox */}
                <Flex align="center" gap="2">
                  <Checkbox
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => 
                      handleInputChange('published', checked === true)
                    }
                  />
                  <Text as="label" htmlFor="published" size="2">
                    Publish immediately
                  </Text>
                </Flex>

                {/* Error message */}
                {error && (
                  <Box style={{ 
                    backgroundColor: 'var(--red-1)', 
                    border: '1px solid var(--red-6)',
                    borderRadius: 'var(--radius-2)',
                    padding: 'var(--space-3)'
                  }}>
                    <Text color="red" size="2">{error}</Text>
                  </Box>
                )}

                {/* Action buttons */}
                <Flex gap="3" justify="end">
                  <Button 
                    type="button" 
                    variant="soft" 
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading}
                  >
                    {formData.published ? 'Publish Post' : 'Save Draft'}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Flex>
        </Card>
      </Box>
    </Container>
  );
};

export default NewPost;
