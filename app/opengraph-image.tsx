import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const gradientBackground =
  'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(49, 46, 129, 0.95))';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: gradientBackground,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            borderRadius: 48,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '2px solid rgba(148, 163, 184, 0.4)',
            boxShadow:
              '0 40px 80px rgba(15, 23, 42, 0.45), inset 0 0 30px rgba(99, 102, 241, 0.3)',
          }}
        >
          <span
            style={{
              color: '#c7d2fe',
              fontSize: 28,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
            }}
          >
            Todozz
          </span>
          <span
            style={{
              color: '#f8fafc',
              fontSize: 160,
              fontWeight: 800,
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              fontFamily: '"Inter", "Segoe UI", sans-serif',
            }}
          >
            ToDo
          </span>
          <span
            style={{
              color: '#e2e8f0',
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            Organize, prioritize, and conquer your tasks.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
