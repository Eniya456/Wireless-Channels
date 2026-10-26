import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { MethodologyPage } from '../pages/MethodologyPage';

describe('Frontend UI Components', () => {
  it('renders Badge component with correct text and styling', () => {
    render(<Badge type="modulation" value="BPSK" />);
    expect(screen.getByText('BPSK')).toBeInTheDocument();

    render(<Badge type="quality" value="Good" />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('renders MetricCard component correctly', () => {
    render(
      <MetricCard
        title="Bit Error Rate"
        value="0.0012"
        unit="errors"
        subtitle="Test benchmark"
      />
    );
    expect(screen.getByText('Bit Error Rate')).toBeInTheDocument();
    expect(screen.getByText('0.0012')).toBeInTheDocument();
    expect(screen.getByText('errors')).toBeInTheDocument();
    expect(screen.getByText('Test benchmark')).toBeInTheDocument();
  });

  it('renders MethodologyPage with textbook citations and formulas', () => {
    render(<MethodologyPage />);
    expect(screen.getByText(/Theoretical Foundations and Mathematical Models/i)).toBeInTheDocument();
    expect(screen.getByText(/John G. Proakis/i)).toBeInTheDocument();
    expect(screen.getByText(/Theodore S. Rappaport/i)).toBeInTheDocument();
  });
});
