import { pgTable, text, timestamp, boolean, integer, bigint } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: bigint('expiresAt', { mode: 'number' }),
  tokenType: text('tokenType'),
  scope: text('scope'),
  idToken: text('idToken'),
  sessionState: text('sessionState'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables -----------------------------------------------------------

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'),
  duration: bigint('duration', { mode: 'number' }).default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const clips = pgTable('clips', {
  id: text('id').primaryKey(),
  projectId: text('projectId').notNull(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'video', 'audio', 'image', 'text'
  url: text('url'),
  startTime: bigint('startTime', { mode: 'number' }).default(0),
  endTime: bigint('endTime', { mode: 'number' }),
  duration: bigint('duration', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  position: integer('position').default(0),
  trackId: text('trackId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const mediaAssets = pgTable('media_assets', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  projectId: text('projectId').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'video', 'audio', 'image'
  url: text('url').notNull(),
  fileSize: bigint('fileSize', { mode: 'number' }),
  duration: bigint('duration', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const transitions = pgTable('transitions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  projectId: text('projectId').notNull(),
  clipId: text('clipId').notNull(),
  type: text('type').notNull(), // 'fade', 'slide', 'wipe', etc.
  duration: bigint('duration', { mode: 'number' }).default(300),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const effects = pgTable('effects', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  projectId: text('projectId').notNull(),
  clipId: text('clipId').notNull(),
  type: text('type').notNull(), // 'brightness', 'contrast', 'saturation', etc.
  properties: text('properties'), // JSON string
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
