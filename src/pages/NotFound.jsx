import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header/Header';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <Header title="Page Not Found" />
      <div style={{
        padding: 'var(--space-12)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}>
        <h2 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-bold)' }}>
          404
        </h2>
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
          The page you are looking for does not exist.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-accent)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <ArrowLeft size={16} /> Go to Dashboard
        </button>
      </div>
    </>
  );
}
