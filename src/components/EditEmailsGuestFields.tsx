import { Box, Button, IconButton, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';

const EditEmailsGuestFields = ({
  values,
  errors,
  touched,
  lastIndex,
  onChange,
  onClickAddGuest,
  handleEditGuestByIndex,
  handleRemoveGuest,
}: {
  values: string[];
  errors: string | string[] | undefined;
  touched: boolean | undefined;
  lastIndex: number;
  onChange: (e: any) => void;
  onClickAddGuest: () => void;
  handleEditGuestByIndex: (value: string, index: number) => void;
  handleRemoveGuest: (guest: string) => void;
}) => (
  <Box sx={{ gridColumn: { md: 'span 2' } }}>
    <TextField
      margin="dense"
      name="guestEmail"
      label="Email des invités"
      type="email"
      fullWidth
      value={values[lastIndex] || ''}
      onChange={onChange}
      error={Boolean(touched && errors && errors[lastIndex])}
      helperText={touched && errors && errors[lastIndex]}
    />
    <Button
      variant="contained"
      color="primary"
      onClick={onClickAddGuest}
      startIcon={<AddIcon />}
      sx={{ mt: 1 }}
    >
      Ajouter un invité
    </Button>
    <Box sx={{ mt: 2 }}>
      {values.map(
        (guest, index) =>
          index !== lastIndex && (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <TextField
                margin="dense"
                value={guest}
                fullWidth
                onChange={(e) => handleEditGuestByIndex(e.target.value, index)}
                error={Boolean(touched && errors && errors[index])}
                helperText={touched && errors && errors[index]}
              />
              <IconButton
                color="secondary"
                onClick={() => handleRemoveGuest(guest)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ),
      )}
    </Box>
  </Box>
);

export default EditEmailsGuestFields;
