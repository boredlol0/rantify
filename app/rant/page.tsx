'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Globe, Eye, ChevronDown, ChevronUp, Home, Users, Heart, Send, Reply } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Rant {
  id: string;
  title: string;
  transcript: string;
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
  audio_url: string | null;
  views: number;
  owner_id: string;
  owner_username: string | null;
}

interface Comment {
  id: string;
  rant_id: string;
  user_id: string;
  username: string;
  parent_comment_id: string | null;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  likes: number;
  liked_by_user: boolean;
  replies?: Comment[];
}

export default function RantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rantId = searchParams.get('id');
  const [rant, setRant] = useState<Rant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsername(user.user_metadata.username);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchRant = async () => {
      if (!rantId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: rantData, error: rantError } = await supabase
          .from('rants')
          .select('*')
          .eq('id', rantId)
          .single();

        if (rantError || !rantData) {
          setNotFound(true);
          return;
        }

        // const { data: userData, error: userError } = await supabase
        //   .from('users')
        //   .select('raw_user_meta_data')
        //   .eq('id', rantData.owner_id)
        //   .single();

        // const fullRant = {
        //   ...rantData,
        //   owner_username: userData?.raw_user_meta_data?.username || "Unkown"
        // };
        const fullRant = rantData;
        
        setRant(fullRant);

        if (!viewIncremented) {
          const { error: updateError } = await supabase
            .from('rants')
            .update({ views: (fullRant.views || 0) + 1 })
            .eq('id', rantId);

          if (!updateError) {
            setViewIncremented(true);
            setRant(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
          }
        }

        await fetchComments();
      } catch (error) {
        console.error('Error fetching rant:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRant();
  }, [rantId, viewIncremented]);

  const fetchComments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: commentsData, error } = await supabase
      .from('comments')
      .select(`
        *,
        comment_likes (
          user_id
        )
      `)
      .eq('rant_id', rantId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    const processedComments = commentsData.map(comment => ({
      ...comment,
      liked_by_user: comment.comment_likes?.some(like => like.user_id === user?.id) || false,
      replies: []
    }));

    const threadedComments = processedComments.reduce((acc: Comment[], comment) => {
      if (!comment.parent_comment_id) {
        acc.push(comment);
      } else {
        const parentComment = processedComments.find(c => c.id === comment.parent_comment_id);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(comment);
        }
      }
      return acc;
    }, []);

    setComments(threadedComments);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    if (!username) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to comment"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          rant_id: rantId,
          user_id: user?.id,
          username,
          text: newComment,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) throw error;

      setNewComment('');
      setIsAnonymous(false);
      await fetchComments();

      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handlePostReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    if (!username) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to reply"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: reply, error } = await supabase
        .from('comments')
        .insert({
          rant_id: rantId,
          user_id: user?.id,
          username,
          parent_comment_id: parentCommentId,
          text: replyText,
          is_anonymous: isAnonymous
        })
        .select()
        .single();

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      setIsAnonymous(false);
      await fetchComments();

      toast({
        title: "Success",
        description: "Reply posted successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleToggleLike = async (commentId: string, currentLikes: number, isLiked: boolean) => {
    if (!username) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to like comments"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user?.id);

        await supabase
          .from('comments')
          .update({ likes: currentLikes - 1 })
          .eq('id', commentId);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user?.id
          });

        await supabase
          .from('comments')
          .update({ likes: currentLikes + 1 })
          .eq('id', commentId);
      }

      await fetchComments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const CommentComponent = ({ comment, level = 0 }: { comment: Comment; level?: number }) => (
    <div className={`pl-${level * 4} mt-4`}>
      <div className="bg-card/30 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-medium">
              {comment.is_anonymous ? 'Anonymous' : comment.username}
            </span>
            <span className="text-muted-foreground text-sm ml-2">
              {format(new Date(comment.created_at), 'PPp')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleLike(comment.id, comment.likes, comment.liked_by_user)}
            className={comment.liked_by_user ? 'text-red-500' : ''}
          >
            <Heart className={`h-4 w-4 mr-1 ${comment.liked_by_user ? 'fill-current' : ''}`} />
            {comment.likes}
          </Button>
        </div>
        <p className="text-foreground/90 mb-2">{comment.text}</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>
        
        {replyingTo === comment.id && (
          <div className="mt-4 space-y-4">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="min-h-[100px]"
              name="Reply"
              autofocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
                <span className="text-sm">Post anonymously</span>
              </div>
              <Button onClick={() => handlePostReply(comment.id)}>
                <Send className="h-4 w-4 mr-2" />
                Post Reply
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.map(reply => (
          <CommentComponent key={reply.id} comment={reply} level={level + 1} />
        ))}
      </div>
    </div>
  );

  const NavButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-6 py-2 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </motion.button>
  );

  const navbar = (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-md bg-background/50 border-b border-border/50"
    >
      <div className="container mx-auto flex justify-center gap-4">
        <NavButton icon={Home} label="Home" onClick={() => router.push('/home')} />
        <NavButton icon={Users} label="Rants" onClick={() => router.push('/rants')} />
      </div>
    </motion.nav>
  );

  if (loading) {
    return (
      <>
        {navbar}
        <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4 pt-24">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-none bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="animate-pulse">Loading...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (notFound || !rant) {
    return (
      <>
        {navbar}
        <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4 pt-24">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-none bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">Rant not found</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {navbar}
      <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4 pt-24">
        <div className="container mx-auto max-w-4xl space-y-8">
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-3xl font-bold">{rant.title}</CardTitle>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-5 w-5" />
                    <span>{rant.views || 0}</span>
                  </div>
                  {rant.is_private ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Globe className="h-5 w-5" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Posted by</span>
                  <span className="font-medium">
                    {rant.anonymous ? 'Anonymous' : (rant.owner_username || 'Unknown User')}
                  </span>
                </div>
                <span>{format(new Date(rant.created_at), 'PPP')}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {rant.audio_url && (
                <AudioPlayer src={rant.audio_url} className="w-full" />
              )}
              
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isTranscriptExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide Transcript
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show Transcript
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {isTranscriptExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/20 rounded-lg p-6">
                        <p className="text-lg leading-relaxed">{rant.transcript}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <span className="text-sm">Post anonymously</span>
                  </div>
                  <Button onClick={handlePostComment}>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map(comment => (
                    <CommentComponent key={comment.id} comment={comment} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}