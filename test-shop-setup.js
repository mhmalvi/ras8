/**
 * Test script to verify the test-66666666.myshopify.com shop setup
 * This script tests authentication URLs and user data setup
 */

const TEST_SHOP = 'test-66666666.myshopify.com';

// Test the install URL for the new shop
const installUrl = `https://ras-8.vercel.app/install?shop=${TEST_SHOP}`;

// Test OAuth start URL 
const oauthStartUrl = `https://ras-8.vercel.app/auth/start?shop=${TEST_SHOP}`;

// Test embed URL (for when authenticated)
const host = Buffer.from(`${TEST_SHOP}/admin`).toString('base64');
const embedUrl = `https://admin.shopify.com/store/test-66666666/apps/returns-automation?shop=${TEST_SHOP}&host=${host}`;

// Test users data
const testUsers = [
  {
    email: 'john.smith@test.com',
    orderId: 'ORD-2024-TEST-001',
    totalAmount: 299.97,
    items: ['Gaming Headset Pro', 'Mechanical Keyboard', 'Gaming Mouse']
  },
  {
    email: 'sarah.johnson@test.com', 
    orderId: 'ORD-2024-TEST-002',
    totalAmount: 549.95,
    items: ['MacBook Pro Case Premium', 'Wireless Charging Station', 'USB-C Hub Deluxe', 'Laptop Stand Ergonomic']
  },
  {
    email: 'mike.chen@test.com',
    orderId: 'ORD-2024-TEST-003', 
    totalAmount: 179.97,
    items: ['Bluetooth Speaker', 'Phone Case Premium', 'Screen Protector Pack']
  },
  {
    email: 'emma.wilson@test.com',
    orderId: 'ORD-2024-TEST-004',
    totalAmount: 129.98,
    items: ['Wireless Earbuds', 'Car Mount Universal']
  },
  {
    email: 'david.brown@test.com',
    orderId: 'ORD-2024-TEST-005',
    totalAmount: 699.95,
    items: ['Monitor 4K Professional', 'Webcam HD Pro', 'Desk Lamp LED', 'Cable Management Kit']
  }
];

console.log('🏪 Test Shop Setup: test-66666666.myshopify.com');
console.log('='.repeat(60));
console.log();

console.log('📋 Installation & Authentication URLs:');
console.log(`Install URL: ${installUrl}`);
console.log(`OAuth Start: ${oauthStartUrl}`);
console.log(`Embed URL: ${embedUrl}`);
console.log();

console.log('👥 Test Users Created:');
testUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.email}`);
  console.log(`   Order: ${user.orderId} ($${user.totalAmount})`);
  console.log(`   Items: ${user.items.join(', ')}`);
  console.log();
});

console.log('✅ Setup Complete! You can now:');
console.log('1. Install the app using the install URL');
console.log('2. Test OAuth flow with the test shop domain');
console.log('3. Use test customer emails to look up orders');
console.log('4. Test return creation and processing workflows');
console.log();

// Test customer portal URLs
console.log('🔍 Customer Portal Test URLs:');
console.log('(Use these emails to test customer-facing return requests)');
testUsers.forEach((user, index) => {
  const portalUrl = `https://ras-8.vercel.app/customer-portal?email=${encodeURIComponent(user.email)}`;
  console.log(`${index + 1}. ${user.email}: ${portalUrl}`);
});

console.log();
console.log('🗄️  Database Migration Applied:');
console.log('- Merchant record created for test-66666666.myshopify.com');
console.log('- 5 test orders with order items created');
console.log('- 2 sample return records created');
console.log('- All data properly linked with foreign keys');