import React, { FC, useMemo, useState } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppSelector } from '../store/hooks';
import { getKnownEmails } from '../store/selectors';

interface EditEmailsGuestFieldsProps {
  values: string[];
  errors: string[] | undefined;
  touched: boolean[] | undefined;
  handleEditGuestByIndex: (value: string, index: number) => void;
  handleRemoveGuest: (guest: string) => void;
  size?: 'small' | 'medium';
}

const EditEmailsGuestFields: FC<EditEmailsGuestFieldsProps> = ({
  values,
  errors,
  touched,
  handleEditGuestByIndex,
  handleRemoveGuest,
  size,
}) => {
  const knownEmails = useAppSelector(getKnownEmails);
  const [inputValue, setInputValue] = useState('');
  const availableEmails = useMemo(
    () => (knownEmails || []).filter((email) => !values.includes(email)),
    [knownEmails, values],
  );

  const addGuest = (email: string) => {
    const normalizedEmail = email.trim();
    if (normalizedEmail && !values.includes(normalizedEmail)) {
      handleEditGuestByIndex(normalizedEmail, values.length);
    }
    setInputValue('');
  };

  return (
    <Box>
      {values.map((email, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
      ))}
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
          <TextField
            {...params}
            label="Ajouter un invité"
            size={size}
          />
        )}
      />
    </Box>
  );
};

export default EditEmailsGuestFields;
