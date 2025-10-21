import { ImageResponse } from 'next/og';

export const size = {
  width: 192,
  height: 192,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #312e81)',
          color: '#f8fafc',
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: '-0.08em',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          textTransform: 'uppercase',
        }}
      >
        ToDo
      </div>
    ),
    {
      ...size,
    }
  );
}
