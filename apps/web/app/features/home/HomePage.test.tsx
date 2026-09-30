import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@tamila/ui';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('muestra el título y carga la galería bajo demanda', async () => {
    render(
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { name: 'TAMILA' })).toBeInTheDocument();
    expect(screen.queryByTestId('showcase')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver galería' }));
    expect(await screen.findByTestId('showcase')).toBeInTheDocument();
  });
});
