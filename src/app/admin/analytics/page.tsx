'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AnalyticsDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
