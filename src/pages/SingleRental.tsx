import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  FormControlLabel,
  Checkbox,
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
import { calculateTotalPrice } from '../utils/rental.util';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import { getKeys, isDifferent } from '../utils/common.utils';

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
          .then(
            (
              updatedRental:
                | MachineRental
                | {
                    errorKey: string;
                    message: string;
                  },
            ) => {
              if ('errorKey' in updatedRental) {
                newNotificationUpdating.error(updatedRental.message);
                return;
              }
              newNotificationUpdating.success(null);
              const newRental = {
                ...updatedRental,
                machineRented: rental.machineRented,
              };
              setRental(newRental);
              setInitialRental(cloneDeep(newRental));
            },
          )
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
      const updatedData: Record<keyof MachineRentalWithMachineRented, any> =
        getKeys(rental).reduce(
          (acc: any, key: keyof MachineRentalWithMachineRented) => {
            if (key === 'machineRented') {
              return acc;
            }

            if (isDifferent(rental[key], initialRental[key])) {
              acc[key] = rental[key];
            }
            return acc;
          },
          {},
        );

      updateRentalData(updatedData);
    }
    setIsEditing(!isEditing);
  }, [isEditing, rental, initialRental, id, auth.token, updateRentalData]);

  const handleChange = useCallback(
    (value: string | Date | number | null | boolean, name: string) => {
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
        fetchedRental.machineRented.forbiddenRentalDays =
          fetchedRental.machineRented.forbiddenRentalDays.map(
            (date) => new Date(date),
          );
        setInitialRental(cloneDeep(fetchedRental));
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
    return calculateTotalPrice(rental);
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

  const shouldDisableDate = useCallback(
    (date: dayjs.Dayjs) => {
      if (!rental || !date) return false;

      return rental.machineRented.forbiddenRentalDays.some((forbiddenDate) => {
        const rentalDate = dayjs(rental.rentalDate);
        const returnDate = dayjs(rental.returnDate);
        const forbiddenDay = dayjs(forbiddenDate);
        const isSameDay = forbiddenDay.isSame(date, 'day');
        const isWithinRentalPeriod =
          (forbiddenDay.isAfter(rentalDate) &&
            forbiddenDay.isBefore(returnDate)) ||
          forbiddenDay.isSame(rentalDate, 'day') ||
          forbiddenDay.isSame(returnDate, 'day');

        return isSameDay && !isWithinRentalPeriod;
      });
    },
    [rental],
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
          </Box>
        </Grid>
        <Grid
          item
          xs={9}
          display={'flex'}
          flexDirection={'row-reverse'}
          gap={4}
        >
          <Tooltip title="Supprimer la location" arrow>
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={deleteRental}
            >
              Supprimer
            </Button>
          </Tooltip>
          <Tooltip
            arrow
            title={
              isEditing
                ? 'Enregistrer les modifications'
                : 'Modifier la location'
            }
          >
            <Button
              color={isEditing ? 'success' : 'warning'}
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={switchEditing}
            >
              {isEditing ? 'enregistrer' : 'modifier'}
            </Button>
          </Tooltip>
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
          <Tooltip
            arrow
            title={
              rental?.depositToPay
                ? 'Cliquer pour marquer le dépôt comme non payé'
                : 'Cliquer pour marquer le dépôt comme payé'
            }
          >
            <Button
              color={rental?.depositToPay ? 'success' : 'warning'}
              startIcon={
                rental?.depositToPay ? (
                  <CheckBoxIcon />
                ) : (
                  <CheckBoxOutlineBlankIcon />
                )
              }
              onClick={() => {
                if (rental) {
                  updateRentalData({ depositToPay: !rental.depositToPay });
                }
              }}
            >
              {rental?.depositToPay ? 'Caution payée' : 'Caution non payée'}
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
              size="small"
              shouldDisableDate={shouldDisableDate}
            />
            <SingleField
              label="Date de retour"
              name="returnDate"
              value={rental.returnDate}
              valueType="date"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
              shouldDisableDate={shouldDisableDate}
            />
            <SingleField
              label="Prix total"
              name="total_price"
              value={`${totalPrice} €`}
              valueType={'text'}
              isEditing={false}
              handleChange={() => {}}
              size="small"
            />
            <SingleField
              label="Prénom"
              name="clientFirstName"
              value={rental.clientFirstName}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Nom"
              name="clientLastName"
              value={rental.clientLastName}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Email"
              name="clientEmail"
              value={rental.clientEmail}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Téléphone"
              name="clientPhone"
              value={rental.clientPhone}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Adresse"
              name="clientAddress"
              value={rental.clientAddress}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Code postal"
              name="clientPostal"
              value={rental.clientPostal}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />
            <SingleField
              label="Ville"
              name="clientCity"
              value={rental.clientCity}
              valueType="text"
              isEditing={isEditing}
              xs={12}
              handleChange={handleChange}
              size="small"
            />

            <Grid item xs={12} display={'flex'} alignItems="center">
              {isEditing ? (
                <FormControlLabel
                  sx={{ mb: 2 }}
                  control={
                    <Checkbox
                      checked={rental.with_shipping}
                      onChange={(e) => {
                        handleChange(e.target.checked, 'with_shipping');
                      }}
                      name="with_shipping"
                    />
                  }
                  label="Avec livraison"
                />
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ margin: '8px 0' }}
                >
                  <Typography variant="subtitle1" noWrap>
                    Avec livraison :
                  </Typography>
                  <Typography variant="subtitle1" sx={{ marginLeft: '10px' }}>
                    {rental.with_shipping ? 'Oui' : 'Non'}
                  </Typography>
                </Box>
              )}
            </Grid>

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
              touchedEmails={[]}
              lastIndexEmail={rental.guests.length - 1}
              handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
              handleAddEmailGuest={handleAddEmailGuest}
              handleRemoveEmailGuest={handleRemoveEmailGuest}
              size="small"
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
