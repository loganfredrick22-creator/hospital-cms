import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    items: { type: [billingItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['paid', 'unpaid', 'partial', 'cancelled'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'insurance', 'online', 'other'], default: 'cash' },
    dueDate: { type: Date },
    notes: { type: String, default: '' },
    invoiceNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

billingSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Billing').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Billing', billingSchema);
