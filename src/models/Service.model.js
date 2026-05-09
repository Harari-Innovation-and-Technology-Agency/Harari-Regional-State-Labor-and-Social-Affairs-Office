const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Social Protection',
        'Employment',
        'Disability Support',
        'Labor Relations',
        'Community Development'
      ]
    },
    status: {
      type: String,
      enum: ['Available', 'Suspended'],
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
