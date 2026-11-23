import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 600, height: 220 }}>{children}</div>
    ),
  };
});

describe('PranaShield App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Force clean offline/fallback path for AI endpoints during unit tests
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network disabled in unit test'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders PranaShield branding with Delhi default AQI, verdict, and Smog-to-Cigarette equivalent', async () => {
    render(<App />);

    expect(screen.getByText('PranaShield')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delhi' })).toBeInTheDocument();
    expect(screen.getAllByText('386').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('AVOID')).toBeInTheDocument();

    // Delhi PM2.5 is 234 µg/m³ -> 234 / 22 = 10.6 cigarettes/day
    expect(screen.getByText('10.6')).toBeInTheDocument();
    expect(screen.getByText(/Berkeley Earth standard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('✨ AI Personalized Plan Ready')).toBeInTheDocument();
    });
  });

  it('updates live AQI, safety verdict, and Smog-to-Cigarette meter when switching cities', async () => {
    render(<App />);

    const mumbaiBtn = screen.getByRole('button', { name: /Mumbai/i });
    fireEvent.click(mumbaiBtn);

    expect(screen.getByRole('heading', { name: 'Mumbai' })).toBeInTheDocument();
    expect(screen.getAllByText('138').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CAUTION')).toBeInTheDocument();

    // Mumbai PM2.5 is 56 µg/m³ -> 56 / 22 = 2.5 cigarettes/day
    expect(screen.getByText('2.5')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('✨ AI Personalized Plan Ready')).toBeInTheDocument();
      expect(screen.getAllByText(/Mumbai · AQI 138/i).length).toBeGreaterThanOrEqual(1);
    });

    // Switch to Gurugram (AQI 288, LIMIT, PM2.5 148 -> 6.7 cigarettes/day)
    const gurugramBtn = screen.getByRole('button', { name: /Gurugram/i });
    fireEvent.click(gurugramBtn);

    expect(screen.getByRole('heading', { name: 'Gurugram' })).toBeInTheDocument();
    expect(screen.getAllByText('288').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LIMIT')).toBeInTheDocument();
    expect(screen.getByText('6.7')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('✨ AI Personalized Plan Ready')).toBeInTheDocument();
      expect(screen.getAllByText(/Gurugram · AQI 288/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('toggles bilingual English and Hindi rendering across all sections', async () => {
    render(<App />);

    expect(screen.getByText('Live City AQI & Safety Verdict')).toBeInTheDocument();
    expect(screen.getByText('Ask PranaShield Indoor AI')).toBeInTheDocument();

    const hindiToggle = screen.getByRole('button', { name: 'हिन्दी' });
    fireEvent.click(hindiToggle);

    expect(screen.getByText('लाइव शहर AQI और सुरक्षा सलाह')).toBeInTheDocument();
    expect(screen.getByText('स्मॉग-से-सिगरेट समतुल्य और फेफड़ों पर असर मीटर')).toBeInTheDocument();
    expect(screen.getByText('प्राणशील्ड इंडोर AI से पूछें')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'दिल्ली' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('✨ AI व्यक्तिगत सुरक्षा योजना तैयार')).toBeInTheDocument();
    });

    const englishToggle = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(englishToggle);

    expect(screen.getByText('Live City AQI & Safety Verdict')).toBeInTheDocument();
    expect(screen.getByText('Ask PranaShield Indoor AI')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('✨ AI Personalized Plan Ready')).toBeInTheDocument();
    });
  });

  it('reveals 3 AI clean-air safe haven micro-zones when clicking Find Nearest Clean-Air Zones', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('✨ AI Personalized Plan Ready')).toBeInTheDocument();
    });

    const findBtn = screen.getAllByRole('button', { name: /Find Nearest Clean-Air Zones/i })[0];
    fireEvent.click(findBtn);

    await waitFor(() => {
      expect(screen.getByText('Sanjay Van Urban Forest')).toBeInTheDocument();
      expect(screen.getByText('Lodhi Garden Botanical Canopy')).toBeInTheDocument();
      expect(screen.getByText('India Habitat Centre / HEPA Reading Wing')).toBeInTheDocument();
    });

    expect(screen.getByText('-38% PM2.5')).toBeInTheDocument();
    expect(screen.getByText('-32% PM2.5')).toBeInTheDocument();
    expect(screen.getByText('-68% PM2.5')).toBeInTheDocument();
  });
});
