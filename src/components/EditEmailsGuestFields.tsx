import React, { FC } from 'react';
import { Autocomplete, TextField, Box, Button } from '@mui/material';
import { useGlobalData } from '../contexts/GlobalDataContext';

interface EditEmailsGuestFieldsProps {
  values: string[];
  errors: string | string[] | undefined;
  touched: boolean | undefined;
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
  const { knownEmails } = useGlobalData();

  return (
    <Box>
      <Autocomplete
        options={knownEmails || []}
        freeSolo
        clearOnBlur={false}
        filterOptions={(options, state) =>
          options.filter((option) =>
            option
              .toLowerCase()
              .includes(String(values[lastIndex]).toLowerCase()),
          )
        }
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
          <TextField {...params} label="Ajouter un invité" size={size} />
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
              error={touched && Boolean(errors)}
              helperText={touched && errors ? String(errors) : ''}
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
