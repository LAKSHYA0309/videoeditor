'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, clips, mediaAssets } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createProject(title: string, description?: string) {
  const userId = await getUserId()
  const id = nanoid()

  await db.insert(projects).values({
    id,
    userId,
    title,
    description,
    duration: 0,
  })

  revalidatePath('/')
  return { id }
}

export async function getProjects() {
  const userId = await getUserId()
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))

  return userProjects
}

export async function getProject(projectId: string) {
  const userId = await getUserId()
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!project) throw new Error('Project not found')
  return project
}

export async function updateProject(
  projectId: string,
  data: { title?: string; description?: string; thumbnail?: string; duration?: number }
) {
  const userId = await getUserId()

  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  revalidatePath('/')
}

export async function deleteProject(projectId: string) {
  const userId = await getUserId()

  // Delete all clips in the project
  await db.delete(clips).where(and(eq(clips.projectId, projectId), eq(clips.userId, userId)))

  // Delete all media assets in the project
  await db.delete(mediaAssets).where(and(eq(mediaAssets.projectId, projectId), eq(mediaAssets.userId, userId)))

  // Delete the project
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  revalidatePath('/')
}

export async function getProjectClips(projectId: string) {
  const userId = await getUserId()
  const projectClips = await db
    .select()
    .from(clips)
    .where(and(eq(clips.projectId, projectId), eq(clips.userId, userId)))
    .orderBy(clips.position)

  return projectClips
}

export async function getProjectMediaAssets(projectId: string) {
  const userId = await getUserId()
  const assets = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.projectId, projectId), eq(mediaAssets.userId, userId)))

  return assets
}

export async function addMediaAsset(
  projectId: string,
  name: string,
  type: string,
  url: string,
  metadata?: { fileSize?: number; duration?: number; width?: number; height?: number }
) {
  const userId = await getUserId()
  const id = nanoid()

  await db.insert(mediaAssets).values({
    id,
    userId,
    projectId,
    name,
    type,
    url,
    fileSize: metadata?.fileSize,
    duration: metadata?.duration,
    width: metadata?.width,
    height: metadata?.height,
  })

  revalidatePath(`/editor/${projectId}`)
  return { id }
}
