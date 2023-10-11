import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from '@/app/page';

describe('Home', () => {
  it('1. Should render the apps heading', () => {
    render(<App />);

    const heading = screen.getByRole('heading', {
      name: /Welcome! :D/,
    });

    expect(heading).toBeInTheDocument();
  });
  it('2. Should render unchanged', () => {
    const { container } = render(<App />);
    expect(container).toMatchInlineSnapshot(`
<div>
  <h1>
    Welcome! :D
  </h1>
</div>
`);
  });
});
