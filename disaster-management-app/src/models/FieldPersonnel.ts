import mongoose, { Document, Model } from 'mongoose';

interface IFieldPersonnel extends Document {
  name: string;
  govtId: string;
  phoneNo: string;
  reportingLocation: {
    type: string;
    coordinates: [number, number];
    name: string;
  };
  assignedLocation: {
    type: string;
    coordinates: [number, number];
    name: string;
  };
  status: 'available' | 'assigned' | 'on_duty';
  createdAt: Date;
  updatedAt: Date;
}

const fieldPersonnelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  govtId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true
  },
  reportingLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  assignedLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'assigned'],
    default: 'available'
  },
});

// Create indexes for geospatial queries
fieldPersonnelSchema.index({ reportingLocation: '2dsphere' });
fieldPersonnelSchema.index({ assignedLocation: '2dsphere' });

// Update the updatedAt timestamp before saving
fieldPersonnelSchema.pre('save', function(this: IFieldPersonnel, next: mongoose.CallbackWithoutResultAndOptionalError) {
  this.updatedAt = new Date();
  next();
});

const FieldPersonnel: Model<IFieldPersonnel> = mongoose.model<IFieldPersonnel>('FieldPersonnel', fieldPersonnelSchema);

export default FieldPersonnel; 