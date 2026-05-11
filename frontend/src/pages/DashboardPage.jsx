import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Stethoscope, CalendarCheck, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308'];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats().then((r) => r.data),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => dashboardService.getRevenue().then((r) => r.data),
  });

  const cards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Active Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope, color: 'text-green-600' },
    { label: "Today's Appointments", value: stats?.todayAppointments || 0, icon: CalendarCheck, color: 'text-purple-600' },
    { label: 'Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Pending Bills', value: stats?.pendingBills || 0, icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: Clock, color: 'text-indigo-600' },
  ];

  const pieData = stats?.appointmentsByStatus
    ? Object.entries(stats.appointmentsByStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointments by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentAppointments?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent appointments</p>
                )}
                {stats?.recentAppointments?.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{apt.patient?.user?.name || 'Unknown Patient'}</p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {apt.doctor?.user?.name || 'Unknown'} | {apt.department?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">{formatDate(apt.date)} {apt.timeSlot}</p>
                      <Badge variant="info" className={getStatusColor(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
