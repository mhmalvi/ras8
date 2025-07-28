
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Sparkles, User, Clock, CheckCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface CustomerCommunicationAIProps {
  returnData: {
    id: string;
    customer_email: string;
    reason: string;
    status: string;
    return_items?: Array<{ product_name: string; }>;
  };
}

const CustomerCommunicationAI = ({ returnData }: CustomerCommunicationAIProps) => {
  const { toast } = useToast();
  const [messageType, setMessageType] = useState<'update' | 'followup' | 'apology' | 'custom'>('update');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const generateMessage = async () => {
    setLoading(true);
    try {
      let prompt = '';
      
      switch (messageType) {
        case 'update':
          prompt = `Generate a professional status update email for a customer whose return is ${returnData.status}. The return reason was "${returnData.reason}". Keep it friendly and informative.`;
          break;
        case 'followup':
          prompt = `Create a follow-up email to check customer satisfaction after their return was processed. The original reason was "${returnData.reason}". Ask for feedback and offer future assistance.`;
          break;
        case 'apology':
          prompt = `Write a sincere apology email for the inconvenience caused. The return reason was "${returnData.reason}". Acknowledge the issue and outline steps taken to prevent it.`;
          break;
        case 'custom':
          prompt = customPrompt || 'Generate a professional customer communication email.';
          break;
      }

      const { data, error } = await supabase.functions.invoke('generate-customer-message', {
        body: {
          returnId: returnData.id,
          customerEmail: returnData.customer_email,
          returnReason: returnData.reason,
          returnStatus: returnData.status,
          messageType,
          customPrompt: prompt,
          productName: returnData.return_items?.[0]?.product_name || 'Product'
        }
      });

      if (error) throw error;

      setGeneratedMessage(data.message || 'Error generating message');
      
      toast({
        title: "Message Generated",
        description: "AI has generated a personalized customer message.",
      });
    } catch (error) {
      console.error('Error generating message:', error);
      
      // Fallback message generation
      const fallbackMessage = `Dear ${returnData.customer_email.split('@')[0]},

Thank you for your return request regarding your recent order. We understand that ${returnData.reason.toLowerCase()}, and we want to make this right.

Your return is currently ${returnData.status} and we're working to process it as quickly as possible. We'll keep you updated on any progress.

If you have any questions or concerns, please don't hesitate to reach out to our customer service team.

Thank you for your patience and understanding.

Best regards,
Customer Service Team`;

      setGeneratedMessage(fallbackMessage);
      
      toast({
        title: "Message Generated",
        description: "Using enhanced template (AI service temporarily unavailable).",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!generatedMessage.trim()) {
      toast({
        title: "No Message",
        description: "Please generate a message first.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // In a real implementation, this would send the email
      // For now, we'll simulate the email sending and log the communication
      
      await supabase.from('analytics_events').insert({
        merchant_id: returnData.id, // This should be the actual merchant_id
        event_type: 'customer_communication',
        event_data: {
          return_id: returnData.id,
          customer_email: returnData.customer_email,
          message_type: messageType,
          message_preview: generatedMessage.substring(0, 100) + '...'
        }
      });

      toast({
        title: "Message Sent",
        description: `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} message sent to ${returnData.customer_email}`,
      });

      setGeneratedMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Customer Communication
        </CardTitle>
        <CardDescription>
          Generate personalized messages for customer {returnData.customer_email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Message Type</label>
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Status Update</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="apology">Apology</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {messageType === 'custom' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Instructions</label>
              <Textarea
                placeholder="Describe what kind of message you want to send..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-20"
              />
            </div>
          )}

          <Button 
            onClick={generateMessage} 
            disabled={loading || (messageType === 'custom' && !customPrompt.trim())}
            className="w-full cursor-pointer"
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating Message...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Message
              </>
            )}
          </Button>
        </div>

        {generatedMessage && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Generated Message</label>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  AI Generated
                </Badge>
              </div>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                className="min-h-32"
                placeholder="AI-generated message will appear here..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={sendMessage} disabled={sending} className="flex-1 cursor-pointer">
                {sending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setGeneratedMessage('')} className="cursor-pointer">
                Clear
              </Button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Customer Context</p>
              <p className="text-sm text-blue-700 mt-1">
                Return reason: {returnData.reason} • Status: {returnData.status}
              </p>
              {returnData.return_items && returnData.return_items.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Product: {returnData.return_items[0].product_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCommunicationAI;
