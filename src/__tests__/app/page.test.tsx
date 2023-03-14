import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from '@/app/page';

// !FIXME Write proper tests
describe('Home', () => {
  it('1. Should render a heading', () => {
    render(<App />);

    const heading = screen.getByRole('heading', {
      name: /Hello, World!/,
    });

    expect(heading).toBeInTheDocument();
  });
  it('2. Should render unchanged', () => {
    const { container } = render(<App />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <main>
          <h1
            class="text-xl font-semibold"
          >
            Hello, World!
          </h1>
        </main>
      </div>
    `);
  });
});
