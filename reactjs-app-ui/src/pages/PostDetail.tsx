import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading, Text, Button, Box } from '@radix-ui/themes';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Container size="2">
      <Box py="6">
        <Heading size="6" mb="4">Post Detail</Heading>
        <Text color="gray" mb="2">Post ID: {id}</Text>
        <Text color="gray" mb="6">Post detail functionality coming soon...</Text>
        <Button onClick={() => navigate('/')} variant="soft">
          Back to Blog
        </Button>
      </Box>
    </Container>
  );
};

export default PostDetail;
