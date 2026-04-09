import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AUDIO_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AUDIO_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AUDIO_AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.AUDIO_BUCKET_NAME!
const REGION = process.env.AUDIO_AWS_REGION!

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body?.filename || !body?.contentType) {
    return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 })
  }

  if (body.contentType !== 'audio/mpeg') {
    return NextResponse.json({ error: 'Only MP3 files are accepted' }, { status: 400 })
  }

  const key = `audio/${crypto.randomUUID()}.mp3`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: 'audio/mpeg',
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`

  return NextResponse.json({ uploadUrl, publicUrl })
}
