
interface ReturnData {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  product: string;
  reason: string;
  value: string;
  status: string;
  aiSuggestion?: string;
  date: string;
  confidence?: number;
}

export const exportToCSV = (data: ReturnData[], filename: string = 'returns-export') => {
  // Prepare CSV headers
  const headers = [
    'Return ID',
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Product',
    'Reason',
    'Value',
    'Status',
    'AI Suggestion',
    'AI Confidence',
    'Date'
  ];

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.id,
      row.orderNumber,
      `"${row.customer.name}"`,
      row.customer.email,
      `"${row.product}"`,
      `"${row.reason}"`,
      row.value,
      row.status,
      `"${row.aiSuggestion || ''}"`,
      row.confidence || '',
      row.date
    ].join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAnalyticsToCSV = (analyticsData: any[], filename: string = 'analytics-export') => {
  const headers = [
    'Date',
    'Total Returns',
    'Exchanges',
    'Refunds',
    'AI Acceptance Rate',
    'Revenue Retained'
  ];

  const csvContent = [
    headers.join(','),
    ...analyticsData.map(row => [
      row.date,
      row.totalReturns,
      row.exchanges,
      row.refunds,
      `${row.aiAcceptanceRate}%`,
      `$${row.revenueRetained}`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
