export const dashboardConfigs = {
  ADMIN: [
    {
      id: 'stat-users',
      widgetType: 'stats-card',
      w: 4,
      h: 1,
      settings: { title: 'Platform Users', count: 11, icon: 'ri-user-line', badgeText: 'Active', badgeType: 'success' }
    },
    {
      id: 'stat-products',
      widgetType: 'stats-card',
      w: 4,
      h: 1,
      settings: { title: 'Total Products', endpoint: '/api/crud/product', icon: 'ri-box-3-line', badgeText: 'Inventory', badgeType: 'info' }
    },
    {
      id: 'stat-leads',
      widgetType: 'stats-card',
      w: 4,
      h: 1,
      settings: { title: 'Sales Leads', endpoint: '/api/crud/lead', icon: 'ri-customer-service-2-line', badgeText: 'Hot Pipeline', badgeType: 'warning' }
    },
    {
      id: 'quick-actions',
      widgetType: 'quick-actions',
      w: 4,
      h: 2,
      settings: {
        actions: [
          { label: 'Add Product', path: '/crud/product/new', icon: 'ri-add-box-line' },
          { label: 'Add Lead', path: '/crud/lead/new', icon: 'ri-user-add-line' },
          { label: 'Manage Users', path: '/admin/users', icon: 'ri-settings-4-line' }
        ]
      }
    },
    {
      id: 'sales-chart',
      widgetType: 'chart',
      w: 8,
      h: 3,
      settings: {
        title: 'Monthly Performance Metric',
        type: 'line',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [12000, 19000, 32000, 5000, 24000, 35000]
      }
    },
    {
      id: 'recent-products',
      widgetType: 'recent-table',
      w: 6,
      h: 3,
      settings: { title: 'Recent Products List', entity: 'product', limit: 5 }
    },
    {
      id: 'recent-leads',
      widgetType: 'recent-table',
      w: 6,
      h: 3,
      settings: { title: 'Recent CRM Leads', entity: 'lead', limit: 5 }
    },
    {
      id: 'ai-prompt',
      widgetType: 'ai-prompt',
      w: 8,
      h: 2,
      settings: { placeholder: 'Ask AI: "Total stock value", "Which leads are new?"' }
    },
    {
      id: 'pending-approvals',
      widgetType: 'approval-queue',
      w: 4,
      h: 2,
      settings: { title: 'Approvals Queue' }
    }
  ],
  USER: [
    {
      id: 'stat-products',
      widgetType: 'stats-card',
      w: 6,
      h: 1,
      settings: { title: 'Total Products', endpoint: '/api/crud/product', icon: 'ri-box-3-line', badgeText: 'Inventory', badgeType: 'info' }
    },
    {
      id: 'stat-leads',
      widgetType: 'stats-card',
      w: 6,
      h: 1,
      settings: { title: 'My Active Leads', endpoint: '/api/crud/lead', icon: 'ri-customer-service-2-line', badgeText: 'CRM Pipeline', badgeType: 'warning' }
    },
    {
      id: 'recent-leads',
      widgetType: 'recent-table',
      w: 8,
      h: 3,
      settings: { title: 'My Leads Feed', entity: 'lead', limit: 5 }
    },
    {
      id: 'quick-actions',
      widgetType: 'quick-actions',
      w: 4,
      h: 3,
      settings: {
        actions: [
          { label: 'Add Lead', path: '/crud/lead/new', icon: 'ri-user-add-line' },
          { label: 'View Profile', path: '/profile', icon: 'ri-user-settings-line' }
        ]
      }
    },
    {
      id: 'ai-prompt',
      widgetType: 'ai-prompt',
      w: 12,
      h: 2,
      settings: { placeholder: 'Ask AI: "Find website leads"' }
    }
  ]
};
