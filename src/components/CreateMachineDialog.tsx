import React, { useCallback, useMemo } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { MachineRentedCreated } from '../utils/types';
import { MuiFileInput } from 'mui-file-input';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import CloseIcon from '@mui/icons-material/Close';
import { MachineSelect } from './machine/MachineSelect';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import EditEmailsGuestFields from './EditEmailsGuestFields';
import { compressImage } from '../utils/common.utils';
import { notifyError } from '../utils/notifications';

dayjs.extend(utc);
dayjs.extend(timezone);

const validationSchema = yup.object({
  name: yup.string().required('Nom est requis'),
  maintenance_type: yup
    .string()
    .oneOf(['BY_DAY', 'BY_NB_RENTAL'], 'Type de maintenance invalide')
    .required('Type de maintenance est requis'),
  nb_day_before_maintenance: yup
    .number()
    .nullable()
    .min(1, 'Nb jours avant maintenance doit être supérieur à 0')
    .when('maintenance_type', ([maintenance_type], schema) =>
      maintenance_type === 'BY_DAY'
        ? schema.required('Nb jours avant maintenance est requis')
        : schema,
    ),
  nb_rental_before_maintenance: yup
    .number()
    .nullable()
    .min(1, 'Nb locations avant maintenance doit être supérieur à 0')
    .when('maintenance_type', ([maintenance_type], schema) =>
      maintenance_type === 'BY_NB_RENTAL'
        ? schema.required('Nb locations avant maintenance est requis')
        : schema,
    ),
  price_per_day: yup
    .number()
    .required('Prix par jour est requis')
    .min(1, 'Prix par jour doit être supérieur à 0'),
  guests: yup.array().of(yup.string().email('Email invalide')),
  image: yup.mixed().required('Image de la machine est requise'),
  deposit: yup.number().required('Caution est requise'),
});

const CreateMachineDialog = (props: {
  open: boolean;
  onClose: () => void;
  loadingCreate: boolean;
  onSubmit: (values: MachineRentedCreated & { image: File }) => void;
  initialValues: MachineRentedCreated;
}) => {
  const formik = useFormik<MachineRentedCreated & { image: File | null }>({
    initialValues: {
      ...props.initialValues,
      image: null,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      props.onSubmit(values as MachineRentedCreated & { image: File });
    },
  });

  const lastIndexGuests = useMemo(() => {
    return formik.values.guests.length - 1;
  }, [formik.values.guests]);

  const handleAddGuest = useCallback(
    (guest: string) => {
      formik.setFieldValue('guests', [...formik.values.guests, guest]);
    },
    [formik],
  );

  const handleEditGuestByIndex = useCallback(
    (value: string, index: number) => {
      if (index < 0 || index >= formik.values.guests.length) {
        handleAddGuest(value);
        return;
      }
      const guests = [...formik.values.guests];
      guests[index] = value;
      formik.setFieldValue('guests', guests);
    },
    [formik, handleAddGuest],
  );

  const handleRemoveGuest = useCallback(
    (guest: string) => {
      formik.setFieldValue(
        'guests',
        formik.values.guests.filter((g) => g !== guest),
      );
    },
    [formik],
  );

  console.log(formik);

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="lg">
      <DialogTitle>Ajouter une machine</DialogTitle>
      <DialogContent>
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
        <form onSubmit={formik.handleSubmit}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr', // Single column for smaller screens
                sm: '1fr', // Single column for tablets
                md: '1fr 1fr', // Two columns for desktops
              },
              gap: 2,
              mt: 2,
            }}
          >
            <TextField
              label="Nom"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              fullWidth
            />
            <MachineSelect
              label="Type de maintenance"
              name="maintenance_type"
              value={formik.values.maintenance_type}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.maintenance_type &&
                Boolean(formik.errors.maintenance_type)
              }
              required
              xs={12}
              isEditing={true}
              sx={{ width: '100%' }}
              strings={['BY_DAY', 'BY_NB_RENTAL']}
              callbackfn={(val) => (
                <MenuItem key={val} value={val}>
                  {TYPE_VALUE_ASSOCIATION[val] ?? val}
                </MenuItem>
              )}
              colorByValue={{}}
              renderValue={(val) => TYPE_VALUE_ASSOCIATION[val] ?? val}
            />
            {formik.values.maintenance_type === 'BY_DAY' && (
              <TextField
                label="Nb jours avant maintenance"
                name="nb_day_before_maintenance"
                type="number"
                value={formik.values.nb_day_before_maintenance || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.nb_day_before_maintenance &&
                  Boolean(formik.errors.nb_day_before_maintenance)
                }
                helperText={
                  formik.touched.nb_day_before_maintenance &&
                  formik.errors.nb_day_before_maintenance
                }
                fullWidth
              />
            )}
            {formik.values.maintenance_type === 'BY_NB_RENTAL' && (
              <TextField
                label="Nb locations avant maintenance"
                name="nb_rental_before_maintenance"
                type="number"
                value={formik.values.nb_rental_before_maintenance || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.nb_rental_before_maintenance &&
                  Boolean(formik.errors.nb_rental_before_maintenance)
                }
                helperText={
                  formik.touched.nb_rental_before_maintenance &&
                  formik.errors.nb_rental_before_maintenance
                }
                fullWidth
              />
            )}
            <TextField
              label="Prix par jour"
              name="price_per_day"
              type="number"
              value={formik.values.price_per_day}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.price_per_day &&
                Boolean(formik.errors.price_per_day)
              }
              helperText={
                formik.touched.price_per_day && formik.errors.price_per_day
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ paddingLeft: 1 }}>
                    €
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
            <TextField
              label="Caution"
              name="deposit"
              type="number"
              value={formik.values.deposit}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.deposit && Boolean(formik.errors.deposit)}
              helperText={formik.touched.deposit && formik.errors.deposit}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ paddingLeft: 1 }}>
                    €
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
            <MuiFileInput
              value={formik.values.image}
              onChange={(file) => {
                if (!file) {
                  formik.setFieldValue('image', null);
                  return;
                }
                compressImage(file)
                  .then((compressedFile) => {
                    formik.setFieldValue('image', compressedFile);
                  })
                  .catch((error) => {
                    console.error('Failed to compress image:', error);
                    notifyError('Failed to compress image');
                  });
              }}
              placeholder="Image de la machine"
              InputProps={{
                startAdornment: <InsertPhotoIcon />,
              }}
              clearIconButtonProps={{
                children: <CloseIcon fontSize="small" />,
              }}
              helperText={
                formik.touched.image && formik.errors.image
                  ? String(formik.errors.image)
                  : undefined
              }
              error={formik.touched.image && Boolean(formik.errors.image)}
              inputProps={{
                accept: 'image/*',
              }}
              fullWidth
            />
            <EditEmailsGuestFields
              values={formik.values.guests}
              errors={formik.errors.guests as string[]}
              touched={formik.touched.guests as unknown as boolean[]}
              lastIndex={lastIndexGuests}
              onChange={(e) =>
                handleEditGuestByIndex(e.target.value, lastIndexGuests)
              }
              onClickAddGuest={() => handleAddGuest('')}
              handleEditGuestByIndex={handleEditGuestByIndex}
              handleRemoveGuest={handleRemoveGuest}
            />
          </Box>
          <DialogActions>
            <Button onClick={props.onClose} color="secondary">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={props.loadingCreate}
            >
              Ajouter
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMachineDialog;
