import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  deleteMachineRentalApi,
  fetchMachineRentalById,
  updateMachineRental,
} from '../utils/api';
import { toast } from 'react-toastify';
import { MachineRental, MachineRentalWithMachineRented } from '../utils/types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { notifyLoading } from '../utils/notifications';

const SingleRental = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<null | MachineRentalWithMachineRented>(
    null,
  );
  const [initialRental, setInitialRental] =
    useState<null | MachineRentalWithMachineRented>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notificationUpdating, setNotificationUpdating] =
    useState<null | ReturnType<typeof notifyLoading>>(null);

  const updateRentalData = useCallback(
    (updatedData: Partial<MachineRental>) => {
      if (rental && Object.keys(updatedData).length > 0) {
        notificationUpdating?.end();
        const newNotificationUpdating = notifyLoading(
          'Mise à jour de la location en cours',
          'Location mise à jour',
          "Une erreur s'est produite lors de la mise à jour de la location",
        );
        setNotificationUpdating(newNotificationUpdating);
        updateMachineRental(id!, updatedData, auth.token)
          .then((updatedRental: MachineRental) => {
            newNotificationUpdating.success(null);
            const newRental = {
              ...updatedRental,
              machineRented: rental.machineRented,
            };
            setRental(newRental);
            setInitialRental(newRental);
          })
          .catch((error: Error) => {
            newNotificationUpdating.error(
              `Une erreur s'est produite lors de la mise à jour de la location : ${error.message}`,
            );
            console.error('Erreur lors de la mise à jour :', error);
          });
      }
    },
    [notificationUpdating, rental, id, auth.token],
  );

  const switchEditing = useCallback(() => {
    if (isEditing && initialRental && rental) {
      const updatedData = Object.keys(rental).reduce(
        (acc: any, key: string) => {
          if (
            (rental as Record<string, any>)[key] !==
            (initialRental as Record<string, any>)[key]
          ) {
            acc[key] = (rental as Record<string, any>)[key];
          }
          return acc;
        },
        {},
      ) as Partial<MachineRental>;

      updateRentalData(updatedData);
    }
    setIsEditing(!isEditing);
  }, [isEditing, rental, initialRental, id, auth.token, updateRentalData]);

  const handleChange = useCallback(
    (value: string | Date | number | null, name: string) => {
      setRental((prevRental) =>
        prevRental ? { ...prevRental, [name]: value } : null,
      );
    },
    [],
  );

  const deleteRental = useCallback(() => {
    if (!id) {
      alert('ID invalide');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer cette location ?')) {
      deleteMachineRentalApi(id, auth.token)
        .then(() => {
          toast.success('Location supprimée avec succès.');
          navigate('/');
        })
        .catch((error: Error) => {
          toast.error(`Erreur lors de la suppression : ${error.message}`);
          console.error('Erreur lors de la suppression :', error);
        });
    }
  }, [id, navigate, auth.token]);

  useEffect(() => {
    if (!id) {
      alert('ID invalide');
      return;
    }
    const fetchData = async () => {
      try {
        const fetchedRental = await fetchMachineRentalById(id, auth.token);
        setInitialRental(fetchedRental);
        setRental(fetchedRental);
      } catch (error) {
        console.error('Erreur lors du chargement de la location :', error);
        toast.error(`Erreur lors du chargement : ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, auth.token]);

  const totalPrice = useMemo(() => {
    if (
      rental?.machineRented?.price_per_day &&
      rental?.rentalDate &&
      rental?.returnDate
    ) {
      const { price_per_day } = rental.machineRented;
      return (
        (price_per_day *
          (new Date(rental.returnDate).getTime() -
            new Date(rental.rentalDate).getTime())) /
        (1000 * 60 * 60 * 24)
      );
    }

    return 0;
  }, [rental?.machineRented, rental?.rentalDate, rental?.returnDate]);

  const togglePaidStatus = useCallback(() => {
    if (rental) {
      updateRentalData({ paid: !rental.paid });
    }
  }, [rental, updateRentalData]);

  const handleAddEmailGuest = useCallback((newEmail: string) => {
    setRental((prevRental) => {
      if (prevRental) {
        return {
          ...prevRental,
          guests: [...prevRental.guests, newEmail],
        };
      }
      return null;
    });
  }, []);

  const handleRemoveEmailGuest = useCallback((emailToRemove: string) => {
    setRental((prevRental) => {
      if (prevRental) {
        return {
          ...prevRental,
          guests: prevRental.guests.filter((email) => email !== emailToRemove),
        };
      }
      return null;
    });
  }, []);

  const handleEditEmailGuestByIndex = useCallback(
    (newEmail: string, index: number) => {
      setRental((prevRental) => {
        if (prevRental) {
          const guests = [...prevRental.guests];
          if (index >= guests.length || index < 0) {
            guests.push(newEmail);
          } else {
            guests[index] = newEmail;
          }
          return {
            ...prevRental,
            guests,
          };
        }
        return null;
      });
    },
    [],
  );

  if (loading) {
    return <MachineLoading />;
  }

  return (
    <Box sx={{ padding: 4, paddingTop: 2 }}>
      <Grid container display={'flex'} mb={2}>
        <Grid item xs={3}>
          <Box display="flex" alignItems="center">
            <Typography variant="h4" gutterBottom paddingTop={1}>
              Location n°{rental?.id}
            </Typography>
            <IconButton onClick={switchEditing}>
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </IconButton>
          </Box>
        </Grid>
        <Grid
          item
          xs={9}
          display={'flex'}
          flexDirection={'row-reverse'}
          gap={4}
        >
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={deleteRental}
          >
            Supprimer la location
          </Button>
          <Button
            color="primary"
            startIcon={<VisibilityIcon />}
            component="a"
            href={`/machines/${rental?.machineRentedId}`}
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate(`/machines/${rental?.machineRentedId}`);
            }}
          >
            Accéder à la machine
          </Button>
          <Tooltip
            arrow
            title={
              rental?.paid
                ? 'Cliquer pour marquer comme non payé'
                : 'Cliquer pour marquer comme payé'
            }
          >
            <Button
              color={rental?.paid ? 'success' : 'warning'}
              startIcon={
                rental?.paid ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />
              }
              onClick={togglePaidStatus}
            >
              {rental?.paid ? 'Payé' : 'Non payé'}
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
      {rental && (
        <Grid container spacing={2}>
          <Grid item xs={6} spacing={4}>
            <Typography variant="h6">Détails</Typography>
            <SingleField
              label="Date de location"
              name="rentalDate"
              value={rental.rentalDate}
              valueType="date"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Date de retour"
              name="returnDate"
              value={rental.returnDate}
              valueType="date"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Prix total"
              name="total_price"
              value={`${totalPrice} €`}
              valueType={'text'}
              isEditing={false}
              handleChange={() => {}}
            />
            <SingleField
              label="Prénom"
              name="clientFirstName"
              value={rental.clientFirstName}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Nom"
              name="clientLastName"
              value={rental.clientLastName}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Email"
              name="clientEmail"
              value={rental.clientEmail}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Téléphone"
              name="clientPhone"
              value={rental.clientPhone}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Adresse"
              name="clientAddress"
              value={rental.clientAddress}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Code postal"
              name="clientPostal"
              value={rental.clientPostal}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Ville"
              name="clientCity"
              value={rental.clientCity}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
            />
            <SingleField
              label="Invités"
              name="guests"
              value={rental.guests.join(', ')}
              valueType="guest_email_list"
              isEditing={isEditing}
              xs={12}
              handleChange={() => {}} // not used with guest_email_list
              emails={rental.guests}
              errorsEmails={[]}
              touchedEmails={true}
              lastIndexEmail={rental.guests.length - 1}
              handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
              handleAddEmailGuest={handleAddEmailGuest}
              handleRemoveEmailGuest={handleRemoveEmailGuest}
            />
          </Grid>
          <Grid item xs={6} spacing={4}>
            <Typography variant="h6">Machine louée</Typography>
            <SingleField
              label="Nom"
              name="name"
              value={rental.machineRented.name}
              valueType="text"
              isEditing={false}
              handleChange={() => {}}
            />
            <SingleField
              label="Dernière maintenance"
              name="last_maintenance_date"
              value={
                rental.machineRented.last_maintenance_date || 'Non définie'
              }
              valueType={
                rental.machineRented.last_maintenance_date ? 'date' : 'text'
              }
              isEditing={false}
              handleChange={() => {}}
            />
            <SingleField
              label="Prochaine maintenance"
              name="next_maintenance"
              value={rental.machineRented.next_maintenance || 'Non définie'}
              valueType={
                rental.machineRented.next_maintenance ? 'date' : 'text'
              }
              isEditing={false}
              handleChange={() => {}}
            />
            <SingleField
              label="Prix par jour"
              name="price_per_day"
              value={`${rental.machineRented.price_per_day} €`}
              valueType={'text'}
              isEditing={false}
              handleChange={() => {}}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SingleRental;
