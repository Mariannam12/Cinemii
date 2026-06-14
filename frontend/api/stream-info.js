// Vercel serverless stream-info (single function).
// Reached via a vercel.json rewrite from /api/stream/info/*. On the static
// Vercel deploy there is no Python backend, so this returns the bundled
// public-domain demo clip for every title.

export default function handler(req, res) {
  const p = (req.query.__p || '').replace(/^\/+/, '');
  const [mediaType = 'movie', mediaId = ''] = p.split('/');

  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).json({
    media_type: mediaType,
    media_id: String(mediaId),
    source: '/sample.mp4',
    mime_type: 'video/mp4',
    resume_seconds: 0,
    license: 'Big Buck Bunny — © Blender Foundation, CC-BY 3.0 (demo content)',
  });
}
