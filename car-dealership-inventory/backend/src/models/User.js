const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    }
  }
});

userSchema.pre('deleteOne', async function(next) {
  const query = this.getQuery();
  const userId = query._id;
  if (userId) {
    const Purchase = mongoose.model('Purchase');
    await Purchase.deleteMany({ userId });
  }
  next();
});

userSchema.pre('findOneAndDelete', async function(next) {
  const query = this.getQuery();
  const userId = query._id;
  if (userId) {
    const Purchase = mongoose.model('Purchase');
    await Purchase.deleteMany({ userId });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
