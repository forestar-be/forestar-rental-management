# Redux Implementation

This directory contains the implementation of Redux Toolkit for state management in the application.

## Directory Structure

- `index.ts` - Main Redux store configuration
- `hooks.ts` - Custom hooks for using Redux with TypeScript
- `initializer.ts` - Component that initializes Redux data on application startup
- `slices/` - Redux Toolkit slices for different parts of the application state
  - `emailsSlice.ts` - Manages the known emails state
  - `machineRentedSlice.ts` - Manages the machine rented list
  - `machineRentalSlice.ts` - Manages the machine rental list
  - `configSlice.ts` - Manages the configuration data

## Migration from GlobalDataContext

The application previously used a context-based state management approach with `GlobalDataContext`. This has been completely replaced with Redux Toolkit to provide better state management capabilities:

- Predictable state updates
- Improved debugging with Redux DevTools
- Better performance with selective re-rendering
- Better code organization with slices

### Usage

Components use the typed hooks for type-safe access to the Redux store:

```tsx
// Use the typed hooks
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchKnownEmails } from '../store/slices/emailsSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { knownEmails } = useAppSelector((state) => state.emails);

  useEffect(() => {
    dispatch(fetchKnownEmails(token));
  }, [dispatch, token]);

  return (
    // ...
  );
}
```

## Data Initialization

Data is initialized when the application starts using the `StoreInitializer` component in `App.tsx`. This ensures that all required data is loaded without having to fetch it in each individual component.

## Slices

Each slice represents a separate part of the application state:

1. **Emails Slice**: Manages the list of known emails.
2. **Machine Rented Slice**: Manages the list of machines available for rent.
3. **Machine Rental Slice**: Manages the list of active rentals.
4. **Config Slice**: Manages application configuration.

Each slice defines:

- The state structure
- Reducers for state updates
- Async thunks for API interactions
- Selectors for accessing data
