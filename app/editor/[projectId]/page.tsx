import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { VideoEditor } from '@/components/video-editor'
import { getProject } from '@/app/actions/projects'

export default async function EditorPage({ params }: { params: { projectId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  try {
    const project = await getProject(params.projectId)
    return <VideoEditor project={project} />
  } catch (error) {
    redirect('/')
  }
}
