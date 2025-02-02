import '../styles/Home.css';
import { MachineRentalToCreate, MachineRentedWithImage } from '../utils/types';
import { createMachineRental, getAllMachineRented } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, ImageList, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as yup from 'yup';
import CreateRentalDialog from '../components/CreateRentalDialog';
import MachineRentedImageItem from '../components/MachineRentedImageItem';

const phoneRegex =
  /^(\+?[1-9]\d{0,2}[-.\s]?)?(0?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}(?:[-.\s]?\d{1,9})?)$/;
const postalRegex = /^[0-9]{5}$/;

// Validation schema
const validationSchema = yup.object({
  clientFirstName: yup.string().required('Prénom est requis'),
  clientLastName: yup.string().required('Nom est requis'),
  clientPhone: yup
    .string()
    .matches(phoneRegex, 'Numéro de téléphone invalide')
    .required('Téléphone est requis'),
  clientEmail: yup
    .string()
    .email('Email invalide')
    .required('Email est requis'),
  clientAddress: yup.string().required('Adresse est requise'),
  clientCity: yup.string().required('Ville est requise'),
  clientPostal: yup
    .string()
    .matches(postalRegex, 'Code postal invalide')
    .required('Code postal est requis'),
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
  const [loading, setLoading] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [machineRentedList, setMachineRentedList] = useState<
    MachineRentedWithImage[]
  >([]);
  const [open, setOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] =
    useState<MachineRentedWithImage | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data: MachineRentedWithImage[] = await getAllMachineRented(
        auth.token,
        true,
      );
      setMachineRentedList(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(
        "Une erreur s'est produite lors de la récupération des données",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClickOpen = (machine: MachineRentedWithImage) => {
    setSelectedMachine(machine);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMachine(null);
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
    },
    validationSchema: validationSchema,
    onSubmit: async (values: MachineRentalToCreate) => {
      if (!selectedMachine) return;

      try {
        if (!values.rentalDate || !values.returnDate) {
          throw new Error('Invalid dates');
        }
        setLoadingCreate(true);
        // Call API to create a new MachineRental
        await createMachineRental(selectedMachine.id, values, auth.token);
        toast.success('Machine rental created successfully');
        handleClose();
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

  return (
    <div id="home">
      <Typography variant="h6" gutterBottom paddingTop={1}>
        Ajout d'une location
      </Typography>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <CircularProgress size={48} color="primary" />
        </Box>
      ) : (
        <ImageList rowHeight={300} variant="masonry" cols={3} gap={8}>
          {machineRentedList.map((item) => (
            <MachineRentedImageItem
              key={item.id}
              item={item}
              onClick={handleClickOpen}
            />
          ))}
        </ImageList>
      )}
      <CreateRentalDialog
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
    </div>
  );
};

export default Home;
