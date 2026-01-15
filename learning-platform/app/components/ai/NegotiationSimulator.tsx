'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  TextField,
  Stack,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Grid,
  IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import type { AiTaskDefinition } from '@/lib/ai/schema';
import type { NegotiationSession } from '@/lib/ai/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';

export type NegotiationSimulatorProps = {
  task: AiTaskDefinition;
};

export default function NegotiationSimulator({ task }: NegotiationSimulatorProps) {
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.history]);

  const startNegotiation = async (userRole: string) => {
    setInitializing(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (!authSession) {
        throw new Error('You must be signed in to start a negotiation.');
      }

      // 1. Create negotiation record in DB
      // We assume the task definition might specify roles, for now we hardcode or use simple logic
      const aiRole = userRole === 'NewCo' ? 'BigTech' : 'NewCo';
      
      const { data, error: insertError } = await supabase
        .from('negotiations')
        .insert({
          user_id: authSession.user.id,
          module_id: task.moduleId,
          task_id: task.id,
          user_role: userRole,
          ai_role: aiRole,
          status: 'active',
          current_state: task.ui.props?.initialState || {},
          history: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newSession = {
        ...data,
        currentState: data.current_state,
        userRole: data.user_role,
        aiRole: data.ai_role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as NegotiationSession;

      setSession(newSession);

      // 2. Trigger initial AI message if needed
      // We can just call the AI API with the negotiationId but no message
      await sendToAi(newSession.id, '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start negotiation');
    } finally {
      setInitializing(false);
    }
  };

  const sendToAi = async (negotiationId: string, userMessage: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Not authenticated');

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          moduleId: task.moduleId,
          taskId: task.id,
          payload: {
            negotiationId,
            message: userMessage,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Negotiation update failed');
      }

      const data = await res.json();
      if (data.negotiation) {
        setSession(data.negotiation);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to communicate with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !session) return;
    const msg = message;
    setMessage('');
    sendToAi(session.id, msg);
  };

  if (!session) {
    return (
      <Card variant="outlined" sx={{ my: 4, borderLeft: 6, borderLeftColor: 'secondary.main' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="secondary">
            {task.metadata.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {task.metadata.summary}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
            Choose your role to begin:
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button 
              variant="contained" 
              onClick={() => startNegotiation('NewCo')}
              disabled={initializing}
              startIcon={initializing ? <CircularProgress size={20} /> : null}
            >
              Represent NewCo
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => startNegotiation('BigTech')}
              disabled={initializing}
            >
              Represent BigTech
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      <Grid container spacing={3}>
        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} variant="outlined" sx={{ height: 600, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Negotiation with {session.aiRole}
              </Typography>
            </Box>

            <Box 
              ref={scrollRef}
              sx={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                p: 2, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                bgcolor: '#fafafa'
              }}
            >
              {session.history.map((msg, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    <Avatar sx={{ bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main', width: 32, height: 32 }}>
                      {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                    </Avatar>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                        color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        border: msg.role === 'user' ? 0 : 1,
                        borderColor: 'divider',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Box sx={{ 
                        '& p': { m: 0 },
                        '& ul, & ol': { pl: 2, m: 0 },
                        fontSize: '0.95rem',
                        lineHeight: 1.5
                      }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </Box>
                    </Paper>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 6 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white' }}>
                    <CircularProgress size={16} />
                  </Paper>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  placeholder="Type your proposal..."
                  variant="outlined"
                  size="small"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={loading}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={loading || !message.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* State Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', position: 'sticky', top: 100 }}>
            <Typography variant="h6" gutterBottom>
              Deal Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List disablePadding>
              {Object.entries(session.currentState).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No terms agreed upon yet.
                </Typography>
              ) : (
                Object.entries(session.currentState).map(([key, value]) => (
                  <ListItem key={key} sx={{ px: 0, py: 1 }}>
                    <ListItemText 
                      primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary', sx: { textTransform: 'uppercase', fontWeight: 600 } }}
                      secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', sx: { fontWeight: 500 } }}
                    />
                  </ListItem>
                ))
              )}
            </List>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
