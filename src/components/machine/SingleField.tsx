import React, { useEffect } from 'react';
import { Grid, TextField, Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/fr';
import EditEmailsGuestFields from '../EditEmailsGuestFields';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  label: string;
  name: string;
  value: string | Date | number | null;
  valueType: 'text' | 'date' | 'number' | 'guest_email_list';
  isMultiline?: boolean;
  isEditing: boolean;
  handleChange: (value: string | Date | number | null, name: string) => void;
  xs?: 6 | 12 | 3;
  required?: boolean;
  emails?: string[];
  errorsEmails?: string[];
  touchedEmails?: boolean;
  lastIndexEmail?: number;
  handleEditEmailGuestByIndex?: (value: string, index: number) => void;
  handleAddEmailGuest?: (value: string) => void;
  handleRemoveEmailGuest?: (value: string) => void;
}

const DatePickerField: React.FC<Props> = ({
  label,
  name,
  value,
  handleChange,
  required,
}) => (
  <DatePicker
    timezone={'Europe/Paris'}
    sx={{ margin: '5px 0' }}
    label={label}
    format={'DD/MM/YYYY'}
    value={value ? dayjs(value) : null}
    onChange={(date) => handleChange(date?.toDate() ?? new Date(), name)}
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
);

const TextFieldComponent: React.FC<Props> = ({
  label,
  name,
  value,
  handleChange,
  isMultiline,
  valueType,
  required,
}) => (
  <TextField
    sx={{ margin: '5px 0' }}
    fullWidth
    label={label}
    required={required}
    name={name}
    value={value || ''}
    onChange={(e) =>
      handleChange(
        valueType === 'number' ? Number(e.target.value) : e.target.value,
        name,
      )
    }
    multiline={isMultiline}
    slotProps={{
      htmlInput: {
        min: valueType === 'number' ? 0 : undefined,
      },
    }}
    rows={isMultiline ? 4 : 1}
    type={valueType === 'number' ? 'number' : 'text'}
  />
);

const SingleField: React.FC<Props> = ({
  label,
  name,
  value,
  isMultiline = false,
  isEditing,
  handleChange,
  xs,
  valueType,
  required,
  emails,
  errorsEmails,
  touchedEmails,
  lastIndexEmail,
  handleEditEmailGuestByIndex,
  handleAddEmailGuest,
  handleRemoveEmailGuest,
}) => {
  useEffect(() => {
    if (
      valueType === 'guest_email_list' &&
      (!emails ||
        !handleAddEmailGuest ||
        !handleEditEmailGuestByIndex ||
        !handleRemoveEmailGuest)
    ) {
      throw new Error(
        'Emails fields are required for guest_email_list valueType',
      );
    }
  }, [valueType]);

  return (
    <Grid item xs={(xs ?? isMultiline) ? 12 : 6}>
      {isEditing ? (
        valueType === 'date' ? (
          <DatePickerField
            label={label}
            name={name}
            value={value}
            handleChange={handleChange}
            required={required}
            isEditing={isEditing}
            isMultiline={isMultiline}
            valueType={valueType}
            xs={xs}
            handleAddEmailGuest={handleAddEmailGuest}
            handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
            handleRemoveEmailGuest={handleRemoveEmailGuest}
            emails={emails}
            errorsEmails={errorsEmails}
            touchedEmails={touchedEmails}
            lastIndexEmail={lastIndexEmail}
          />
        ) : valueType === 'guest_email_list' ? (
          <EditEmailsGuestFields
            values={emails!}
            errors={errorsEmails}
            touched={touchedEmails}
            lastIndex={lastIndexEmail!}
            onChange={(e) =>
              handleEditEmailGuestByIndex!(e.target.value, lastIndexEmail!)
            }
            onClickAddGuest={() => handleAddEmailGuest!('')}
            handleEditGuestByIndex={handleEditEmailGuestByIndex!}
            handleRemoveGuest={handleRemoveEmailGuest!}
          />
        ) : (
          <TextFieldComponent
            label={label}
            name={name}
            value={value}
            handleChange={handleChange}
            isMultiline={isMultiline}
            valueType={valueType}
            required={required}
            isEditing={isEditing}
            xs={xs}
            handleAddEmailGuest={handleAddEmailGuest}
            handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
            handleRemoveEmailGuest={handleRemoveEmailGuest}
            emails={emails}
            errorsEmails={errorsEmails}
            touchedEmails={touchedEmails}
            lastIndexEmail={lastIndexEmail}
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
};

export default SingleField;
