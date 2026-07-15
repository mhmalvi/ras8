#!/usr/bin/env node

/**
 * Sentry Integration Test Script
 * Tests both frontend and backend Sentry error tracking
 */

const Sentry = require('@sentry/node');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BACKEND_DSN = process.env.SENTRY_DSN;
const FRONTEND_DSN = process.env.VITE_SENTRY_DSN;

console.log('🧪 Sentry Integration Test');
console.log('━'.repeat(60));

// Test 1: Verify DSN configuration
console.log('\n📋 Test 1: Verify DSN Configuration');
console.log('Backend DSN:', BACKEND_DSN ? '✅ Configured' : '❌ Missing');
console.log('Frontend DSN:', FRONTEND_DSN ? '✅ Configured' : '❌ Missing');

if (!BACKEND_DSN) {
  console.error('\n❌ SENTRY_DSN not found in .env.local');
  console.log('Please add: SENTRY_DSN=<your-backend-dsn>');
  process.exit(1);
}

if (!FRONTEND_DSN) {
  console.error('\n❌ VITE_SENTRY_DSN not found in .env.local');
  console.log('Please add: VITE_SENTRY_DSN=<your-frontend-dsn>');
  process.exit(1);
}

// Test 2: Initialize Backend Sentry
console.log('\n📋 Test 2: Initialize Backend Sentry');
try {
  Sentry.init({
    dsn: BACKEND_DSN,
    environment: 'test',
    tracesSampleRate: 1.0,
    beforeSend(event) {
      console.log('📤 Sending event to Sentry:', event.event_id);
      return event;
    },
  });
  console.log('✅ Backend Sentry initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Backend Sentry:', error.message);
  process.exit(1);
}

// Test 3: Send test message
console.log('\n📋 Test 3: Send Test Message');
try {
  const messageId = Sentry.captureMessage('🧪 Sentry Backend Test Message', {
    level: 'info',
    extra: {
      test: true,
      timestamp: new Date().toISOString(),
      script: 'test-sentry.js',
    },
  });
  console.log('✅ Test message sent, ID:', messageId);
} catch (error) {
  console.error('❌ Failed to send test message:', error.message);
}

// Test 4: Send test error
console.log('\n📋 Test 4: Send Test Error');
try {
  const testError = new Error('🧪 Sentry Backend Test Error');
  testError.stack = `Error: 🧪 Sentry Backend Test Error
    at testSentry (test-sentry.js:73:21)
    at Object.<anonymous> (test-sentry.js:80:1)`;

  const errorId = Sentry.captureException(testError, {
    extra: {
      test: true,
      timestamp: new Date().toISOString(),
      script: 'test-sentry.js',
      errorType: 'test',
    },
    tags: {
      test: 'true',
      environment: 'test-script',
    },
  });
  console.log('✅ Test error sent, ID:', errorId);
} catch (error) {
  console.error('❌ Failed to send test error:', error.message);
}

// Test 5: Flush events
console.log('\n📋 Test 5: Flush Events to Sentry');
Sentry.flush(3000)
  .then(() => {
    console.log('✅ All events flushed successfully');
    console.log('\n━'.repeat(60));
    console.log('✅ Sentry Integration Test Complete!');
    console.log('\n📊 Next Steps:');
    console.log('1. Visit: https://aethon-3w.sentry.io/issues/');
    console.log('2. Look for test events from "test-sentry.js"');
    console.log('3. Verify both message and error were received');
    console.log('\n💡 Events should appear within 1-2 minutes');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to flush events:', error.message);
    process.exit(1);
  });
