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
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Stack,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Handyman as HandymanIcon,
} from '@mui/icons-material';
import {
  deleteMachineRentalApi,
  fetchMachineRentalById,
  getRentalAgreement,
  updateMachineRental,
} from '../utils/api';
import { toast } from 'react-toastify';
import { MachineRental, MachineRentalWithMachineRented } from '../utils/types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { notifyError, notifyLoading } from '../utils/notifications';
import { calculateTotalPrice } from '../utils/rental.util';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import { getKeys, isDifferent } from '../utils/common.utils';
import { useSelector } from 'react-redux';
import { getPriceShipping } from '../store/selectors/configSelectors';

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
  const priceShipping = useSelector(getPriceShipping);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);

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
            setInitialRental(cloneDeep(newRental));
          })
          .catch((error: Error) => {
            if (String(error?.message).includes('overlapping_rental')) {
              newNotificationUpdating.error(
                'Les dates de location sont déjà prises',
              );
            } else {
              newNotificationUpdating.error(
                `Une erreur s'est produite lors de la mise à jour de la location : ${error.message}`,
              );
            }
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
      notifyError('ID invalide');
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
      notifyError('ID invalide');
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
    return calculateTotalPrice(rental, priceShipping);
  }, [
    rental?.machineRented,
    rental?.rentalDate,
    rental?.returnDate,
    priceShipping,
    rental?.with_shipping,
  ]);

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

  const openTermsInNewTab = useCallback(async () => {
    if (fileURL) {
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.location.href = fileURL;
      } else {
        notifyError("Impossible d'ouvrir le PDF dans un nouvel onglet");
      }
      return;
    }

    if (rental && rental.id) {
      try {
        setLoadingAgreement(true);
        // Use the API endpoint to get the rental agreement
        const rentalAgreementBlob = await getRentalAgreement(
          rental.id.toString(),
          auth.token,
        );
        const filePdf = new Blob([rentalAgreementBlob], {
          type: 'application/pdf',
        });

        // Create URL and open in new tab
        const newFileURL = URL.createObjectURL(filePdf);
        setFileURL(newFileURL);

        const pdfWindow = window.open();
        if (pdfWindow) {
          pdfWindow.location.href = newFileURL;
        } else {
          notifyError("Impossible d'ouvrir le PDF dans un nouvel onglet");
        }
      } catch (error) {
        console.error('Error fetching rental agreement:', error);
        notifyError('Erreur lors de la récupération du contrat de location');
      } finally {
        setLoadingAgreement(false);
      }
    }
  }, [
    fileURL,
    rental,
    auth.token,
    notifyError,
    setLoadingAgreement,
    setFileURL,
  ]);

  if (loading) {
    return <MachineLoading />;
  }

  return (
    <Box
      sx={{
        pt: { xs: 1, sm: 2 },
        pb: { xs: 2, sm: 3, md: 4 },
        pr: { xs: 2, sm: 3, md: 4 },
        pl: { xs: 2, sm: 3, md: 4 },
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          pb: { xs: 1 },
        }}
      >
        {/* <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate('/locations')}
            sx={{
              bgcolor: theme.palette.background.paper,
              boxShadow: 1,
              '&:hover': { bgcolor: theme.palette.primary.light },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" gutterBottom={false}>
            Location n°{rental?.id}
          </Typography>
        </Box> */}

        <Stack
          direction="row"
          gap={4}
          flexWrap="nowrap"
          justifyContent="center"
          flexDirection={'row-reverse'}
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
              variant={isEditing ? 'contained' : 'text'}
              color={isEditing ? 'success' : 'secondary'}
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={switchEditing}
            >
              {isEditing ? 'enregistrer' : 'modifier'}
            </Button>
          </Tooltip>
          <Tooltip
            arrow
            title={
              rental?.paid
                ? 'Cliquer pour marquer comme non payé'
                : 'Cliquer pour marquer comme payé'
            }
          >
            <Button
              color={rental?.paid ? 'primary' : 'warning'}
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
              color={!rental?.depositToPay ? 'primary' : 'warning'}
              startIcon={
                !rental?.depositToPay ? (
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
              {!rental?.depositToPay ? 'Caution payée' : 'Caution non payée'}
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {rental && (
        <Grid container spacing={3}>
          {/* Client Information Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader
                title="Informations Client"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  py: 1.5,
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <SingleField
                    label="Prénom"
                    name="clientFirstName"
                    value={rental.clientFirstName}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                  <SingleField
                    label="Nom"
                    name="clientLastName"
                    value={rental.clientLastName}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                  <SingleField
                    label="Email"
                    name="clientEmail"
                    value={rental.clientEmail}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                  <SingleField
                    label="Téléphone"
                    name="clientPhone"
                    value={rental.clientPhone}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                  <SingleField
                    label="Adresse"
                    name="clientAddress"
                    value={rental.clientAddress}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                    xs={12}
                  />
                  <SingleField
                    label="Code postal"
                    name="clientPostal"
                    value={rental.clientPostal}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                  <SingleField
                    label="Ville"
                    name="clientCity"
                    value={rental.clientCity}
                    valueType="text"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                  />
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Rental Details Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader
                title="Détails de la Location"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  py: 1.5,
                }}
                action={
                  rental?.finalTermsPdfId && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<DescriptionIcon />}
                      onClick={openTermsInNewTab}
                      size="medium"
                      disabled={loadingAgreement}
                      sx={{
                        mr: 1,
                        bgcolor: theme.palette.background.default,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {loadingAgreement
                        ? 'Chargement...'
                        : 'Afficher le contrat'}
                    </Button>
                  )
                }
              />
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <SingleField
                    label="Date de location"
                    name="rentalDate"
                    value={rental.rentalDate}
                    valueType="date"
                    isEditing={isEditing}
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
                    handleChange={handleChange}
                    size="small"
                    shouldDisableDate={shouldDisableDate}
                  />
                  <SingleField
                    label="Contrat signé"
                    name="finalTermsPdfId"
                    value={Boolean(rental.finalTermsPdfId)}
                    valueType="boolean"
                    isEditing={false}
                    handleChange={() => {}}
                    size="small"
                    xs={6}
                    isMultiline={false}
                  />
                  <SingleField
                    label="Avec livraison"
                    name="with_shipping"
                    value={rental.with_shipping}
                    valueType="boolean"
                    isEditing={isEditing}
                    handleChange={handleChange}
                    size="small"
                    xs={6}
                    isMultiline={false}
                  />
                  <Grid item xs={12}>
                    <Box
                      display={'flex'}
                      flexDirection={'row'}
                      gap={'10px'}
                      margin={'5px 0'}
                    >
                      <Typography fontWeight="bold" color="primary">
                        Prix total : {totalPrice} €
                      </Typography>
                    </Box>
                  </Grid>
                  <SingleField
                    xs={12}
                    label="Invités"
                    name="guests"
                    value={rental.guests.join(', ')}
                    valueType="guest_email_list"
                    isEditing={isEditing}
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
              </CardContent>
            </Card>
          </Grid>

          {/* Machine Details Card */}
          <Grid item xs={12}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Machine Louée"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  py: 1.5,
                }}
                action={
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<HandymanIcon />}
                    onClick={() =>
                      navigate(`/machines/${rental?.machineRentedId}`)
                    }
                    size="medium"
                    sx={{
                      mr: 1,
                      bgcolor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Accéder à la machine
                  </Button>
                }
              />
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Nom"
                      name="name"
                      value={rental.machineRented.name}
                      valueType="text"
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Prix par jour"
                      name="price_per_day"
                      value={`${rental.machineRented.price_per_day} €`}
                      valueType={'text'}
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Dernière maintenance"
                      name="last_maintenance_date"
                      value={
                        rental.machineRented.last_maintenance_date ||
                        'Non définie'
                      }
                      valueType={
                        rental.machineRented.last_maintenance_date
                          ? 'date'
                          : 'text'
                      }
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Prochaine maintenance"
                      name="next_maintenance"
                      value={
                        rental.machineRented.next_maintenance || 'Non définie'
                      }
                      valueType={
                        rental.machineRented.next_maintenance ? 'date' : 'text'
                      }
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>

                  {/* Machine Measurement Data */}
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mt: 2, mb: 0, fontWeight: 'medium' }}
                    >
                      Mesures de la machine
                    </Typography>
                    <Divider />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Heures de fonctionnement"
                      name="operatingHours"
                      value={
                        rental.machineRented.operatingHours !== null &&
                        rental.machineRented.operatingHours !== undefined
                          ? `${rental.machineRented.operatingHours} h`
                          : 'Non défini'
                      }
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Niveau de carburant"
                      name="fuelLevel"
                      value={
                        rental.machineRented.fuelLevel !== null &&
                        rental.machineRented.fuelLevel !== undefined
                          ? `${rental.machineRented.fuelLevel} %`
                          : 'Non défini'
                      }
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Dernière mise à jour"
                      name="lastMeasurementUpdate"
                      value={
                        rental.machineRented.lastMeasurementUpdate ||
                        'Non défini'
                      }
                      valueType={
                        rental.machineRented.lastMeasurementUpdate
                          ? 'date'
                          : 'text'
                      }
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SingleField
                      xs={12}
                      label="Mis à jour par"
                      name="lastMeasurementUser"
                      value={
                        rental.machineRented.lastMeasurementUser || 'Non défini'
                      }
                      valueType="text"
                      isEditing={false}
                      handleChange={() => {}}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SingleRental;
