import React from 'react';
import { Grid, TextField, Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

interface SingleMachineFieldProps {
  label: string;
  name: string;
  value: string | Date | number | null;
  valueType: 'text' | 'date' | 'number';
  isMultiline?: boolean;
  isEditing: boolean;
  handleChange: (value: string | Date | number | null, name: string) => void;
  xs?: 6 | 12 | 3;
  required?: boolean;
}

const SingleMachineField: React.FC<SingleMachineFieldProps> = ({
  label,
  name,
  value,
  isMultiline = false,
  isEditing,
  handleChange,
  xs,
  valueType,
  required,
}) => (
  <Grid item xs={(xs ?? isMultiline) ? 12 : 6}>
    {isEditing ? (
      valueType === 'date' ? (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'fr'}>
          <DatePicker
            // disablePast={true}
            label={label}
            format={'DD/MM/YYYY'}
            value={value ? dayjs(value) : null}
            onChange={(date) =>
              handleChange(date?.toDate() ?? new Date(), name)
            }
            slotProps={{
              textField: {
                id: `field-${label}`,
                name: label,
                required: required,
                fullWidth: true,
                inputProps: {
                  'aria-describedby': `${label}-error`,
                  'aria-required': required,
                },
              },
            }}
          />
        </LocalizationProvider>
      ) : (
        <TextField
          sx={{ margin: '5px 0' }}
          fullWidth
          label={label}
          required={required}
          name={name}
          value={value || ''}
          onChange={(e) => {
            handleChange(
              valueType === 'number' ? Number(e.target.value) : e.target.value,
              name,
            );
          }}
          multiline={isMultiline}
          slotProps={{
            htmlInput: {
              min: valueType === 'number' ? 0 : undefined,
            },
          }}
          rows={isMultiline ? 4 : 1}
          type={valueType === 'number' ? 'number' : 'text'}
        />
      )
    ) : (
      <Box
        display={'flex'}
        flexDirection={isMultiline ? 'column' : 'row'}
        gap={isMultiline ? '0' : '10px'}
        margin={'5px 0'}
      >
        <Typography variant="subtitle1" noWrap>
          {label} :
        </Typography>
        <Typography variant="subtitle1" sx={{ overflowWrap: 'break-word' }}>
          {valueType === 'date' && value
            ? new Date(String(value)).toLocaleDateString('fr-Fr')
            : value
              ? String(value)
              : '-'}
        </Typography>
      </Box>
    )}
  </Grid>
);

export default SingleMachineField;
