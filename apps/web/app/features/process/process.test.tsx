import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProcessSteps } from './ProcessSteps';

describe('ProcessSteps', () => {
  it('muestra los pasos numerados en el orden configurado', () => {
    render(
      <ProcessSteps
        steps={[
          { order: 1, title: 'Contacto', description: 'a' },
          { order: 2, title: 'Visita', description: 'b' },
          { order: 3, title: 'Presupuesto', description: 'c' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      '01Contactoa',
      '02Visitab',
      '03Presupuestoc',
    ]);
  });
});
