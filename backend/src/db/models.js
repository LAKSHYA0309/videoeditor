import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, unique: true, required: true },
  emailVerified: { type: Boolean, default: false },
  image: String,
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  duration: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const clipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  url: String,
  startTime: { type: Number, default: 0 },
  trimStart: { type: Number, default: 0 },
  endTime: { type: Number },
  duration: { type: Number },
  width: Number,
  height: Number,
  position: { type: Number, default: 0 },
  trackId: String,
  // Visual & audio properties
  posX: { type: Number, default: 0 },
  posY: { type: Number, default: 0 },
  scale: { type: Number, default: 100 },
  rotation: { type: Number, default: 0 },
  opacity: { type: Number, default: 100 },
  textColor: { type: String, default: '#ffffff' },
  fontSize: { type: Number, default: 24 },
  textContent: { type: String, default: '' },
  volume: { type: Number, default: 100 },
  // Extended properties
  fadeIn: { type: Number, default: 0 },
  fadeOut: { type: Number, default: 0 },
  fontFamily: { type: String, default: 'Geist' },
  align: { type: String, default: 'center' },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const mediaAssetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  url: { type: String, required: true },
  fileSize: Number,
  duration: Number,
  width: Number,
  height: Number,
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

const transitionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  clipId: { type: String, required: true },
  type: { type: String, required: true },
  duration: { type: Number, default: 300 },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

const effectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  projectId: { type: String, required: true },
  clipId: { type: String, required: true },
  type: { type: String, required: true },
  properties: String,
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Clip = mongoose.model('Clip', clipSchema);
export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
export const Transition = mongoose.model('Transition', transitionSchema);
export const Effect = mongoose.model('Effect', effectSchema);
