import { MachineRentalToCreate, MachineRentedWithImage } from '../utils/types';
import {
  FieldConfig,
  FieldHelperProps,
  FieldInputProps,
  FieldMetaProps,
  FormikErrors,
  FormikState,
  FormikTouched,
} from 'formik';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import EditEmailsGuestFields from './EditEmailsGuestFields';
import { formatPriceNumberToFrenchFormatStr } from '../utils/common.utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const CreateRentalDialog = (props: {
  selectedMachine: MachineRentedWithImage | null;
  open: boolean;
  onClose: () => void;
  loadingCreate: boolean;
  formik: {
    initialValues: MachineRentalToCreate;
    initialErrors: FormikErrors<unknown>;
    initialTouched: FormikTouched<unknown>;
    initialStatus: any;
    handleBlur: {
      (e: React.FocusEvent<any, Element>): void;
      <T = any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
    };
    handleChange: {
      (e: React.ChangeEvent<any>): void;
      <T_1 = string | React.ChangeEvent<any>>(
        field: T_1,
      ): T_1 extends React.ChangeEvent<any>
        ? void
        : (e: string | React.ChangeEvent<any>) => void;
    };
    handleReset: (e: any) => void;
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    resetForm: (
      nextState?: Partial<FormikState<MachineRentalToCreate>>,
    ) => void;
    setErrors: (errors: FormikErrors<MachineRentalToCreate>) => void;
    setFormikState: (
      stateOrCb:
        | FormikState<MachineRentalToCreate>
        | ((
            state: FormikState<MachineRentalToCreate>,
          ) => FormikState<MachineRentalToCreate>),
    ) => void;
    setFieldTouched: (
      field: string,
      touched?: boolean,
      shouldValidate?: boolean,
    ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
    setFieldError: (field: string, value: string | undefined) => void;
    setStatus: (status: any) => void;
    setSubmitting: (isSubmitting: boolean) => void;
    setTouched: (
      touched: FormikTouched<MachineRentalToCreate>,
      shouldValidate?: boolean,
    ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
    setValues: (
      values: React.SetStateAction<MachineRentalToCreate>,
      shouldValidate?: boolean,
    ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
    submitForm: () => Promise<any>;
    validateForm: (
      values?: MachineRentalToCreate,
    ) => Promise<FormikErrors<MachineRentalToCreate>>;
    validateField: (
      name: string,
    ) => Promise<void> | Promise<string | undefined>;
    isValid: boolean;
    dirty: boolean;
    unregisterField: (name: string) => void;
    registerField: (name: string, { validate }: any) => void;
    getFieldProps: (
      nameOrOptions: string | FieldConfig<any>,
    ) => FieldInputProps<any>;
    getFieldMeta: (name: string) => FieldMetaProps<any>;
    getFieldHelpers: (name: string) => FieldHelperProps<any>;
    validateOnBlur: boolean;
    validateOnChange: boolean;
    validateOnMount: boolean;
    values: MachineRentalToCreate;
    errors: FormikErrors<MachineRentalToCreate>;
    touched: FormikTouched<MachineRentalToCreate>;
    isSubmitting: boolean;
    isValidating: boolean;
    status?: any;
    submitCount: number;
  };
  onChangeRentalDate: (
    date: dayjs.Dayjs | null,
  ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
  onChangeReturnDate: (
    date: dayjs.Dayjs | null,
  ) => Promise<FormikErrors<MachineRentalToCreate>> | Promise<void>;
}) => {
  const handleAddGuest = useCallback(
    (email: string) => {
      if (!props.formik.values.guests.includes(email)) {
        props.formik.setFieldValue('guests', [
          ...props.formik.values.guests,
          email,
        ]);
      }
    },
    [props.formik],
  );

  const handleRemoveGuest = useCallback(
    (email: string) => {
      props.formik.setFieldValue(
        'guests',
        props.formik.values.guests.filter((guest) => guest !== email),
      );
    },
    [props.formik],
  );

  const handleEditGuestByIndex = useCallback(
    (email: string, index: number) => {
      if (index === -1 || index >= props.formik.values.guests.length) {
        handleAddGuest(email);
        return;
      }
      props.formik.setFieldValue(
        'guests',
        props.formik.values.guests.map((guest, i) =>
          i === index ? email : guest,
        ),
      );
    },
    [props.formik],
  );

  const lastIndex = useMemo(
    () => props.formik.values.guests.length - 1,
    [props.formik.values.guests],
  );

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Créer une nouvelle location pour la machine{' '}
        {props.selectedMachine?.name}
      </DialogTitle>
      <DialogContent>
        {props.selectedMachine && (
          <Typography variant="subtitle1" sx={{ marginBottom: 2 }}>
            Dépôt de garantie :{' '}
            {formatPriceNumberToFrenchFormatStr(props.selectedMachine.deposit)}
          </Typography>
        )}
        {props.loadingCreate && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <CircularProgress size={48} color="primary" />
          </Box>
        )}
        <form onSubmit={props.formik.handleSubmit}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr', // Single column for smaller screens (tablet)
                sm: '1fr', // Single column for tablets
                md: '1fr 1fr', // Two columns for desktops
              },
              gap: 2,
            }}
          >
            <TextField
              autoFocus
              margin="dense"
              name="clientFirstName"
              label="Prénom"
              type="text"
              fullWidth
              value={props.formik.values.clientFirstName}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientFirstName &&
                Boolean(props.formik.errors.clientFirstName)
              }
              helperText={
                props.formik.touched.clientFirstName &&
                props.formik.errors.clientFirstName
              }
            />
            <TextField
              margin="dense"
              name="clientLastName"
              label="Nom"
              type="text"
              fullWidth
              value={props.formik.values.clientLastName}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientLastName &&
                Boolean(props.formik.errors.clientLastName)
              }
              helperText={
                props.formik.touched.clientLastName &&
                props.formik.errors.clientLastName
              }
            />
            <TextField
              margin="dense"
              name="clientPhone"
              label="Téléphone"
              type="text"
              fullWidth
              value={props.formik.values.clientPhone}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientPhone &&
                Boolean(props.formik.errors.clientPhone)
              }
              helperText={
                props.formik.touched.clientPhone &&
                props.formik.errors.clientPhone
              }
            />
            <TextField
              margin="dense"
              name="clientEmail"
              label="Email"
              type="email"
              fullWidth
              value={props.formik.values.clientEmail}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientEmail &&
                Boolean(props.formik.errors.clientEmail)
              }
              helperText={
                props.formik.touched.clientEmail &&
                props.formik.errors.clientEmail
              }
            />
            <TextField
              margin="dense"
              name="clientAddress"
              label="Adresse"
              type="text"
              fullWidth
              sx={{ gridColumn: { md: 'span 2' } }}
              value={props.formik.values.clientAddress}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientAddress &&
                Boolean(props.formik.errors.clientAddress)
              }
              helperText={
                props.formik.touched.clientAddress &&
                props.formik.errors.clientAddress
              }
            />
            <TextField
              margin="dense"
              name="clientPostal"
              label="Code postal"
              type="text"
              fullWidth
              value={props.formik.values.clientPostal}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientPostal &&
                Boolean(props.formik.errors.clientPostal)
              }
              helperText={
                props.formik.touched.clientPostal &&
                props.formik.errors.clientPostal
              }
            />
            <TextField
              margin="dense"
              name="clientCity"
              label="Ville"
              type="text"
              fullWidth
              value={props.formik.values.clientCity}
              onChange={props.formik.handleChange}
              error={
                props.formik.touched.clientCity &&
                Boolean(props.formik.errors.clientCity)
              }
              helperText={
                props.formik.touched.clientCity &&
                props.formik.errors.clientCity
              }
            />
            <DatePicker
              timezone={'Europe/Paris'}
              label="Date de location"
              format={'DD/MM/YYYY'}
              value={
                props.formik.values.rentalDate
                  ? dayjs(props.formik.values.rentalDate)
                  : null
              }
              onChange={props.onChangeRentalDate}
              slotProps={{
                textField: {
                  margin: 'dense',
                  fullWidth: true,
                  error:
                    props.formik.touched.rentalDate &&
                    Boolean(props.formik.errors.rentalDate),
                  helperText:
                    props.formik.touched.rentalDate &&
                    props.formik.errors.rentalDate
                      ? String(props.formik.errors.rentalDate)
                      : null,
                },
              }}
            />
            <DatePicker
              timezone={'Europe/Paris'}
              label="Date de retour"
              value={
                props.formik.values.returnDate
                  ? dayjs(props.formik.values.returnDate)
                  : null
              }
              onChange={props.onChangeReturnDate}
              slotProps={{
                textField: {
                  margin: 'dense',
                  fullWidth: true,
                  error:
                    props.formik.touched.returnDate &&
                    Boolean(props.formik.errors.returnDate),
                  helperText:
                    props.formik.touched.returnDate &&
                    props.formik.errors.returnDate
                      ? String(props.formik.errors.returnDate)
                      : null,
                },
              }}
            />
            <EditEmailsGuestFields
              values={props.formik.values.guests}
              errors={props.formik.errors.guests as string[]}
              touched={props.formik.touched.guests as unknown as boolean[]}
              lastIndex={lastIndex}
              onChange={(e) =>
                handleEditGuestByIndex(e.target.value, lastIndex)
              }
              onClickAddGuest={() => handleAddGuest('')}
              handleEditGuestByIndex={handleEditGuestByIndex}
              handleRemoveGuest={handleRemoveGuest}
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="with_shipping"
                  checked={props.formik.values.with_shipping || false}
                  onChange={props.formik.handleChange}
                />
              }
              label="Avec livraison"
              sx={{ alignSelf: 'flex-start' }}
            />
          </Box>
          <DialogActions>
            <Button onClick={props.onClose} color="secondary">
              Annuler
            </Button>
            <Button type="submit" color="primary">
              Créer
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRentalDialog;
