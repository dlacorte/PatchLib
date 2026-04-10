import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default function EditPatchRedirect({ params }: Props) {
  redirect(`/library/${params.id}/edit`)
}
