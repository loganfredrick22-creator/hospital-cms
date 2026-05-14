import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService, departmentService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusColor } from '@/utils/formatters';
import { Eye, Pencil } from 'lucide-react';

const defaultDoctor = {
  user: { name: '', email: '', password: 'password123', phone: '' },
  department: '',
  specialization: '',
  qualification: '',
  experience: 0,
  consultationFee: 0,
  licenseNumber: '',
  availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  availableTimeSlots: { start: '09:00', end: '17:00' },
  maxPatientsPerDay: 10,
};

export default function DoctorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [form, setForm] = useState(defaultDoctor);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', page, search],
    queryFn: () => doctorService.getAll({ page, limit: 10, search }),
  });

  const { data: depts } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: doctorService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctors'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => doctorService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctors'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => { setForm(defaultDoctor); setEditingId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (doc) => {
    setEditingId(doc._id);
    setForm({
      user: { name: doc.user?.name || '', email: doc.user?.email || '', password: '', phone: doc.user?.phone || '' },
      department: doc.department?._id || '',
      specialization: doc.specialization || '',
      qualification: doc.qualification || '',
      experience: doc.experience || 0,
      consultationFee: doc.consultationFee || 0,
      licenseNumber: doc.licenseNumber || '',
      availableDays: doc.availableDays || [],
      availableTimeSlots: doc.availableTimeSlots || { start: '09:00', end: '17:00' },
      maxPatientsPerDay: doc.maxPatientsPerDay || 10,
    });
    setDialogOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => r.user?.name || 'N/A' },
    { key: 'email', label: 'Email', render: (r) => r.user?.email || 'N/A' },
    { key: 'department', label: 'Department', render: (r) => r.department?.name || 'N/A' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'consultationFee', label: 'Fee (KES)', render: (r) => `KES ${r.consultationFee?.toLocaleString()}` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewDoctor(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Doctors</h1>
      <DataTable
        columns={columns}
        data={data?.data?.doctors}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search doctors..."
        onAdd={() => { resetForm(); setDialogOpen(true); }}
        addLabel="Add Doctor"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.user.name} onChange={(e) => setForm({ ...form, user: { ...form.user, name: e.target.value } })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.user.email} onChange={(e) => setForm({ ...form, user: { ...form.user, email: e.target.value } })} required />
              </div>
              {!editingId && (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.user.password} onChange={(e) => setForm({ ...form, user: { ...form.user, password: e.target.value } })} required />
                </div>
              )}
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.user.phone} onChange={(e) => setForm({ ...form, user: { ...form.user, phone: e.target.value } })} />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Experience (years)</Label>
                <Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Consultation Fee (KES)</Label>
                <Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Patients/Day</Label>
                <Input type="number" value={form.maxPatientsPerDay} onChange={(e) => setForm({ ...form, maxPatientsPerDay: parseInt(e.target.value) || 10 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.availableTimeSlots.start} onChange={(e) => setForm({ ...form, availableTimeSlots: { ...form.availableTimeSlots, start: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.availableTimeSlots.end} onChange={(e) => setForm({ ...form, availableTimeSlots: { ...form.availableTimeSlots, end: e.target.value } })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update Doctor' : 'Create Doctor'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDoctor} onOpenChange={(o) => !o && setViewDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {viewDoctor.user?.name}</div>
                <div><span className="font-medium">Email:</span> {viewDoctor.user?.email}</div>
                <div><span className="font-medium">Phone:</span> {viewDoctor.user?.phone}</div>
                <div><span className="font-medium">Department:</span> {viewDoctor.department?.name}</div>
                <div><span className="font-medium">Specialization:</span> {viewDoctor.specialization}</div>
                <div><span className="font-medium">Experience:</span> {viewDoctor.experience} years</div>
                <div><span className="font-medium">Fee:</span> KES {viewDoctor.consultationFee?.toLocaleString()}</div>
                <div><span className="font-medium">License:</span> {viewDoctor.licenseNumber || 'N/A'}</div>
              </div>
              <div className="text-sm"><span className="font-medium">Hours:</span> {viewDoctor.availableTimeSlots?.start} - {viewDoctor.availableTimeSlots?.end}</div>
              <div className="text-sm"><span className="font-medium">Days:</span> {viewDoctor.availableDays?.join(', ')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
