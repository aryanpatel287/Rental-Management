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
      id: 'quick-actions',
      widgetType: 'quick-actions',
      w: 8,
      h: 1,
      settings: {
        actions: [
          { label: 'Manage Users', path: '/admin/users', icon: 'ri-settings-4-line' }
        ]
      }
    },
    {
      id: 'sales-chart',
      widgetType: 'chart',
      w: 12,
      h: 3,
      settings: {
        title: 'Monthly Performance Metric',
        type: 'line',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [12000, 19000, 32000, 5000, 24000, 35000]
      }
    },
    {
      id: 'pending-approvals',
      widgetType: 'approval-queue',
      w: 12,
      h: 2,
      settings: { title: 'Approvals Queue' }
    }
  ],
  USER: [
    {
      id: 'quick-actions',
      widgetType: 'quick-actions',
      w: 12,
      h: 1,
      settings: {
        actions: [
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
