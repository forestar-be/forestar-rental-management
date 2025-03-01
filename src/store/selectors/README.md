# Redux Selectors

This directory contains reusable selector functions for accessing Redux state in a consistent way throughout the application.

## Why Use Selectors?

1. **Encapsulation**: Selectors hide the structure of the state, so components don't need to know about it
2. **Reusability**: The same selector can be used across multiple components
3. **Memoization**: Selectors can be memoized to prevent unnecessary re-renders
4. **Maintainability**: If the state structure changes, you only need to update the selector, not every component

## Available Selectors

### Emails Selectors

- `getKnownEmails`: Get the list of known emails
- `getEmailsLoading`: Get the loading state for emails
- `getEmailsError`: Get any error that occurred while fetching emails

### Machine Rented Selectors

- `getMachineRentedList`: Get the list of machines available for rent
- `getMachineRentedLoading`: Get the loading state for machine rented
- `getMachineRentedError`: Get any error that occurred while fetching machine rented
- `getMachineRentedById`: Get a specific machine by ID

### Machine Rental Selectors

- `getMachineRentalList`: Get the list of current machine rentals
- `getMachineRentalLoading`: Get the loading state for machine rentals
- `getMachineRentalError`: Get any error that occurred while fetching machine rentals
- `getMachineRentalById`: Get a specific rental by ID

### Config Selectors

- `getConfig`: Get the entire config
- `getConfigLoading`: Get the loading state for config
- `getConfigError`: Get any error that occurred while fetching config
- `getConfigByKey`: Get a specific config value by its key

## Usage Example

```tsx
// Before - accessing state directly:
const { knownEmails } = useAppSelector((state) => state.emails);

// After - using a selector:
import { getKnownEmails } from '../store/selectors';

const knownEmails = useAppSelector(getKnownEmails);
```

## Parameterized Selectors

Some selectors accept parameters, such as IDs:

```tsx
import { getMachineRentedById } from '../store/selectors';

// Use with an ID parameter
const machine = useAppSelector(getMachineRentedById(123));
```
