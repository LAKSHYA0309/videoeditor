'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { effects, transitions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function addEffect(
  projectId: string,
  clipId: string,
  type: string,
  properties?: Record<string, any>
) {
  const userId = await getUserId()
  const effectId = nanoid()

  await db.insert(effects).values({
    id: effectId,
    userId,
    projectId,
    clipId,
    type,
    properties: properties ? JSON.stringify(properties) : null,
  })

  revalidatePath(`/editor/${projectId}`)
  return { id: effectId, success: true }
}

export async function updateEffect(
  effectId: string,
  properties: Record<string, any>
) {
  const userId = await getUserId()

  await db
    .update(effects)
    .set({
      properties: JSON.stringify(properties),
    })
    .where(
      and(
        eq(effects.id, effectId),
        eq(effects.userId, userId)
      )
    )

  return { success: true }
}

export async function deleteEffect(effectId: string) {
  const userId = await getUserId()

  await db
    .delete(effects)
    .where(
      and(
        eq(effects.id, effectId),
        eq(effects.userId, userId)
      )
    )

  return { success: true }
}

export async function getClipEffects(clipId: string) {
  const userId = await getUserId()

  return db
    .select()
    .from(effects)
    .where(
      and(
        eq(effects.clipId, clipId),
        eq(effects.userId, userId)
      )
    )
}

export async function addTransition(
  projectId: string,
  clipId: string,
  type: string,
  duration: number = 300
) {
  const userId = await getUserId()
  const transitionId = nanoid()

  await db.insert(transitions).values({
    id: transitionId,
    userId,
    projectId,
    clipId,
    type,
    duration,
  })

  revalidatePath(`/editor/${projectId}`)
  return { id: transitionId, success: true }
}

export async function updateTransition(
  transitionId: string,
  type: string,
  duration: number
) {
  const userId = await getUserId()

  await db
    .update(transitions)
    .set({ type, duration })
    .where(
      and(
        eq(transitions.id, transitionId),
        eq(transitions.userId, userId)
      )
    )

  return { success: true }
}

export async function deleteTransition(transitionId: string) {
  const userId = await getUserId()

  await db
    .delete(transitions)
    .where(
      and(
        eq(transitions.id, transitionId),
        eq(transitions.userId, userId)
      )
    )

  return { success: true }
}
