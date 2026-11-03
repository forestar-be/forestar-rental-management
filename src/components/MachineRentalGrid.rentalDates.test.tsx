import React from 'react';
import MachineRentalGrid from './MachineRentalGrid';
import { cleanup, render } from '@testing-library/react';
let mockColumns: any[] = [];
jest.mock('ag-grid-react', () => ({
  AgGridReact: require('react').forwardRef((props: any, _ref: any) => {
    mockColumns = props.columnDefs;
    return null;
  }),
}));
jest.mock('ag-grid-community/styles/ag-grid.css', () => ({}));
jest.mock('ag-grid-community/styles/ag-theme-quartz.css', () => ({}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

afterEach(cleanup);
test('actual grid column formatters preserve the selected rental day in every timezone', () => {
  render(<MachineRentalGrid rowData={[]} />);
  for (const field of ['rentalDate', 'returnDate']) {
    const formatter = mockColumns.find(
      (column) => column.field === field,
    )?.valueFormatter;
    expect(typeof formatter).toBe('function');
    expect(formatter({ value: '2026-11-04' })).toBe('04/11/2026');
    expect(formatter({ value: '2026-03-29' })).toBe('29/03/2026');
    expect(formatter({ value: null })).toBe('Non défini');
  }
});
