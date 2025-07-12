import EnhancedWebhookManager from './EnhancedWebhookManager';

// Keep the existing WebhookManager for backward compatibility
// but use the enhanced version internally
const WebhookManager = () => {
  return <EnhancedWebhookManager />;
};

export default WebhookManager;
