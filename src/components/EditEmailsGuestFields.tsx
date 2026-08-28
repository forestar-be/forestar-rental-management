import React, { FC, useMemo, useState } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  IconButton,
  Tooltip,
  InputAdornment,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAppSelector } from '../store/hooks';
import { getKnownEmails } from '../store/selectors';
import { ReadOnlyGuest } from '../utils/rentalGuests.util';

interface EditEmailsGuestFieldsProps {
  values: string[];
  errors: string[] | undefined;
  touched: boolean[] | undefined;
  handleEditGuestByIndex: (value: string, index: number) => void;
  handleRemoveGuest: (guest: string) => void;
  readOnlyGuests?: ReadOnlyGuest[];
  warning?: string;
  size?: 'small' | 'medium';
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const EditEmailsGuestFields: FC<EditEmailsGuestFieldsProps> = ({
  values,
  errors,
  touched,
  handleEditGuestByIndex,
  handleRemoveGuest,
  readOnlyGuests = [],
  warning,
  size,
}) => {
  const knownEmails = useAppSelector(getKnownEmails);
  const [inputValue, setInputValue] = useState('');
  const readOnlyEmailSet = useMemo(
    () => new Set(readOnlyGuests.map(({ email }) => normalizeEmail(email))),
    [readOnlyGuests],
  );
  const unavailableEmailSet = useMemo(
    () =>
      new Set([
        ...values.map(normalizeEmail),
        ...readOnlyGuests.map(({ email }) => normalizeEmail(email)),
      ]),
    [readOnlyGuests, values],
  );
  const availableEmails = useMemo(
    () =>
      (knownEmails || []).filter(
        (email) => !unavailableEmailSet.has(normalizeEmail(email)),
      ),
    [knownEmails, unavailableEmailSet],
  );

  const addGuest = (email: string) => {
    const normalizedEmail = email.trim();
    if (
      normalizedEmail &&
      !unavailableEmailSet.has(normalizeEmail(normalizedEmail))
    ) {
      handleEditGuestByIndex(normalizedEmail, values.length);
    }
    setInputValue('');
  };

  return (
    <Box>
      {values.map((email, index) =>
        readOnlyEmailSet.has(normalizeEmail(email)) ? null : (
          <Box
            key={`${email}-${index}`}
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <TextField
              fullWidth
              label={`Email de l'invité ${index + 1}`}
              value={email}
              onChange={(e) => handleEditGuestByIndex(e.target.value, index)}
              error={touched?.[index] && Boolean(errors?.[index])}
              helperText={
                touched?.[index] && errors?.[index] ? String(errors[index]) : ''
              }
              size={size}
            />
            <Tooltip title="Supprimer cet invité" arrow>
              <IconButton
                onClick={() => handleRemoveGuest(email)}
                color="error"
                sx={{ ml: 1 }}
                size={size}
                aria-label={`Supprimer ${email}`}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      )}
      {readOnlyGuests.map(({ email, tooltip }) => (
        <Tooltip key={normalizeEmail(email)} title={tooltip} arrow>
          <Box
            data-testid="read-only-guest"
            sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
          >
            <TextField
              fullWidth
              label="Email de l'invité livreur"
              value={email}
              size={size}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Tooltip>
      ))}
      {warning && (
        <Typography color="warning.main" variant="body2" sx={{ mb: 1 }}>
          {warning}
        </Typography>
      )}
      <Autocomplete
        options={availableEmails}
        freeSolo
        clearOnBlur={false}
        value={null}
        inputValue={inputValue}
        onInputChange={(_event, newInputValue, reason) => {
          if (reason === 'input' || reason === 'clear') {
            setInputValue(newInputValue);
          }
        }}
        onChange={(_event, newValue) => {
          if (typeof newValue === 'string') {
            addGuest(newValue);
          }
        }}
        renderInput={(params) => (
          <TextField {...params} label="Ajouter un invité" size={size} />
        )}
      />
    </Box>
  );
};

export default EditEmailsGuestFields;
