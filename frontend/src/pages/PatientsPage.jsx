import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, getStatusColor } from '@/utils/formatters';
import { Eye, Pencil } from 'lucide-react';

const defaultPatient = {
  user: { name: '', email: '', password: 'password123', phone: '' },
  dateOfBirth: '',
  gender: 'other',
  bloodGroup: 'O+',
  address: '',
  emergencyContact: { name: '', phone: '', relationship: '' },
  allergies: '',
  chronicConditions: '',
};

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [form, setForm] = useState(defaultPatient);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => patientService.getAll({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: patientService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patientService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => { setForm(defaultPatient); setEditingId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()) : [],
      chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map((s) => s.trim()) : [],
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (patient) => {
    setEditingId(patient._id);
    setForm({
      user: { name: patient.user?.name || '', email: patient.user?.email || '', password: '', phone: patient.user?.phone || '' },
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || 'other',
      bloodGroup: patient.bloodGroup || 'O+',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' },
      allergies: patient.allergies?.join(', ') || '',
      chronicConditions: patient.chronicConditions?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => r.user?.name || 'N/A' },
    { key: 'email', label: 'Email', render: (r) => r.user?.email || 'N/A' },
    { key: 'phone', label: 'Phone', render: (r) => r.user?.phone || 'N/A' },
    { key: 'gender', label: 'Gender' },
    { key: 'bloodGroup', label: 'Blood Group' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewPatient(r)}>
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
      <h1 className="text-2xl font-bold">Patients</h1>
      <DataTable
        columns={columns}
        data={data?.data?.patients}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search patients..."
        onAdd={() => { resetForm(); setDialogOpen(true); }}
        addLabel="Add Patient"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Patient' : 'Add Patient'}</DialogTitle>
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
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Allergies (comma separated)</Label>
              <Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Chronic Conditions (comma separated)</Label>
              <Input value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} />
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">Emergency Contact</h4>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Name" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
                <Input placeholder="Phone" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value } })} />
                <Input placeholder="Relationship" value={form.emergencyContact.relationship} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relationship: e.target.value } })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update Patient' : 'Create Patient'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPatient} onOpenChange={(o) => !o && setViewPatient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {viewPatient && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Name:</span> {viewPatient.user?.name}</div>
                <div><span className="font-medium">Email:</span> {viewPatient.user?.email}</div>
                <div><span className="font-medium">Phone:</span> {viewPatient.user?.phone}</div>
                <div><span className="font-medium">Gender:</span> {viewPatient.gender}</div>
                <div><span className="font-medium">Blood Group:</span> {viewPatient.bloodGroup}</div>
                <div><span className="font-medium">DOB:</span> {formatDate(viewPatient.dateOfBirth)}</div>
              </div>
              <div className="text-sm"><span className="font-medium">Address:</span> {viewPatient.address || 'N/A'}</div>
              <div className="text-sm"><span className="font-medium">Allergies:</span> {viewPatient.allergies?.join(', ') || 'None'}</div>
              <div className="text-sm"><span className="font-medium">Chronic Conditions:</span> {viewPatient.chronicConditions?.join(', ') || 'None'}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
