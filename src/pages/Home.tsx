import '../styles/Home.css';
import {
  MachineRental,
  MachineRentalToCreate,
  MachineRentedSimpleWithImage,
} from '../utils/types';
import { createMachineRental } from '../utils/api';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  ImageList,
  Typography,
  TextField,
  IconButton,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as yup from 'yup';
import CreateRentalDialog from '../components/CreateRentalDialog';
import MachineRentedImageItem from '../components/MachineRentedImageItem';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMachineRental } from '../store/slices/machineRentalSlice';
import { fetchMachineRented } from '../store/slices/machineRentedSlice';
import {
  getMachineRentedList,
  getMachineRentedLoading,
} from '../store/selectors';
import SearchIcon from '@mui/icons-material/Search';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import ConfirmDialog from '../components/ConfirmDialog';

const phoneRegex =
  /^(\+?[1-9]\d{0,2}[-.\s]?)?(0?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}(?:[-.\s]?\d{1,9})?)$/;
const postalRegex = /^[0-9]{4,5}$/;

// Validation schema
const validationSchema = yup.object({
  clientFirstName: yup.string().required('Prénom est requis'),
  clientLastName: yup.string().required('Nom est requis'),
  clientPhone: yup
    .string()
    .matches(phoneRegex, 'Numéro de téléphone invalide')
    .required('Téléphone est requis'),
  clientEmail: yup.string().email('Email invalide'),
  clientAddress: yup.string(),
  clientCity: yup.string(),
  clientPostal: yup.string().matches(postalRegex, 'Code postal invalide'),
  rentalDate: yup
    .date()
    .required('Date de location est requise')
    .typeError('Date invalide'),
  returnDate: yup
    .date()
    .required('Date de retour est requise')
    .typeError('Date invalide')
    .min(
      yup.ref('rentalDate'),
      'Date de retour doit être après la date de location',
    ),
  guests: yup.array().of(yup.string().email('Email invalide')),
});

const Home = (): JSX.Element => {
  const auth = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const machineRentedList = useAppSelector(getMachineRentedList);
  const loadingMachineRentedList = useAppSelector(getMachineRentedLoading);

  const refreshMachineRentalList = () => {
    if (auth.token) {
      dispatch(fetchMachineRental(auth.token));
    }
  };

  const refreshMachineRentedList = () => {
    if (auth.token) {
      dispatch(fetchMachineRented(auth.token));
    }
  };

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] =
    useState<MachineRentedSimpleWithImage | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClickOpen = (machine: MachineRentedSimpleWithImage) => {
    const machineCopy = {
      ...machine,
      forbiddenRentalDays: machine.forbiddenRentalDays.map((d) => new Date(d)),
    };
    setSelectedMachine(machineCopy);
    setOpen(true);
  };

  const formik = useFormik<MachineRentalToCreate>({
    initialValues: {
      clientFirstName: '',
      clientLastName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      clientCity: '',
      clientPostal: '',
      rentalDate: null,
      returnDate: null,
      guests: [],
      with_shipping: false,
      paid: false,
      depositToPay: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values: MachineRentalToCreate) => {
      if (!selectedMachine) {
        console.warn('No machine selected, cannot create rental');
        return;
      }

      try {
        if (!values.rentalDate || !values.returnDate) {
          throw new Error('Invalid dates');
        }
        // remove empty guests
        values.guests = values.guests.filter((guest) => !!guest);
        setLoadingCreate(true);
        // Appel à l'API pour créer une machine louée
        const result: MachineRental | { errorKey: string; message: string } =
          await createMachineRental(selectedMachine.id, values, auth.token);
        if ('errorKey' in result) {
          if (!result.message) {
            throw new Error(result.errorKey);
          }
          toast.error(result.message);
        } else {
          refreshMachineRentalList();
          refreshMachineRentedList();
          handleClose(true);
        }
      } catch (error) {
        console.error('Failed to create machine rental:', error);
        toast.error(
          "Une erreur s'est produite lors de la création de la location",
        );
      } finally {
        setLoadingCreate(false);
      }
    },
  });

  const formEdited = useMemo(() => {
    return (
      JSON.stringify(formik.values) !== JSON.stringify(formik.initialValues)
    );
  }, [formik.values, formik.initialValues]);

  const handleClose = (doNotConfirm?: boolean) => {
    if (formEdited && !doNotConfirm) {
      setConfirmOpen(true);
    } else {
      setOpen(false);
      setSelectedMachine(null);
      formik.resetForm();
    }
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setOpen(false);
    setSelectedMachine(null);
    formik.resetForm();
  };

  // Filter the machine rented list based on the filterText and item.name using useMemo
  const filteredMachines = useMemo(() => {
    return machineRentedList.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase()),
    );
  }, [machineRentedList, filterText]);

  return (
    <div id="home">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ paddingTop: 1, marginBottom: 2 }}
      >
        <Typography variant="h6">Ajout d'une location</Typography>
        <TextField
          label="Rechercher une machine"
          variant="outlined"
          value={filterText}
          size="small"
          sx={{ minWidth: 450 }}
          onChange={(e) => setFilterText(e.target.value)}
          InputProps={{
            endAdornment: (
              <>
                {filterText ? (
                  <IconButton
                    aria-label="clear search"
                    onClick={() => setFilterText('')}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <SearchIcon />
                )}
              </>
            ),
          }}
        />
      </Box>
      {loadingMachineRentedList ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress size={48} color="primary" />
        </Box>
      ) : (
        <ImageList rowHeight={250} variant="quilted" cols={6} gap={8}>
          {filteredMachines.map((item) => (
            <MachineRentedImageItem
              key={item.id}
              item={item}
              onClick={handleClickOpen}
            />
          ))}
        </ImageList>
      )}
      <CreateRentalDialog
        selectedMachine={selectedMachine}
        open={open}
        onClose={handleClose}
        loadingCreate={loadingCreate}
        formik={formik}
        onChangeRentalDate={(date) =>
          formik.setFieldValue('rentalDate', date ? date.toDate() : null)
        }
        onChangeReturnDate={(date) =>
          formik.setFieldValue('returnDate', date ? date.toDate() : null)
        }
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmer la fermeture"
        content="Vous avez des modifications non enregistrées. Êtes-vous sûr de fermer le formulaire?"
        onConfirm={handleConfirmClose}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Home;
