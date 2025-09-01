/**
 * Complete Test Setup Summary for test-66666666.myshopify.com
 */

const testSetupSummary = {
  shopDomain: "test-66666666.myshopify.com",
  merchantId: "Generated UUID (check Supabase)",
  
  // Test customer users (with orders)
  testCustomers: [
    {
      "📧 Email": "john.smith@test.com",
      "🛍️ Order": "ORD-2024-TEST-001", 
      "💰 Total": "$299.97",
      items: ["Gaming Headset Pro", "Mechanical Keyboard", "Gaming Mouse"]
    },
    {
      "📧 Email": "sarah.johnson@test.com",
      "🛍️ Order": "ORD-2024-TEST-002",
      "💰 Total": "$549.95", 
      items: ["MacBook Pro Case Premium", "Wireless Charging Station", "USB-C Hub Deluxe", "Laptop Stand Ergonomic"]
    },
    {
      "📧 Email": "mike.chen@test.com",
      "🛍️ Order": "ORD-2024-TEST-003",
      "💰 Total": "$179.97",
      items: ["Bluetooth Speaker", "Phone Case Premium", "Screen Protector Pack"]
    },
    {
      "📧 Email": "emma.wilson@test.com", 
      "🛍️ Order": "ORD-2024-TEST-004",
      "💰 Total": "$129.98",
      items: ["Wireless Earbuds", "Car Mount Universal"]
    },
    {
      "📧 Email": "david.brown@test.com",
      "🛍️ Order": "ORD-2024-TEST-005", 
      "💰 Total": "$699.95",
      items: ["Monitor 4K Professional", "Webcam HD Pro", "Desk Lamp LED", "Cable Management Kit"]
    }
  ],

  // Admin users (in profiles table)
  adminUsers: [
    {
      email: "aalvi.hm@gmail.com",
      role: "master_admin",
      name: "Master Admin",
      permissions: "Full system access"
    },
    {
      email: "quadquetech2020@gmail.com", 
      role: "merchant_admin",
      name: "Merchant Admin",
      permissions: "Merchant-level admin access"
    },
    {
      email: "yuanhuafung2021@gmail.com",
      role: "merchant_staff", 
      name: "Merchant Staff",
      permissions: "Staff-level access"
    }
  ],

  // Sample returns data
  sampleReturns: [
    {
      customer: "john.smith@test.com",
      orderId: "ORD-2024-TEST-001",
      reason: "Product defective",
      status: "requested",
      amount: "$149.99"
    },
    {
      customer: "sarah.johnson@test.com",
      orderId: "ORD-2024-TEST-002", 
      reason: "Wrong size",
      status: "approved",
      amount: "$129.99"
    }
  ],

  // Testing URLs
  urls: {
    install: "https://ras-8.vercel.app/install?shop=test-66666666.myshopify.com",
    oauthStart: "https://ras-8.vercel.app/auth/start?shop=test-66666666.myshopify.com",
    customerPortal: "https://ras-8.vercel.app/customer-portal?email=john.smith@test.com",
    embedUrl: "https://admin.shopify.com/store/test-66666666/apps/returns-automation?shop=test-66666666.myshopify.com&host=dGVzdC02NjY2NjY2Ni5teXNob3BpZnkuY29tL2FkbWlu"
  },

  // Database records created
  recordsCounts: {
    merchants: 1,
    orders: 5, 
    orderItems: 16,
    returns: 2,
    returnItems: 2,
    profiles: 3
  }
};

console.log('🏪 Complete Test Setup for test-66666666.myshopify.com');
console.log('='.repeat(60));
console.log();
console.log('✅ Test Customers (JSON Output):');
console.log(JSON.stringify(testSetupSummary.testCustomers.map(customer => ({
  "📧 Email": customer["📧 Email"],
  "🛍️ Order": customer["🛍️ Order"], 
  "💰 Total": customer["💰 Total"]
})), null, 2));

console.log();
console.log('👤 Admin Users:');
testSetupSummary.adminUsers.forEach((admin, i) => {
  console.log(`${i + 1}. ${admin.email} (${admin.role})`);
});

console.log();
console.log('🔗 Key Testing URLs:');
console.log(`Install: ${testSetupSummary.urls.install}`);
console.log(`Customer Portal: ${testSetupSummary.urls.customerPortal}`);

module.exports = testSetupSummary;