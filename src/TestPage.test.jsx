import React from 'react';
import { render, screen } from '@testing-library/react';
import TestPage from './TestPage';

jest.mock('./AuthContext.js', () => ({
  useAuth: () => ({
    authState: {
      isAuthenticated: true,
      user: { role: 'user' },
    },
  }),
}));

describe('TestPage', () => {
  it('renders without crashing', () => {
    render(<TestPage />);
    expect(screen.getByText('Loading test...')).toBeInTheDocument();
  });
});
