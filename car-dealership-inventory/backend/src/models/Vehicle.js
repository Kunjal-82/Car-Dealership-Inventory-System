const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Sport', 'Van', 'Off-Road', 'Pickup'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

vehicleSchema.pre('deleteOne', async function(next) {
  const query = this.getQuery();
  const vehicleId = query._id;
  if (vehicleId) {
    const Inventory = mongoose.model('Inventory');
    await Inventory.deleteMany({ vehicleId });
  }
  next();
});

vehicleSchema.pre('findOneAndDelete', async function(next) {
  const query = this.getQuery();
  const vehicleId = query._id;
  if (vehicleId) {
    const Inventory = mongoose.model('Inventory');
    await Inventory.deleteMany({ vehicleId });
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
