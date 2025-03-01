import React, { FC } from 'react';
import { Autocomplete, TextField, Box, Button } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { getKnownEmails } from '../store/selectors';
import { Helmet } from 'react-helmet-async';

interface EditEmailsGuestFieldsProps {
  values: string[];
  errors: string[] | undefined;
  touched: boolean[] | undefined;
  lastIndex: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClickAddGuest: () => void;
  handleEditGuestByIndex: (value: string, index: number) => void;
  handleRemoveGuest: (guest: string) => void;
  size?: 'small' | 'medium';
}

const EditEmailsGuestFields: FC<EditEmailsGuestFieldsProps> = ({
  values,
  errors,
  touched,
  lastIndex,
  onChange,
  onClickAddGuest,
  handleEditGuestByIndex,
  handleRemoveGuest,
  size,
}) => {
  const knownEmails = useAppSelector(getKnownEmails);

  return (
    <Box>
      <Autocomplete
        options={knownEmails || []}
        freeSolo
        clearOnBlur={false}
        value={values[lastIndex] || ''}
        inputValue={values[lastIndex] || ''}
        onInputChange={(_event, newInputValue, reason) => {
          if (reason === 'input') {
            handleEditGuestByIndex(newInputValue, lastIndex);
          }
        }}
        onChange={(_event, newValue) => {
          if (typeof newValue === 'string') {
            handleEditGuestByIndex(newValue, lastIndex);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Ajouter un invité"
            size={size}
            error={touched?.[lastIndex] && Boolean(errors?.[lastIndex])}
            helperText={
              touched?.[lastIndex] && errors?.[lastIndex]
                ? String(errors?.[lastIndex])
                : ''
            }
          />
        )}
      />
      {values.map((email, index) => {
        if (index === lastIndex) return null;
        return (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
          >
            <TextField
              fullWidth
              margin="dense"
              label={`Email de l'invité ${index + 1}`}
              value={email}
              onChange={(e) => handleEditGuestByIndex(e.target.value, index)}
              error={touched?.[index] && Boolean(errors?.[index])}
              helperText={
                touched?.[index] && errors?.[index]
                  ? String(errors?.[index])
                  : ''
              }
              size={size}
            />
            <Button
              onClick={() => handleRemoveGuest(email)}
              color="secondary"
              sx={{ ml: 1 }}
              size={size}
            >
              Supprimer
            </Button>
          </Box>
        );
      })}
      <Button
        onClick={onClickAddGuest}
        variant="outlined"
        sx={{ mt: size === 'small' ? 1 : 2 }}
        size={size}
      >
        Ajouter un invité
      </Button>
    </Box>
  );
};

export default EditEmailsGuestFields;
