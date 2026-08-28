import '@testing-library/jest-dom';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import EditEmailsGuestFields from './EditEmailsGuestFields';
import {
  DELIVERY_GUEST_TOOLTIP,
  getDeliveryGuestDisplay,
} from '../utils/rentalGuests.util';

const store = configureStore({
  reducer: {
    emails: () => ({
      knownEmails: ['known@example.com', 'driver@example.com'],
      loading: false,
      error: null,
    }),
  },
});

const renderFields = (
  values = ['manual@example.com'],
  edit = jest.fn(),
  remove = jest.fn(),
) => {
  const deliveryGuest = getDeliveryGuestDisplay(true, 'driver@example.com');
  render(
    <Provider store={store}>
      <EditEmailsGuestFields
        values={values}
        errors={[]}
        touched={[]}
        handleEditGuestByIndex={edit}
        handleRemoveGuest={remove}
        readOnlyGuests={deliveryGuest.readOnlyGuests}
      />
    </Provider>,
  );
  return { edit, remove };
};

test('renders the delivery guest read-only with its tooltip and no delete action', async () => {
  const user = userEvent.setup();
  renderFields();

  const deliveryInput = screen.getByLabelText("Email de l'invité livreur");
  expect(deliveryInput).toHaveAttribute('readonly');
  expect(screen.queryByLabelText('Supprimer driver@example.com')).toBeNull();

  await user.hover(screen.getByTestId('read-only-guest'));
  expect(await screen.findByText(DELIVERY_GUEST_TOOLTIP)).toBeInTheDocument();
});

test('keeps manual guests editable and removable', () => {
  const { edit, remove } = renderFields();
  const manualInput = screen.getByLabelText("Email de l'invité 1");

  fireEvent.change(manualInput, { target: { value: 'edited@example.com' } });
  expect(edit).toHaveBeenCalledWith('edited@example.com', 0);

  fireEvent.click(screen.getByLabelText('Supprimer manual@example.com'));
  expect(remove).toHaveBeenCalledWith('manual@example.com');
});

test('shows a legacy manual occurrence only once as the read-only delivery guest', () => {
  renderFields(['DRIVER@example.com', 'manual@example.com']);

  expect(screen.getAllByDisplayValue(/driver@example.com/i)).toHaveLength(1);
  expect(screen.queryByLabelText('Supprimer DRIVER@example.com')).toBeNull();
});

test('does not expose a delivery guest when shipping is disabled', () => {
  expect(getDeliveryGuestDisplay(false, 'driver@example.com')).toEqual({
    readOnlyGuests: [],
  });
  expect(getDeliveryGuestDisplay(true, null)).toEqual({
    readOnlyGuests: [],
    warning: 'Email livreur non configuré',
  });
  expect(getDeliveryGuestDisplay(true, null, true)).toEqual({
    readOnlyGuests: [],
  });
});
