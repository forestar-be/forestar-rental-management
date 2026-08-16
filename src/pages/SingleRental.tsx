import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  Tooltip,
  Typography,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Chip,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Handyman as HandymanIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  acceptMachineRental,
  deleteMachineRentalApi,
  fetchMachineRentalById,
  getRentalAgreement,
  markMachineRentalPaid,
  markMachineRentalUnpaid,
  updateMachineRental,
} from '../utils/api';
import { toast } from 'react-toastify';
import {
  MachineRental,
  MachineRentalAddon,
  MachineRentalWithMachineRented,
  RENTAL_ORIGIN_LABELS,
  RentalPaymentAmountType,
} from '../utils/types';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { notifyError, notifyLoading } from '../utils/notifications';
import { calculateTotalPrice } from '../utils/rental.util';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import { getKeys, isDifferent } from '../utils/common.utils';
import { useSelector } from 'react-redux';
import {
  getPriceShipping,
  getRentalPaymentDeadlineHours,
} from '../store/selectors/configSelectors';
import {
  getRentalDisplayStatus,
  hasRentalPaymentRequest,
  RENTAL_STATUS_LABELS,
} from '../utils/rentalStatus.util';
import { useUnsavedChanges } from '../hooks/UnsavedChangesProvider';

const SingleRental = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { confirmNavigation, setHasUnsavedChanges } = useUnsavedChanges();
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
  const defaultPaymentDeadlineHours = useSelector(
    getRentalPaymentDeadlineHours,
  );
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  }>({ open: false, title: '', content: '', onConfirm: () => {} });
  const [refuseDialogOpen, setRefuseDialogOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [refuseNotifyClient, setRefuseNotifyClient] = useState(true);
  const [warningNoReasonOpen, setWarningNoReasonOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptAmountType, setAcceptAmountType] =
    useState<RentalPaymentAmountType>('FULL');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentDeadlineHours, setPaymentDeadlineHours] = useState('24');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  const totalPrice = useMemo(() => {
    return calculateTotalPrice(rental, priceShipping);
  }, [rental, priceShipping]);
  const rentalHasPaymentRequest = rental
    ? hasRentalPaymentRequest(rental)
    : false;
  const rentalDisplayStatus = rental ? getRentalDisplayStatus(rental) : null;
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing || !rental || !initialRental) return false;

    return getKeys(rental).some(
      (key) =>
        key !== 'machineRented' &&
        isDifferent(rental[key], initialRental[key]),
    );
  }, [initialRental, isEditing, rental]);

  useEffect(() => {
    setHasUnsavedChanges(hasUnsavedChanges);
    return () => setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, setHasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const preventUnsavedChangesLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = true;
    };

    window.addEventListener('beforeunload', preventUnsavedChangesLoss);
    return () =>
      window.removeEventListener('beforeunload', preventUnsavedChangesLoss);
  }, [hasUnsavedChanges]);

  const updateRentalData = useCallback(
    async (updatedData: Partial<MachineRental>) => {
      if (!rental || Object.keys(updatedData).length === 0) return true;

      notificationUpdating?.end();
      const newNotificationUpdating = notifyLoading(
        'Mise à jour de la location en cours',
        'Location mise à jour',
        "Une erreur s'est produite lors de la mise à jour de la location",
      );
      setNotificationUpdating(newNotificationUpdating);

      try {
        const updatedRental = await updateMachineRental(
          id!,
          updatedData,
          auth.token,
        );
        newNotificationUpdating.success(null);
        const newRental = {
          ...updatedRental,
          machineRented: rental.machineRented,
        };
        setRental(newRental);
        setInitialRental(cloneDeep(newRental));
        return true;
      } catch (error) {
        const updateError = error as Error;
        if (String(updateError?.message).includes('overlapping_rental')) {
          newNotificationUpdating.error(
            'Les dates de location sont déjà prises',
          );
        } else {
          newNotificationUpdating.error(
            `Une erreur s'est produite lors de la mise à jour de la location : ${updateError.message}`,
          );
        }
        console.error('Erreur lors de la mise à jour :', updateError);
        return false;
      }
    },
    [notificationUpdating, rental, id, auth.token],
  );

  const switchEditing = useCallback(async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!initialRental || !rental) return;

    const updatedData: Record<keyof MachineRentalWithMachineRented, any> =
      getKeys(rental).reduce(
        (acc: any, key: keyof MachineRentalWithMachineRented) => {
          if (
            key !== 'machineRented' &&
            isDifferent(rental[key], initialRental[key])
          ) {
            acc[key] = rental[key];
          }
          return acc;
        },
        {},
      );

    if (await updateRentalData(updatedData)) {
      setIsEditing(false);
    }
  }, [isEditing, rental, initialRental, updateRentalData]);

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
    setConfirmDialog({
      open: true,
      title: 'Annuler la location',
      content:
        "Voulez-vous annuler cette location ? Elle restera consultable dans l'historique et les dates seront libérées.",
      onConfirm: () => {
        setConfirmDialog((d) => ({ ...d, open: false }));
        deleteMachineRentalApi(id, auth.token)
          .then((updatedRental) => {
            toast.success('Location annulée avec succès.');
            setRental(updatedRental);
            setInitialRental(cloneDeep(updatedRental));
          })
          .catch((error: Error) => {
            toast.error(`Erreur lors de l'annulation : ${error.message}`);
            console.error("Erreur lors de l'annulation :", error);
          });
      },
    });
  }, [id, auth.token]);

  const validateRental = useCallback(() => {
    if (!id) return;
    setAcceptAmountType('FULL');
    setCustomAmount('');
    setPaymentDeadlineHours(String(defaultPaymentDeadlineHours));
    setAcceptDialogOpen(true);
  }, [id, defaultPaymentDeadlineHours]);

  const executeAcceptance = useCallback(async () => {
    if (!id || !rental) return;
    const parsedCustomAmount =
      acceptAmountType === 'CUSTOM' ? Number(customAmount) : undefined;
    if (
      acceptAmountType === 'CUSTOM' &&
      (!parsedCustomAmount ||
        parsedCustomAmount <= 0 ||
        parsedCustomAmount > totalPrice)
    ) {
      toast.error(
        'Le montant libre doit être positif et ne pas dépasser le total.',
      );
      return;
    }
    const parsedPaymentDeadlineHours = Number(paymentDeadlineHours);
    if (
      !Number.isFinite(parsedPaymentDeadlineHours) ||
      parsedPaymentDeadlineHours <= 0
    ) {
      toast.error('Le délai de paiement doit être strictement positif.');
      return;
    }
    setPaymentActionLoading(true);
    try {
      const updatedRental = await acceptMachineRental(id, auth.token, {
        amountType: acceptAmountType,
        customAmount: parsedCustomAmount,
        paymentDeadlineHours: parsedPaymentDeadlineHours,
      });
      setRental(updatedRental);
      setInitialRental(cloneDeep(updatedRental));
      setAcceptDialogOpen(false);
      toast.success('Réservation acceptée. Les instructions ont été envoyées.');
    } catch (error) {
      toast.error(`Acceptation impossible : ${(error as Error).message}`);
    } finally {
      setPaymentActionLoading(false);
    }
  }, [
    id,
    rental,
    acceptAmountType,
    customAmount,
    totalPrice,
    paymentDeadlineHours,
    auth.token,
  ]);

  const refuseRental = useCallback(() => {
    if (!id) return;
    setRefuseReason('');
    setRefuseNotifyClient(true);
    setRefuseDialogOpen(true);
  }, [id]);

  const executeRefusal = useCallback(() => {
    if (!id) return;
    setRefuseDialogOpen(false);
    setWarningNoReasonOpen(false);
    deleteMachineRentalApi(id, auth.token, {
      reason: refuseReason || undefined,
      notifyClient: refuseNotifyClient,
    })
      .then((updatedRental) => {
        toast.success(
          refuseNotifyClient
            ? 'Demande refusée. Le client a été notifié par email.'
            : 'Demande refusée.',
        );
        setRental(updatedRental);
        setInitialRental(cloneDeep(updatedRental));
      })
      .catch((error: Error) => {
        toast.error(`Erreur lors du refus : ${error.message}`);
      });
  }, [id, auth.token, refuseReason, refuseNotifyClient]);

  const handleRefuseConfirm = useCallback(() => {
    // If notify is enabled but no reason, show warning first
    if (refuseNotifyClient && !refuseReason.trim()) {
      setWarningNoReasonOpen(true);
      return;
    }
    executeRefusal();
  }, [refuseNotifyClient, refuseReason, executeRefusal]);

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

  const applyPaymentChange = useCallback(
    async (action: () => Promise<MachineRentalWithMachineRented>, success: string) => {
      setPaymentActionLoading(true);
      try {
        const updatedRental = await action();
        setRental(updatedRental);
        setInitialRental(cloneDeep(updatedRental));
        toast.success(success);
      } catch (error) {
        toast.error(`Modification impossible : ${(error as Error).message}`);
      } finally {
        setPaymentActionLoading(false);
      }
    },
    [],
  );

  // Demande de paiement issue du site public : le pointage du virement est
  // définitif, il déclenche la confirmation au client.
  const markPaymentReceived = useCallback(() => {
    if (!id || !rental || rental.status !== 'PAYMENT_PENDING') return;
    setConfirmDialog({
      open: true,
      title: 'Marquer le virement reçu',
      content:
        'Confirmez-vous que le virement est visible sur le compte bancaire ? Une confirmation définitive sera envoyée au client.',
      onConfirm: async () => {
        setConfirmDialog((dialog) => ({ ...dialog, open: false }));
        await applyPaymentChange(
          () => markMachineRentalPaid(id, auth.token),
          'Virement enregistré comme reçu.',
        );
      },
    });
  }, [id, rental, auth.token, applyPaymentChange]);

  // Paiement suivi à la main : réversible, sans email au client.
  const togglePaidStatus = useCallback(() => {
    if (!id || !rental) return;
    const wasPaid = rental.status === 'PAID';
    applyPaymentChange(
      () =>
        wasPaid
          ? markMachineRentalUnpaid(id, auth.token)
          : markMachineRentalPaid(id, auth.token),
      wasPaid
        ? 'Location marquée comme non payée.'
        : 'Location marquée comme payée.',
    );
  }, [id, rental, auth.token, applyPaymentChange]);

  const acceptancePreview = useMemo(() => {
    if (!rental) return 0;
    if (acceptAmountType === 'FULL') return totalPrice;
    if (acceptAmountType === 'CUSTOM') return Number(customAmount) || 0;
    const configured =
      rental.machineRented.reservationDepositMode === 'PERCENT'
        ? totalPrice * (rental.machineRented.reservationDepositValue / 100)
        : rental.machineRented.reservationDepositValue;
    return Math.min(totalPrice, Math.round(configured * 100) / 100);
  }, [rental, acceptAmountType, customAmount, totalPrice]);

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

  const toggleAddon = useCallback(
    (machineAddon: {
      addonName: string;
      price: number;
      price_type: string;
    }) => {
      setRental((prev) => {
        if (!prev) return null;
        const current = prev.addons || [];
        const exists = current.some(
          (a) => a.addonName === machineAddon.addonName,
        );
        if (exists) {
          return {
            ...prev,
            addons: current.filter(
              (a) => a.addonName !== machineAddon.addonName,
            ),
          };
        }
        const newAddon: MachineRentalAddon = {
          addonName: machineAddon.addonName,
          price: machineAddon.price,
          price_type: machineAddon.price_type,
          quantity: 1,
        };
        return { ...prev, addons: [...current, newAddon] };
      });
    },
    [],
  );

  const updateAddonQuantity = useCallback(
    (addonName: string, quantity: number) => {
      setRental((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          addons: (prev.addons || []).map((a) =>
            a.addonName === addonName
              ? { ...a, quantity: Math.max(1, quantity) }
              : a,
          ),
        };
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
          {rental?.status !== 'CANCELLED' && (
            <Tooltip title="Annuler la location" arrow>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={deleteRental}
              >
                Annuler
              </Button>
            </Tooltip>
          )}
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
          {rental?.status === 'PAYMENT_PENDING' && rentalHasPaymentRequest && (
            <Tooltip arrow title="Confirmer la réception du virement">
              <Button
                color="success"
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={markPaymentReceived}
                disabled={paymentActionLoading}
              >
                Marquer le virement reçu
              </Button>
            </Tooltip>
          )}
          {/* Paiement suivi à la main : bascule dans les deux sens. */}
          {rental &&
            !rentalHasPaymentRequest &&
            ['PAYMENT_PENDING', 'PAID'].includes(rental.status) && (
              <Tooltip
                arrow
                title={
                  rental.status === 'PAID'
                    ? 'Cliquer pour marquer comme non payée'
                    : 'Cliquer pour marquer comme payée'
                }
              >
                <Button
                  color={rental.status === 'PAID' ? 'primary' : 'warning'}
                  startIcon={
                    rental.status === 'PAID' ? (
                      <CheckBoxIcon />
                    ) : (
                      <CheckBoxOutlineBlankIcon />
                    )
                  }
                  onClick={togglePaidStatus}
                  disabled={paymentActionLoading}
                >
                  {rental.status === 'PAID' ? 'Payée' : 'Non payée'}
                </Button>
              </Tooltip>
            )}
          {rental && (
            <Chip
              label={RENTAL_STATUS_LABELS[rentalDisplayStatus!]}
              color={
                rentalDisplayStatus === 'PAID'
                  ? 'success'
                  : rentalDisplayStatus === 'OVERDUE'
                    ? 'error'
                    : rentalDisplayStatus === 'PENDING_APPROVAL'
                      ? 'warning'
                      : rentalDisplayStatus === 'PAYMENT_PENDING'
                        ? 'info'
                        : 'default'
              }
            />
          )}
          {rental && rental.origin !== 'UNKNOWN' && (
            <Chip
              variant="outlined"
              label={RENTAL_ORIGIN_LABELS[rental.origin]}
              color={rental.origin === 'PUBLIC_SITE' ? 'secondary' : 'default'}
            />
          )}
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

      {rental?.status === 'PENDING_APPROVAL' && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="success"
                variant="contained"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={validateRental}
              >
                Valider
              </Button>
              <Button
                color="error"
                variant="outlined"
                size="small"
                startIcon={<CancelIcon />}
                onClick={refuseRental}
              >
                Refuser
              </Button>
            </Stack>
          }
        >
          <strong>Demande en attente de validation</strong> —{' '}
          {rental.origin === 'PUBLIC_SITE'
            ? 'Cette location a été demandée via le site public'
            : rental.origin === 'INTERNAL_SITE'
              ? 'Cette location a été encodée en interne avant la séparation des parcours'
              : 'Cette location'}{' '}
          et n'est pas encore confirmée : elle ne réserve pas la machine.
        </Alert>
      )}

      {rental?.status === 'PAYMENT_PENDING' && rentalHasPaymentRequest && (
        <Alert
          severity={
            rentalDisplayStatus === 'OVERDUE' ? 'error' : 'info'
          }
          sx={{ mb: 2 }}
        >
          <strong>
            {rentalDisplayStatus === 'OVERDUE'
              ? 'Paiement en retard'
              : 'Paiement en attente'}
          </strong>
          {' — '}
          {rental.paymentAmount?.toLocaleString('fr-BE', {
            style: 'currency',
            currency: 'EUR',
          })}{' '}
          demandé, échéance le{' '}
          {rental.paymentDueAt
            ? dayjs(rental.paymentDueAt).format('DD/MM/YYYY HH:mm')
            : '—'}
          . Annulation automatique le{' '}
          {rental.cancellationDueAt
            ? dayjs(rental.cancellationDueAt).format('DD/MM/YYYY HH:mm')
            : '—'}
          . Communication : <strong>{rental.structuredCommunication}</strong>
        </Alert>
      )}

      {rental?.status === 'PAID' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>
            {rentalHasPaymentRequest ? 'Virement reçu' : 'Location payée'}
          </strong>
          {rental.paidAt
            ? ` le ${dayjs(rental.paidAt).format('DD/MM/YYYY HH:mm')}`
            : ''}
          {rentalHasPaymentRequest && rental.paymentAmount
            ? ` — ${rental.paymentAmount.toLocaleString('fr-BE', {
                style: 'currency',
                currency: 'EUR',
              })}`
            : ''}
          .
        </Alert>
      )}

      {rental?.status === 'CANCELLED' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Location annulée</strong>
          {rental.cancelledAt
            ? ` le ${dayjs(rental.cancelledAt).format('DD/MM/YYYY HH:mm')}`
            : ''}
          {rental.cancellationReason ? ` — ${rental.cancellationReason}` : ''}
        </Alert>
      )}

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
                  {(isEditing || rental.clientCompany) && (
                    <SingleField
                      label="Entreprise"
                      name="clientCompany"
                      value={rental.clientCompany}
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                      size="small"
                      xs={12}
                    />
                  )}
                  {(isEditing || rental.clientAddress) && (
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
                  )}
                  {(isEditing || rental.clientPostal) && (
                    <SingleField
                      label="Code postal"
                      name="clientPostal"
                      value={rental.clientPostal}
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                      size="small"
                    />
                  )}
                  {(isEditing || rental.clientCity) && (
                    <SingleField
                      label="Ville"
                      name="clientCity"
                      value={rental.clientCity}
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                      size="small"
                    />
                  )}
                  {(isEditing || rental.clientMessage) && (
                    <SingleField
                      label="Message"
                      name="clientMessage"
                      value={rental.clientMessage}
                      valueType="text"
                      isEditing={isEditing}
                      handleChange={handleChange}
                      size="small"
                      xs={12}
                      isMultiline={true}
                    />
                  )}
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
                  {isEditing &&
                    rental.machineRented.addons &&
                    rental.machineRented.addons.filter(
                      (a) => a.category === 'accessory',
                    ).length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          Accessoires :
                        </Typography>
                        {rental.machineRented.addons
                          .filter((a) => a.category === 'accessory')
                          .map((machineAddon) => {
                            const selected = (rental.addons || []).find(
                              (a) => a.addonName === machineAddon.addonName,
                            );
                            const isSelected = !!selected;
                            return (
                              <Box
                                key={machineAddon.addonName}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => toggleAddon(machineAddon)}
                                      size="small"
                                    />
                                  }
                                  label={`${machineAddon.addonName} (${machineAddon.price} €${machineAddon.price_type === 'per_day' ? '/jour' : ''})`}
                                />
                                {isSelected &&
                                  machineAddon.quantity_enabled && (
                                    <TextField
                                      type="number"
                                      label="Qté"
                                      size="small"
                                      sx={{ width: 80 }}
                                      value={selected!.quantity}
                                      onChange={(e) =>
                                        updateAddonQuantity(
                                          machineAddon.addonName,
                                          parseInt(e.target.value) || 1,
                                        )
                                      }
                                      inputProps={{ min: 1 }}
                                    />
                                  )}
                              </Box>
                            );
                          })}
                      </Grid>
                    )}
                  {isEditing &&
                    rental.machineRented.addons &&
                    rental.machineRented.addons.filter(
                      (a) => a.category === 'option',
                    ).length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          Options :
                        </Typography>
                        {rental.machineRented.addons
                          .filter((a) => a.category === 'option')
                          .map((machineAddon) => {
                            const selected = (rental.addons || []).find(
                              (a) => a.addonName === machineAddon.addonName,
                            );
                            const isSelected = !!selected;
                            return (
                              <Box
                                key={machineAddon.addonName}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => toggleAddon(machineAddon)}
                                      size="small"
                                    />
                                  }
                                  label={`${machineAddon.addonName} (${machineAddon.price} €${machineAddon.price_type === 'per_day' ? '/jour' : ''})`}
                                />
                                {isSelected &&
                                  machineAddon.quantity_enabled && (
                                    <TextField
                                      type="number"
                                      label="Qté"
                                      size="small"
                                      sx={{ width: 80 }}
                                      value={selected!.quantity}
                                      onChange={(e) =>
                                        updateAddonQuantity(
                                          machineAddon.addonName,
                                          parseInt(e.target.value) || 1,
                                        )
                                      }
                                      inputProps={{ min: 1 }}
                                    />
                                  )}
                              </Box>
                            );
                          })}
                      </Grid>
                    )}
                  {!isEditing &&
                    rental.addons &&
                    rental.addons.filter((a) => {
                      const machineAddon = rental.machineRented.addons?.find(
                        (ma) => ma.addonName === a.addonName,
                      );
                      return (
                        !machineAddon || machineAddon.category === 'accessory'
                      );
                    }).length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          Accessoires :
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {rental.addons
                            .filter((a) => {
                              const machineAddon =
                                rental.machineRented.addons?.find(
                                  (ma) => ma.addonName === a.addonName,
                                );
                              return (
                                !machineAddon ||
                                machineAddon.category === 'accessory'
                              );
                            })
                            .map((addon) => (
                              <Chip
                                key={addon.addonName}
                                label={`${addon.addonName} (${addon.price} €${addon.price_type === 'per_day' ? '/jour' : ''}${addon.quantity > 1 ? ` x${addon.quantity}` : ''})`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                        </Stack>
                      </Grid>
                    )}
                  {!isEditing &&
                    rental.addons &&
                    rental.addons.filter((a) => {
                      const machineAddon = rental.machineRented.addons?.find(
                        (ma) => ma.addonName === a.addonName,
                      );
                      return machineAddon?.category === 'option';
                    }).length > 0 && (
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'medium' }}
                        >
                          Options :
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {rental.addons
                            .filter((a) => {
                              const machineAddon =
                                rental.machineRented.addons?.find(
                                  (ma) => ma.addonName === a.addonName,
                                );
                              return machineAddon?.category === 'option';
                            })
                            .map((addon) => (
                              <Chip
                                key={addon.addonName}
                                label={`${addon.addonName} (${addon.price} €${addon.price_type === 'per_day' ? '/jour' : ''}${addon.quantity > 1 ? ` x${addon.quantity}` : ''})`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                        </Stack>
                      </Grid>
                    )}
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
                      confirmNavigation() &&
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
                  {rental.variant && (
                    <Grid item xs={12} sm={6} md={3}>
                      <SingleField
                        xs={12}
                        label="Variante"
                        name="variant"
                        value={rental.variant.title}
                        valueType="text"
                        isEditing={false}
                        handleChange={() => {}}
                      />
                    </Grid>
                  )}
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />

      <Dialog
        open={acceptDialogOpen}
        onClose={() => !paymentActionLoading && setAcceptDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Accepter la réservation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Choisissez le montant et le délai de paiement par virement.
          </DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="payment-amount-type-label">
              Montant demandé
            </InputLabel>
            <Select
              labelId="payment-amount-type-label"
              label="Montant demandé"
              value={acceptAmountType}
              onChange={(event) =>
                setAcceptAmountType(
                  event.target.value as RentalPaymentAmountType,
                )
              }
            >
              <MenuItem value="FULL">
                Totalité ({totalPrice.toLocaleString('fr-BE')} €)
              </MenuItem>
              <MenuItem value="MACHINE_DEPOSIT">
                Acompte machine ({rental?.machineRented.reservationDepositValue}
                {rental?.machineRented.reservationDepositMode === 'PERCENT'
                  ? ' %'
                  : ' €'}
                )
              </MenuItem>
              <MenuItem value="CUSTOM">Montant libre</MenuItem>
            </Select>
          </FormControl>
          {acceptAmountType === 'CUSTOM' && (
            <TextField
              autoFocus
              label="Montant libre"
              type="number"
              fullWidth
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              inputProps={{ min: 0.01, max: totalPrice, step: 0.01 }}
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            label="Délai de paiement (heures)"
            type="number"
            fullWidth
            value={paymentDeadlineHours}
            onChange={(event) => setPaymentDeadlineHours(event.target.value)}
            inputProps={{ min: 1, step: 1 }}
            helperText="La réservation passera en retard à cette échéance. L'annulation automatique se fera au minimum 48 h après acceptation, ou 24 h après cette échéance si elle est plus longue."
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            Montant qui sera figé :{' '}
            <strong>
              {acceptancePreview.toLocaleString('fr-BE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </strong>
            . Le client recevra les coordonnées bancaires, la communication
            structurée et le QR EPC.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAcceptDialogOpen(false)}
            disabled={paymentActionLoading}
          >
            Fermer
          </Button>
          <Button
            onClick={executeAcceptance}
            variant="contained"
            color="success"
            disabled={paymentActionLoading || acceptancePreview <= 0}
          >
            Accepter et demander le paiement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refusal dialog with reason + notify toggle */}
      <Dialog
        open={refuseDialogOpen}
        onClose={() => setRefuseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refuser la demande</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Voulez-vous refuser cette demande de location ? Elle restera
            consultable dans l'historique.
          </DialogContentText>
          <TextField
            autoFocus
            label="Motif du refus (optionnel)"
            fullWidth
            multiline
            rows={3}
            value={refuseReason}
            onChange={(e) => setRefuseReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={refuseNotifyClient}
                onChange={(e) => setRefuseNotifyClient(e.target.checked)}
              />
            }
            label="Notifier le client par email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefuseDialogOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button
            onClick={handleRefuseConfirm}
            color="error"
            variant="contained"
          >
            Refuser
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning: notify without reason */}
      <ConfirmDialog
        open={warningNoReasonOpen}
        title="Envoyer sans motif ?"
        content="Vous allez envoyer un email de refus au client sans indiquer de motif. Voulez-vous continuer ?"
        onConfirm={executeRefusal}
        onCancel={() => setWarningNoReasonOpen(false)}
      />
    </Box>
  );
};

export default SingleRental;
