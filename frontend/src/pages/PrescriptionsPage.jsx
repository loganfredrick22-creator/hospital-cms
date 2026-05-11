import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionService, patientService, doctorService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formatters';
import { Eye, Plus, X } from 'lucide-react';

const defaultMedicine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
const defaultPrescription = { patient: '', doctor: '', diagnosis: '', notes: '', medicines: [] };

export default function PrescriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPrescription, setViewPrescription] = useState(null);
  const [form, setForm] = useState(defaultPrescription);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page, search],
    queryFn: () => prescriptionService.getAll({ page, limit: 10, patient: search || undefined }),
  });

  const { data: patients } = useQuery({
    queryKey: ['presc-patients'],
    queryFn: () => patientService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: doctors } = useQuery({
    queryKey: ['presc-doctors'],
    queryFn: () => doctorService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: prescriptionService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prescriptions'] }); setDialogOpen(false); setForm(defaultPrescription); },
  });

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { ...defaultMedicine }] });
  const removeMedicine = (i) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMedicine = (i, field, value) => {
    const meds = [...form.medicines];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medicines: meds });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const columns = [
    { key: 'patient', label: 'Patient', render: (r) => r.patient?.user?.name || 'N/A' },
    { key: 'doctor', label: 'Doctor', render: (r) => r.doctor?.user?.name || 'N/A' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'medicines', label: 'Medicines', render: (r) => `${r.medicines?.length || 0} items` },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button variant="ghost" size="icon" onClick={() => setViewPrescription(r)}><Eye className="h-4 w-4" /></Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Prescriptions</h1>
      <DataTable
        columns={columns}
        data={data?.data?.prescriptions}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Filter by patient ID..."
        onAdd={() => { setForm(defaultPrescription); setDialogOpen(true); }}
        addLabel="New Prescription"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
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
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              {form.medicines.map((med, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium">Medicine #{i + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicine(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} required />
                    <Input placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} required />
                    <Input placeholder="Frequency (e.g. 2x/day)" value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} required />
                    <Input placeholder="Duration (e.g. 7 days)" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} required />
                    <Input className="col-span-2" placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              Create Prescription
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPrescription} onOpenChange={(o) => !o && setViewPrescription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Prescription Details</DialogTitle></DialogHeader>
          {viewPrescription && (
            <div className="space-y-3">
              <div className="text-sm"><span className="font-medium">Patient:</span> {viewPrescription.patient?.user?.name}</div>
              <div className="text-sm"><span className="font-medium">Doctor:</span> {viewPrescription.doctor?.user?.name}</div>
              <div className="text-sm"><span className="font-medium">Diagnosis:</span> {viewPrescription.diagnosis || 'N/A'}</div>
              <div className="text-sm"><span className="font-medium">Notes:</span> {viewPrescription.notes || 'N/A'}</div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Medicines</h4>
                {viewPrescription.medicines?.map((m, i) => (
                  <div key={i} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{m.name} - {m.dosage}</p>
                    <p className="text-muted-foreground">{m.frequency} for {m.duration}</p>
                    {m.instructions && <p className="text-muted-foreground">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
