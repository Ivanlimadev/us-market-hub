import { CryptoDetailClient } from './CryptoDetailClient'

export default async function CryptoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CryptoDetailClient id={id} />
}
