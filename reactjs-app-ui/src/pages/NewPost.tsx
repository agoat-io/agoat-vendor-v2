import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Button, Box } from '@radix-ui/themes';

const NewPost: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container size="2">
      <Box py="6">
        <Heading size="6" mb="4">Create New Post</Heading>
        <Text color="gray" mb="6">Post creation functionality coming soon...</Text>
        <Button onClick={() => navigate('/dashboard')} variant="soft">
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NewPost;
