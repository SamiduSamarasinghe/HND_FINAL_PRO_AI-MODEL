import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  Drawer,
  Card,
  CardContent
} from '@mui/material';
import { Send, FiberManualRecord, Menu, Book, History, Settings } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MainContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  backgroundColor: '#f0f2f5',
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  height: '100%',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #2c3e50 0%, #3498db 100%)',
  color: 'white',
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 0,
  margin: '0 auto',
  backgroundColor: '#fafafa',
  boxShadow: '0 0 20px rgba(0,0,0,0.1)',
}));

const Header = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const MessagesContainer = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: '20px',
  marginBottom: theme.spacing(1.2),
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  background: isUser 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : '#ffffff',
  color: isUser ? '#ffffff' : '#000000',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  borderBottomRightRadius: isUser ? '4px' : '20px',
  borderBottomLeftRadius: isUser ? '20px' : '4px',
  wordBreak: 'break-word',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  },
}));

const QuickActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  justifyContent: 'center',
}));

const QuickActionChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const aiChatHandler = async (userMessage) => {
  try {
    const response = await fetch('http://127.0.0.1:8088/api/v1/gemini/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: userMessage
      })
    });
    
    if (!response.ok) {
      console.log(response);
      throw new Error("Network response was not ok");
    }
    
    const textResponse = await response.text();
    return textResponse;
    
  } catch (err) {
    console.log(err);
    // Return a string instead of an object
    return "Sorry, something went wrong! Please try again.";
  }
}

const AITutor = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI tutor. I can help you with various subjects, explain concepts, and guide you through learning materials. What would you like to learn today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickQuestions = [
    "Explain calculus basics",
    "Help with programming",
    "Science concepts",
    "History facts",
    "Language learning"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    
    if (trimmedInput === '' || loading) return;

    // Limit message length
    if (trimmedInput.length > 1000) {
      alert('Message is too long. Please keep it under 1000 characters.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: trimmedInput,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const aiResponse = await aiChatHandler(trimmedInput);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse || "I'm not sure how to respond to that.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
    // Auto-focus input after setting question
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

    const formatMessageText = (text) => {
    if (!text) return null;

    // Replace literal "\n" with actual line breaks
    const processedText = text.replace(/\\n/g, '\n');

    // Split by real line breaks
    const lines = processedText.split('\n');

    return lines.map((line, index) => {
        // Convert *bold* to <strong>
        const parts = line.split(/(\*[^*]+\*)/g).map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        return part;
        });

        return (
        <React.Fragment key={index}>
            {parts}
            {index < lines.length - 1 && <br />}
        </React.Fragment>
        );
    });
    };


  return (
    <MainContainer>
      {/* Left Sidebar */}
      <Sidebar elevation={3}>
        <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              mb: 2
            }}
          >
            AI
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Edugen AI
          </Typography>
          <Chip
            icon={<FiberManualRecord />}
            label="Online & Ready"
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '& .MuiChip-icon': { color: '#4CAF50' }
            }}
          />
        </Box>

        <Card sx={{ m: 2, background: 'rgba(255,255,255,0.1)', color: 'white' }}>
          <CardContent>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Need help with a specific topic? Try asking about mathematics, science, programming, or history!
            </Typography>
          </CardContent>
        </Card>
      </Sidebar>

      {/* Main Chat Area */}
      <ChatContainer elevation={0}>
        <Header position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
              AI Learning Assistant
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Ready to help you learn!
            </Typography>
          </Toolbar>
        </Header>

        <MessagesContainer>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                padding: 0,
              }}
            >
              <MessageBubble isUser={message.isUser}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap' // Preserves line breaks
                  }}
                >
                  {formatMessageText(message.text)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'right',
                    opacity: 0.6,
                    mt: 0.5,
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </MessageBubble>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', padding: 0 }}>
              <MessageBubble isUser={false}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Generating response...</Typography>
                </Box>
              </MessageBubble>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Quick Questions */}
        <QuickActions>
          {quickQuestions.map((question, index) => (
            <QuickActionChip
              key={index}
              label={question}
              onClick={() => handleQuickQuestion(question)}
              size="small"
            />
          ))}
        </QuickActions>

        <Divider />

        <Box sx={{ p: 2, backgroundColor: 'white' }}>
          <form onSubmit={handleSendMessage}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                variant="outlined"
                placeholder="Ask about any subject, concept, or learning topic..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    backgroundColor: '#f8f9fa',
                  }
                }}
              />
              <IconButton
                type="submit"
                disabled={!inputText.trim() || loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                  '&:disabled': {
                    background: '#ccc',
                  }
                }}
              >
                <Send />
              </IconButton>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.secondary' }}>
              Press Enter to send • Shift+Enter for new line
            </Typography>
          </form>
        </Box>
      </ChatContainer>
    </MainContainer>
  );
};

export default AITutor;