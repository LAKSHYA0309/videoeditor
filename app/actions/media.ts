'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaAssets } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function uploadMediaAsset(
  projectId: string,
  name: string,
  type: 'video' | 'audio' | 'image',
  url: string,
  fileSize: number,
  duration?: number,
  width?: number,
  height?: number
) {
  const userId = await getUserId()
  const assetId = nanoid()

  await db.insert(mediaAssets).values({
    id: assetId,
    userId,
    projectId,
    name,
    type,
    url,
    fileSize,
    duration,
    width,
    height,
  })

  revalidatePath(`/editor/${projectId}`)
  return { id: assetId, success: true }
}

export async function getProjectMediaAssets(projectId: string) {
  const userId = await getUserId()

  return db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.projectId, projectId),
        eq(mediaAssets.userId, userId)
      )
    )
}

export async function deleteMediaAsset(assetId: string) {
  const userId = await getUserId()

  await db
    .delete(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, assetId),
        eq(mediaAssets.userId, userId)
      )
    )

  return { success: true }
}

export async function updateMediaAsset(
  assetId: string,
  data: {
    name?: string
    duration?: number
    width?: number
    height?: number
  }
) {
  const userId = await getUserId()

  await db
    .update(mediaAssets)
    .set(data)
    .where(
      and(
        eq(mediaAssets.id, assetId),
        eq(mediaAssets.userId, userId)
      )
    )

  return { success: true }
}
