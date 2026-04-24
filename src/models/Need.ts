import mongoose from 'mongoose';

const NeedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  contact: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  type: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  urgency: {
    type: String,
    required: true
  },

  status: {
    type: String,
    default: "Pending"
  },

  assignedVolunteer: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Need', NeedSchema);