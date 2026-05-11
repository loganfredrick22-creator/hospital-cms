import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, doctorService, patientService, departmentService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { Eye, Pencil } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const defaultAppointment = {
  patient: '',
  doctor: '',
  department: '',
  date: '',
  timeSlot: '',
  reason: '',
  type: 'in-person',
  notes: '',
};

export default function AppointmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewApt, setViewApt] = useState(null);
  const [form, setForm] = useState(defaultAppointment);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page, search],
    queryFn: () => appointmentService.getAll({ page, limit: 10, date: search || undefined }),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-select'],
    queryFn: () => doctorService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-select'],
    queryFn: () => patientService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: depts } = useQuery({
    queryKey: ['departments-select'],
    queryFn: () => departmentService.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => { setForm(defaultAppointment); setEditingId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (apt) => {
    setEditingId(apt._id);
    setForm({
      patient: apt.patient?._id || '',
      doctor: apt.doctor?._id || '',
      department: apt.department?._id || '',
      date: apt.date ? apt.date.split('T')[0] : '',
      timeSlot: apt.timeSlot || '',
      reason: apt.reason || '',
      type: apt.type || 'in-person',
      notes: apt.notes || '',
    });
    setDialogOpen(true);
  };

  const columns = [
    { key: 'patient', label: 'Patient', render: (r) => r.patient?.user?.name || 'N/A' },
    { key: 'doctor', label: 'Doctor', render: (r) => r.doctor?.user?.name || 'N/A' },
    { key: 'department', label: 'Department', render: (r) => r.department?.name || 'N/A' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'timeSlot', label: 'Time' },
    { key: 'type', label: 'Type' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge variant="info" className={getStatusColor(r.status)}>{r.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewApt(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <DataTable
        columns={columns}
        data={data?.data?.appointments}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Filter by date (YYYY-MM-DD)..."
        onAdd={() => { resetForm(); setDialogOpen(true); }}
        addLabel="New Appointment"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={form.patient} onValueChange={(v) => setForm({ ...form, patient: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients?.patients?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.user?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {depts?.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors?.doctors?.map((d) => (
                    <SelectItem key={d._id} value={d._id}>{d.user?.name} - {d.specialization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Input type="time" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In Person</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            {editingId && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update Appointment' : 'Create Appointment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewApt} onOpenChange={(o) => !o && setViewApt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {viewApt && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Patient:</span> {viewApt.patient?.user?.name}</div>
                <div><span className="font-medium">Doctor:</span> {viewApt.doctor?.user?.name}</div>
                <div><span className="font-medium">Department:</span> {viewApt.department?.name}</div>
                <div><span className="font-medium">Date:</span> {formatDate(viewApt.date)}</div>
                <div><span className="font-medium">Time:</span> {viewApt.timeSlot}</div>
                <div><span className="font-medium">Type:</span> {viewApt.type}</div>
                <div><span className="font-medium">Status:</span> <Badge variant="info" className={getStatusColor(viewApt.status)}>{viewApt.status}</Badge></div>
              </div>
              <div className="text-sm"><span className="font-medium">Reason:</span> {viewApt.reason || 'N/A'}</div>
              <div className="text-sm"><span className="font-medium">Notes:</span> {viewApt.notes || 'N/A'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
