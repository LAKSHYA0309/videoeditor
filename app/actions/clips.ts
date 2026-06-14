'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clips, mediaAssets } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function addClipToTimeline(
  projectId: string,
  mediaAssetId: string,
  position: number,
  startTime: number = 0,
  duration: number = 5000
) {
  const userId = await getUserId()

  // Get the media asset to extract metadata
  const asset = await db
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, mediaAssetId),
        eq(mediaAssets.userId, userId)
      )
    )
    .limit(1)

  if (!asset.length) throw new Error('Media asset not found')

  const clipId = nanoid()
  await db.insert(clips).values({
    id: clipId,
    projectId,
    userId,
    name: asset[0].name,
    type: asset[0].type,
    url: asset[0].url,
    startTime,
    endTime: startTime + duration,
    duration,
    width: asset[0].width,
    height: asset[0].height,
    position,
  })

  revalidatePath(`/editor/${projectId}`)
  return { id: clipId, position }
}

export async function updateClip(
  clipId: string,
  data: {
    startTime?: number
    endTime?: number
    duration?: number
    position?: number
  }
) {
  const userId = await getUserId()

  await db
    .update(clips)
    .set(data)
    .where(
      and(
        eq(clips.id, clipId),
        eq(clips.userId, userId)
      )
    )

  return { success: true }
}

export async function deleteClip(clipId: string) {
  const userId = await getUserId()

  await db
    .delete(clips)
    .where(
      and(
        eq(clips.id, clipId),
        eq(clips.userId, userId)
      )
    )

  return { success: true }
}

export async function getProjectClips(projectId: string) {
  const userId = await getUserId()

  return db
    .select()
    .from(clips)
    .where(
      and(
        eq(clips.projectId, projectId),
        eq(clips.userId, userId)
      )
    )
    .orderBy(clips.position)
}

export async function trimClip(
  clipId: string,
  startTime: number,
  endTime: number
) {
  const userId = await getUserId()
  const duration = endTime - startTime

  await db
    .update(clips)
    .set({
      startTime,
      endTime,
      duration,
    })
    .where(
      and(
        eq(clips.id, clipId),
        eq(clips.userId, userId)
      )
    )

  return { success: true }
}

export async function splitClip(
  clipId: string,
  splitTime: number
) {
  const userId = await getUserId()

  // Get the original clip
  const [clip] = await db
    .select()
    .from(clips)
    .where(
      and(
        eq(clips.id, clipId),
        eq(clips.userId, userId)
      )
    )

  if (!clip) throw new Error('Clip not found')

  // Create new clip for the second part
  const newClipId = nanoid()
  const timeDiff = splitTime - clip.startTime
  
  await db.insert(clips).values({
    id: newClipId,
    projectId: clip.projectId,
    userId,
    name: `${clip.name} (Part 2)`,
    type: clip.type,
    url: clip.url,
    startTime: splitTime,
    endTime: clip.endTime,
    duration: clip.endTime - splitTime,
    width: clip.width,
    height: clip.height,
    position: clip.position + 1,
  })

  // Update original clip
  await db
    .update(clips)
    .set({
      endTime: splitTime,
      duration: timeDiff,
    })
    .where(eq(clips.id, clipId))

  return { success: true, newClipId }
}
