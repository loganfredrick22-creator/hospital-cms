import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalRecordService, patientService, doctorService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formatters';
import { Eye, Pencil } from 'lucide-react';

const defaultRecord = { patient: '', doctor: '', diagnosis: '', symptoms: '', treatment: '', notes: '' };

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(defaultRecord);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', page, search],
    queryFn: () => medicalRecordService.getAll({ page, limit: 10, patient: search || undefined }),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-records-select'],
    queryFn: () => patientService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-records-select'],
    queryFn: () => doctorService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: medicalRecordService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medical-records'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => medicalRecordService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['medical-records'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => { setForm(defaultRecord); setEditingId(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      symptoms: form.symptoms ? form.symptoms.split(',').map((s) => s.trim()) : [],
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({
      patient: r.patient?._id || '',
      doctor: r.doctor?._id || '',
      diagnosis: r.diagnosis || '',
      symptoms: r.symptoms?.join(', ') || '',
      treatment: r.treatment || '',
      notes: r.notes || '',
    });
    setDialogOpen(true);
  };

  const columns = [
    { key: 'patient', label: 'Patient', render: (r) => r.patient?.user?.name || 'N/A' },
    { key: 'doctor', label: 'Doctor', render: (r) => r.doctor?.user?.name || 'N/A' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewRecord(r)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Medical Records</h1>
      <DataTable
        columns={columns}
        data={data?.data?.records}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Filter by patient ID..."
        onAdd={() => { resetForm(); setDialogOpen(true); }}
        addLabel="Add Record"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Medical Record' : 'New Medical Record'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={form.patient} onValueChange={(v) => setForm({ ...form, patient: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients?.patients?.map((p) => <SelectItem key={p._id} value={p._id}>{p.user?.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors?.doctors?.map((d) => <SelectItem key={d._id} value={d._id}>{d.user?.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Symptoms (comma separated)</Label>
              <Input value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">{editingId ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRecord} onOpenChange={(o) => !o && setViewRecord(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Medical Record Details</DialogTitle></DialogHeader>
          {viewRecord && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Patient:</span> {viewRecord.patient?.user?.name}</div>
              <div><span className="font-medium">Doctor:</span> {viewRecord.doctor?.user?.name}</div>
              <div><span className="font-medium">Diagnosis:</span> {viewRecord.diagnosis}</div>
              <div><span className="font-medium">Symptoms:</span> {viewRecord.symptoms?.join(', ') || 'N/A'}</div>
              <div><span className="font-medium">Treatment:</span> {viewRecord.treatment || 'N/A'}</div>
              <div><span className="font-medium">Notes:</span> {viewRecord.notes || 'N/A'}</div>
              <div><span className="font-medium">Date:</span> {formatDate(viewRecord.createdAt)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
