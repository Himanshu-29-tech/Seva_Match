import mongoose from 'mongoose';

const VolunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  skills: { type: String, required: true },
  availability: { type: String, required: true },
  preferredArea: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Volunteer', VolunteerSchema);