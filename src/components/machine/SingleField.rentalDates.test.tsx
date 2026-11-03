import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SingleField from './SingleField';

afterEach(cleanup);
test('editing a rental day emits a day string and clearing emits null', () => {
  const change = jest.fn();
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <SingleField
        label="Date de location"
        name="rentalDate"
        value="2026-11-04"
        valueType="date"
        isEditing
        handleChange={change}
      />
    </LocalizationProvider>,
  );
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: '05/11/2026' } });
  expect(change).toHaveBeenLastCalledWith('2026-11-05', 'rentalDate');
  fireEvent.change(input, { target: { value: '' } });
  expect(change).toHaveBeenLastCalledWith(null, 'rentalDate');
});
