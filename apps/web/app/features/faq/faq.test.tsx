import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FaqAccordion } from './FaqAccordion';

describe('FaqAccordion', () => {
  it('expande la respuesta y anuncia el estado', async () => {
    render(<FaqAccordion faqs={[{ id: 'f1', question: '¿Tiene costo?', answer: 'No.' }]} />);
    const button = screen.getByRole('button', { name: '¿Tiene costo?' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: '¿Tiene costo?' })).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: '¿Tiene costo?' })).toHaveTextContent('No.');
  });

  it('se abre con el teclado', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion faqs={[{ id: 'f1', question: '¿Garantía?', answer: 'Sí.' }]} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '¿Garantía?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
