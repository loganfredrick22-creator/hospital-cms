import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService, patientService } from '@/services/dataService';
import DataTable from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';
import { Eye, Plus, X } from 'lucide-react';

const defaultItem = { description: '', quantity: 1, unitPrice: 0 };
const defaultBilling = { patient: '', items: [], paidAmount: 0, paymentMethod: 'cash', notes: '' };

export default function BillingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewBilling, setViewBilling] = useState(null);
  const [form, setForm] = useState(defaultBilling);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['billing', page, search],
    queryFn: () => billingService.getAll({ page, limit: 10, status: search || undefined }),
  });

  const { data: patients } = useQuery({
    queryKey: ['billing-patients'],
    queryFn: () => patientService.getAll({ limit: 100 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: billingService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); setDialogOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => billingService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); setDialogOpen(false); resetForm(); },
  });

  const resetForm = () => { setForm(defaultBilling); setEditingId(null); };
  const totalAmount = form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { ...defaultItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: field === 'description' ? value : parseFloat(value) || 0 };
    setForm({ ...form, items });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate({ ...form, totalAmount });
    }
  };

  const openEdit = (b) => {
    setEditingId(b._id);
    setForm({ patient: b.patient?._id || '', items: b.items || [], paidAmount: b.paidAmount || 0, paymentMethod: b.paymentMethod || 'cash', notes: b.notes || '' });
    setDialogOpen(true);
  };

  const columns = [
    { key: 'invoice', label: 'Invoice', render: (r) => r.invoiceNumber || 'N/A' },
    { key: 'patient', label: 'Patient', render: (r) => r.patient?.user?.name || 'N/A' },
    { key: 'totalAmount', label: 'Amount', render: (r) => formatCurrency(r.totalAmount) },
    { key: 'paidAmount', label: 'Paid', render: (r) => formatCurrency(r.paidAmount) },
    { key: 'due', label: 'Due', render: (r) => formatCurrency(r.totalAmount - r.paidAmount) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge variant="info" className={getStatusColor(r.status)}>{r.status}</Badge>,
    },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setViewBilling(r)}><Eye className="h-4 w-4" /></Button>
          {r.status !== 'paid' && r.status !== 'cancelled' && (
            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      <DataTable
        columns={columns}
        data={data?.data?.billings}
        total={data?.data?.total}
        page={page}
        totalPages={data?.data?.totalPages}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Filter by status..."
        onAdd={() => { resetForm(); setDialogOpen(true); }}
        addLabel="New Invoice"
        loading={isLoading}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Update Payment' : 'New Invoice'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={form.patient} onValueChange={(v) => setForm({ ...form, patient: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients?.patients?.map((p) => <SelectItem key={p._id} value={p._id}>{p.user?.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editingId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium">Item #{i + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} required />
                      <Input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} required />
                    </div>
                    <p className="text-xs text-muted-foreground">Subtotal: {formatCurrency(item.quantity * item.unitPrice)}</p>
                  </div>
                ))}
                {form.items.length > 0 && (
                  <p className="text-right text-sm font-medium">Total: {formatCurrency(totalAmount)}</p>
                )}
              </div>
            )}
            {editingId && (
              <div className="space-y-2">
                <Label>Paid Amount</Label>
                <Input type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            {editingId && (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['cash', 'card', 'insurance', 'online', 'other'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">
              {editingId ? 'Update Payment' : 'Create Invoice'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewBilling} onOpenChange={(o) => !o && setViewBilling(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {viewBilling && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{viewBilling.invoiceNumber}</span>
                <Badge variant="info" className={getStatusColor(viewBilling.status)}>{viewBilling.status}</Badge>
              </div>
              <div><span className="font-medium">Patient:</span> {viewBilling.patient?.user?.name}</div>
              <div><span className="font-medium">Date:</span> {formatDate(viewBilling.createdAt)}</div>
              {viewBilling.items?.map((item, i) => (
                <div key={i} className="flex justify-between rounded border p-2">
                  <span>{item.description} x{item.quantity}</span>
                  <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between"><span>Total:</span> <span>{formatCurrency(viewBilling.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Paid:</span> <span>{formatCurrency(viewBilling.paidAmount)}</span></div>
                <div className="flex justify-between font-medium"><span>Due:</span> <span>{formatCurrency(viewBilling.totalAmount - viewBilling.paidAmount)}</span></div>
              </div>
              {viewBilling.notes && <div><span className="font-medium">Notes:</span> {viewBilling.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
