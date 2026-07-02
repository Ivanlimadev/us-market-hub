export async function GET() {
  return new Response('google.com, pub-7113858977365190, DIRECT, f08c47fec0942fa0\n', {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
