# forestar-rental-management

## License - All rights reserved

This software is licensed under a restricted license. Permission is only granted to Joel Yernault & Charles HL (@Charles-HL) to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software. All other individuals or entities are explicitly prohibited from using, copying, modifying, merging, publishing, distributing, sublicensing, and/or selling copies of the software, unless they receive prior written consent from the copyright holder.

Unauthorized use of the software is strictly prohibited. For more details, please refer to the [LICENSE](LICENSE) file.

## Using Redux

### State Management with Redux Toolkit

The application uses Redux Toolkit for state management. Each feature has its own slice in the `src/store/slices` directory:

- `emailsSlice.ts`: Manages email data
- `machineRentedSlice.ts`: Manages data for machines that can be rented
- `machineRentalSlice.ts`: Manages data for current machine rentals
- `configSlice.ts`: Manages application configuration

### Selectors

The application uses selectors to access data from the Redux store. Selectors are defined in the `src/store/selectors` directory:

- `emailsSelectors.ts`: Selectors for email data
- `machineRentedSelectors.ts`: Selectors for machines that can be rented
- `machineRentalSelectors.ts`: Selectors for current machine rentals
- `configSelectors.ts`: Selectors for application configuration

Using selectors helps maintain a clean separation between the Redux store structure and components. When the state structure changes, you only need to update the selector instead of every component that uses that state.

Example usage:

```tsx
// Import selectors
import { getKnownEmails } from '../store/selectors';

// Use in a component
const EmailList = () => {
  const emails = useAppSelector(getKnownEmails);

  return (
    <ul>
      {emails.map((email) => (
        <li key={email.id}>{email.address}</li>
      ))}
    </ul>
  );
};
```

### Data Loading

Data is loaded using the `StoreInitializer` component in `src/store/initializer.ts`. This component dispatches actions to load data when the application starts.
