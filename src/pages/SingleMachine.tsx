import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cloneDeep } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  MenuItem,
  SxProps,
  Theme,
  Typography,
  Tabs,
  Tab,
  Tooltip,
  Slider,
  Divider,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  MachineRentalWithMachineRented,
  MachineRentedAddon,
  MachineRentedCategory,
  MachineRentedPart,
  MachineRentedWithImage,
} from '../utils/types';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  deleteMachineApi,
  fetchMachineById,
  getAvailableAddons,
  getAvailableCategories,
  updateMachine,
  uploadMachineImages,
  deleteMachineImage,
  reorderMachineImages,
} from '../utils/api';
import { MachineSelect } from '../components/machine/MachineSelect';
import { SelectChangeEvent } from '@mui/material/Select/SelectInput';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import {
  formatPriceNumberToFrenchFormatStr,
  getKeys,
  isDifferent,
} from '../utils/common.utils';
import MachineRentalGrid, {
  COLUMN_ID_RENTAL_GRID,
} from '../components/MachineRentalGrid';
import {
  notifyError,
  notifyLoading,
  notifySuccess,
} from '../utils/notifications';
import MachineParts from '../components/machine/MachineParts';
import MachineAddons from '../components/machine/MachineAccessories';
import MachineCategories from '../components/machine/MachineCategories';
import MultiImageUpload from '../components/machine/MultiImageUpload';
import MachineVariants, {
  MachineVariantsHandle,
} from '../components/machine/MachineVariants';
import { Add as AddIcon } from '@mui/icons-material';
import { getAvailableParts } from '../utils/api';
import MaintenanceDialog from '../components/MaintenanceDialog';
import MaintenanceHistory from '../components/MaintenanceHistory';
import dayjs from 'dayjs';

const SingleMachine = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<null | MachineRentedWithImage>(null);
  const [initialMachine, setInitialMachine] =
    useState<null | MachineRentedWithImage>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notificationUpdating, setNotificationUpdating] =
    useState<null | ReturnType<typeof notifyLoading>>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [tabValue, setTabValue] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState<Date | null>(null);
  const [maintenanceComment, setMaintenanceComment] = useState('');

  const [availableParts, setAvailableParts] = useState<string[]>([]);
  const [availableAddons, setAvailableAddons] = useState<
    { name: string; price: number; category: string }[]
  >([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const variantsRef = React.useRef<MachineVariantsHandle>(null);

  const refreshMachine = useCallback(async () => {
    if (!id) return;
    try {
      const data: MachineRentedWithImage = await fetchMachineById(
        id,
        auth.token,
      );
      setMachine(data);
      setInitialMachine(cloneDeep(data));
    } catch (error) {
      console.error('Error refreshing machine:', error);
      notifyError(
        `Une erreur s'est produite lors du rafraîchissement des données`,
      );
    }
  }, [id, auth.token]);

  const switchEditing = useCallback(async () => {
    if (isEditing && initialMachine && machine) {
      // Préparer les mises à jour de la machine
      const updatedData: Record<keyof MachineRentedWithImage, any> = getKeys(
        machine,
      ).reduce((acc: any, key: keyof MachineRentedWithImage) => {
        if (key === 'last_maintenance_date' || key === 'next_maintenance')
          return acc;

        if (isDifferent(machine[key], initialMachine[key])) {
          acc[key] = machine[key];
        }
        return acc;
      }, {});

      // Mettre à jour la machine si nécessaire
      let machinePromise: Promise<any>;
      if (Object.keys(updatedData).length > 0) {
        notificationUpdating?.end();
        const notif = notifyLoading(
          'Mise à jour de la machine en cours',
          'Machine mise à jour',
          "Une erreur s'est produite lors de la mise à jour de la machine",
        );
        setNotificationUpdating(notif);
        machinePromise = updateMachine(id!, updatedData, auth.token)
          .then(({ eventUpdateType, ...newPartialMachine }) => {
            notif.success(null);
            const newMachine = { ...machine, ...newPartialMachine };
            setMachine(newMachine);
            setInitialMachine(cloneDeep(newMachine));
            if (eventUpdateType && eventUpdateType !== 'none') {
              handleEventUpdateNotification(eventUpdateType);
            }
          })
          .catch((error: Error) => {
            notif.error(
              `Une erreur s'est produite lors de la mise à jour de la machine: ${error}`,
            );
            console.error('Error updating machine:', error);
          });
      } else {
        machinePromise = Promise.resolve();
      }

      // Exécuter toutes les mises à jour et rafraîchir les entretiens
      await Promise.all([machinePromise, variantsRef.current?.saveAll()]);
    }
    setIsEditing(!isEditing);
  }, [
    isEditing,
    machine,
    initialMachine,
    id,
    auth.token,
    notificationUpdating,
  ]);

  const handleSelectChange = useCallback(
    (event: SelectChangeEvent<String>) => {
      const { name, value } = event.target;
      const updatedData = {
        [name as keyof MachineRentedWithImage]: value as unknown,
      };
      const newMachine = {
        ...machine,
        ...updatedData,
      } as MachineRentedWithImage;
      if (name === 'maintenance_type') {
        if (
          (value as MachineRentedWithImage['maintenance_type']) === 'BY_DAY'
        ) {
          newMachine.nb_rental_before_maintenance = null;
        } else {
          newMachine.nb_day_before_maintenance = null;
        }
      }
      setMachine(newMachine);
    },
    [id, machine, auth.token],
  );

  const handleChange = useCallback(
    (value: string | Date | number | boolean | null, name: string) => {
      const updatedData = { [name as keyof MachineRentedWithImage]: value };
      const newMachine = {
        ...machine,
        ...updatedData,
      } as MachineRentedWithImage;
      setMachine(newMachine);
    },
    [machine],
  );

  const deleteMachine = useCallback(() => {
    if (!id) {
      notifyError('ID invalide');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer cette machine ?')) {
      deleteMachineApi(id, auth.token)
        .then(() => {
          navigate('/');
        })
        .catch((error: Error) => {
          notifyError(
            `Une erreur s'est produite lors de la suppression de la machine: ${error}`,
          );
          console.error('Error deleting machine:', error);
        });
    }
  }, [auth.token, id, navigate]);

  // Multi-image handlers
  const handleImageUpload = useCallback(
    async (files: File[]) => {
      if (!id) return;
      setImageLoading(true);
      try {
        await uploadMachineImages(id, files, auth.token);
        await refreshMachine();
      } catch (error) {
        notifyError("Erreur lors de l'upload des images");
        console.error('Error uploading images:', error);
      } finally {
        setImageLoading(false);
      }
    },
    [id, auth.token, refreshMachine],
  );

  const handleImageDelete = useCallback(
    async (imageId: number) => {
      if (!id) return;
      try {
        await deleteMachineImage(id, String(imageId), auth.token);
        await refreshMachine();
      } catch (error) {
        notifyError("Erreur lors de la suppression de l'image");
        console.error('Error deleting image:', error);
      }
    },
    [id, auth.token, refreshMachine],
  );

  const handleImageReorder = useCallback(
    async (order: { imageId: number; position: number }[]) => {
      if (!id) return;
      try {
        await reorderMachineImages(id, order, auth.token);
        await refreshMachine();
      } catch (error) {
        notifyError('Erreur lors du réordonnancement des images');
        console.error('Error reordering images:', error);
      }
    },
    [id, auth.token, refreshMachine],
  );

  useEffect(() => {
    if (!id) {
      notifyError('ID invalide');
      return;
    }
    const fetchData = async () => {
      try {
        const data: MachineRentedWithImage = await fetchMachineById(
          id,
          auth.token,
        );
        if (!data) {
          throw new Error('Not data found');
        }
        console.debug('Data fetched:', data);
        setInitialMachine(cloneDeep(data));
        setMachine(data);
      } catch (error) {
        console.error('Error fetching machine:', error);
        notifyError(
          `Une erreur s'est produite lors de la récupération des données ${error}`,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, auth.token]);

  useEffect(() => {
    getAvailableParts(auth.token)
      .then((data: { parts: string[] }) => {
        setAvailableParts(data.parts);
      })
      .catch((err) => {
        console.error('Erreur lors du chargement des pièces existantes', err);
      });
    getAvailableAddons(auth.token)
      .then((data) => {
        setAvailableAddons(data.addons);
      })
      .catch((err) => {
        console.error(
          'Erreur lors du chargement des accessoires existants',
          err,
        );
      });
    getAvailableCategories(auth.token)
      .then((data) => {
        setAvailableCategories(data.categories);
      })
      .catch((err) => {
        console.error(
          'Erreur lors du chargement des catégories existantes',
          err,
        );
      });
  }, [auth.token]);

  const renderField = (
    label: string,
    name: string,
    value: string | Date | number | null,
    valueType: 'text' | 'date' | 'number' = 'text',
    isMultiline: boolean = false,
    isEditing: boolean,
    xs?: 6 | 12 | 3,
    size: 'small' | 'medium' = 'small',
    showLabelWhenNotEditing: boolean = true,
    onChange?: (value: string | Date | number | null | boolean) => void,
    noValueDisplay?: string,
    caption?: React.ReactNode | string,
  ) => (
    <SingleField
      label={label}
      name={name}
      value={value}
      valueType={valueType}
      isMultiline={isMultiline}
      isEditing={isEditing}
      handleChange={onChange ? onChange : handleChange}
      xs={xs}
      size={size}
      showLabelWhenNotEditing={showLabelWhenNotEditing}
      noValueDisplay={noValueDisplay}
      caption={caption}
    />
  );

  const renderSelect = (
    label: string,
    name: string,
    value: string,
    possibleValues: string[],
    sxFormControl: SxProps<Theme>,
    gridSize: 6 | 12,
    colorByValue: { [p: string]: string } = {},
    renderValue?: (value: string) => string,
    size: 'small' | 'medium' = 'small',
  ) => {
    return (
      <MachineSelect
        xs={gridSize}
        isEditing={isEditing}
        name={name}
        sx={sxFormControl}
        label={label}
        value={value}
        onChange={handleSelectChange}
        strings={possibleValues}
        callbackfn={(val) => (
          <MenuItem key={val} value={val}>
            {renderValue ? renderValue(val) : val}
          </MenuItem>
        )}
        colorByValue={colorByValue}
        renderValue={renderValue}
        size={size}
      />
    );
  };

  const handleEditEmailGuestByIndex = useCallback(
    (newEmail: string, index: number) => {
      setMachine((prevMachine) => {
        if (prevMachine) {
          const guests = [...prevMachine.guests];
          if (index >= guests.length || index < 0) {
            guests.push(newEmail);
          } else {
            guests[index] = newEmail;
          }
          return {
            ...prevMachine,
            guests,
          };
        }
        return null;
      });
    },
    [],
  );

  const handleRemoveEmailGuest = useCallback((emailToRemove: string) => {
    setMachine((prevMachine) => {
      if (prevMachine) {
        return {
          ...prevMachine,
          guests: prevMachine.guests.filter((email) => email !== emailToRemove),
        };
      }
      return null;
    });
  }, []);

  const handleAddEmailGuest = useCallback(() => {
    setMachine((prevMachine) => {
      if (prevMachine) {
        return {
          ...prevMachine,
          guests: [...prevMachine.guests, ''],
        };
      }
      return null;
    });
  }, []);

  const updateParts = useCallback((newParts: MachineRentedPart[]) => {
    setMachine((prevMachine) => ({
      ...prevMachine!,
      parts: newParts,
    }));
  }, []);

  const updateAddons = useCallback((newAddons: MachineRentedAddon[]) => {
    setMachine((prevMachine) => ({
      ...prevMachine!,
      addons: newAddons,
    }));
  }, []);

  const updateCategories = useCallback(
    (newCategories: MachineRentedCategory[]) => {
      setMachine((prevMachine) => ({
        ...prevMachine!,
        categories: newCategories,
      }));
    },
    [],
  );

  const handleMaintenanceDone = async (date: Date | null, comment: string) => {
    if (!id) return;
    try {
      const newMachineWithUpdateType = await updateMachine(
        id,
        {
          maintenanceHistories: [
            ...(machine?.maintenanceHistories || []),
            {
              performedAt: date || new Date(),
              notes: comment,
            },
          ],
        },
        auth.token,
      );

      const { eventUpdateType, ...newPartialMachine } =
        newMachineWithUpdateType;

      if (eventUpdateType && eventUpdateType !== 'none') {
        handleEventUpdateNotification(eventUpdateType);
      }

      const newMachine = { ...machine!, ...newPartialMachine };
      setMachine(newMachine);
      setInitialMachine(cloneDeep(newMachine));
    } catch (error: any) {
      notifyError("Erreur lors de l'ajout de l'entretien");
      console.error("Erreur lors de l'ajout de l'entretien", error);
    }
  };

  const handleEventUpdateNotification = useCallback(
    (eventUpdateType: string) => {
      switch (eventUpdateType) {
        case 'create':
          notifySuccess("Evénement d'entretien crée dans le calendrier");
          break;
        case 'update':
          notifySuccess("Evénement d'entretien mis à jour dans le calendrier");
          break;
        case 'delete':
          notifySuccess("Evénement d'entretien supprimé dans le calendrier");
          break;
        default:
          break;
      }
    },
    [],
  );

  const maxHeightAgGridTable = useMemo(() => {
    return 'calc(100vh - 210px)';
  }, []);

  const lastMeasurement = useMemo(() => {
    return machine?.lastMeasurementUpdate ? (
      <>
        Dernière mise à jour:{' '}
        {dayjs(machine.lastMeasurementUpdate).format('DD/MM/YYYY HH:mm')}
        {machine.lastMeasurementUser && ` par ${machine.lastMeasurementUser}`}
      </>
    ) : undefined;
  }, [machine]);

  return (
    <Box sx={{ padding: 4, paddingTop: 2, pb: 0 }}>
      {loading && <MachineLoading />}
      {machine && (
        <Box>
          {/* Header with title and action buttons */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">{`Machine ${machine.name}`}</Typography>
            <Box display="flex" flexDirection="row" gap={2}>
              <Button
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Ajouter un entretien
              </Button>
              <Tooltip
                arrow
                title={
                  isEditing
                    ? 'Enregistrer les modifications'
                    : 'Modifier la machine'
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
              <Tooltip arrow title="Supprimer la machine">
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={deleteMachine}
                >
                  Supprimer
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 2 }}
          >
            <Tab label="Général" />
            <Tab label="Configuration" />
            <Tab label="Variantes" />
            <Tab label="Locations" />
          </Tabs>

          {/* Tab content */}
          <Box
            sx={{
              mt: 1,
              height: tabValue === 3 ? maxHeightAgGridTable : 'auto',
            }}
          >
            {/* Général tab */}
            {tabValue === 0 && (
              <Grid container spacing={2}>
                {/* Name field (always shown in Général, editable when isEditing) */}
                <Grid item xs={12}>
                  {renderField(
                    'Nom',
                    'name',
                    machine.name,
                    'text',
                    false,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>

                {/* Maintenance settings */}
                <Grid item xs={6}>
                  {renderSelect(
                    'Type de maintenance',
                    'maintenance_type',
                    machine.maintenance_type,
                    ['BY_DAY', 'BY_NB_RENTAL'],
                    { width: '100%' },
                    12,
                    {},
                    (value: string) => TYPE_VALUE_ASSOCIATION[value] ?? value,
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {machine.maintenance_type === 'BY_DAY'
                    ? renderField(
                        'Nombre de jour avant maintenance',
                        'nb_day_before_maintenance',
                        machine.nb_day_before_maintenance,
                        'number',
                        false,
                        isEditing,
                        12,
                        'small',
                      )
                    : renderField(
                        'Nombre de location avant maintenance',
                        'nb_rental_before_maintenance',
                        machine.nb_rental_before_maintenance,
                        'number',
                        false,
                        isEditing,
                        12,
                        'small',
                      )}
                </Grid>
                <Grid item xs={6}>
                  {renderField(
                    'Date de dernière maintenance',
                    'last_maintenance_date',
                    machine.last_maintenance_date,
                    'date',
                    false,
                    false,
                    12,
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {renderField(
                    'Date de prochaine maintenance',
                    'next_maintenance',
                    machine.next_maintenance,
                    'date',
                    false,
                    false,
                    12,
                    'small',
                  )}
                </Grid>

                {/* Price and deposit */}
                <Grid item xs={6}>
                  {renderField(
                    'Prix par jour',
                    'price_per_day',
                    isEditing
                      ? machine.price_per_day
                      : formatPriceNumberToFrenchFormatStr(
                          machine.price_per_day,
                        ),
                    isEditing ? 'number' : 'text',
                    false,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {renderField(
                    'Caution',
                    'deposit',
                    isEditing
                      ? machine.deposit
                      : formatPriceNumberToFrenchFormatStr(machine.deposit),
                    isEditing ? 'number' : 'text',
                    false,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {renderSelect(
                    "Type d'acompte de réservation",
                    'reservationDepositMode',
                    machine.reservationDepositMode,
                    ['PERCENT', 'FIXED'],
                    { width: '100%' },
                    12,
                    {},
                    (value: string) =>
                      value === 'PERCENT' ? 'Pourcentage' : 'Montant fixe',
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {renderField(
                    machine.reservationDepositMode === 'PERCENT'
                      ? 'Acompte de réservation (%)'
                      : 'Acompte de réservation (€)',
                    'reservationDepositValue',
                    machine.reservationDepositValue,
                    'number',
                    false,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  {renderField(
                    'Description',
                    'description',
                    machine.description,
                    'text',
                    true,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>

                {/* Guests */}
                <Grid item xs={12}>
                  <SingleField
                    label="Invités"
                    name="guests"
                    value={machine.guests.join(', ')}
                    valueType="guest_email_list"
                    isEditing={isEditing}
                    xs={12}
                    handleChange={() => {}} // not used with guest_email_list
                    emails={machine.guests}
                    errorsEmails={[]}
                    touchedEmails={[]}
                    lastIndexEmail={machine.guests.length - 1}
                    handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
                    handleAddEmailGuest={handleAddEmailGuest}
                    handleRemoveEmailGuest={handleRemoveEmailGuest}
                    size="small"
                  />
                </Grid>

                {/* Measurements */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 2, mb: 0, fontWeight: 'medium' }}
                  >
                    Mesures de la machine
                  </Typography>
                  <Divider />
                </Grid>
                <Grid item xs={6}>
                  {renderField(
                    'Heures de fonctionnement',
                    'operatingHours',
                    machine.operatingHours,
                    'number',
                    false,
                    isEditing,
                    12,
                    'small',
                  )}
                </Grid>
                <Grid item xs={6}>
                  {isEditing ? (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Niveau de carburant ({machine.fuelLevel || 0}%)
                      </Typography>
                      <Slider
                        value={machine.fuelLevel || 0}
                        onChange={(_, value) =>
                          handleChange(value as number, 'fuelLevel')
                        }
                        aria-labelledby="fuel-level-slider"
                        step={1}
                        marks
                        min={0}
                        max={100}
                      />
                    </>
                  ) : (
                    renderField(
                      'Niveau de carburant',
                      'fuelLevel',
                      `${machine.fuelLevel} %`,
                      'text',
                      false,
                      false,
                      12,
                      'small',
                      undefined,
                      undefined,
                      undefined,
                      lastMeasurement,
                    )
                  )}
                </Grid>

                {/* Images */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 2, mb: 1, fontWeight: 'medium' }}
                  >
                    Images
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <MultiImageUpload
                    images={machine.images || []}
                    isEditing={isEditing}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    onReorder={handleImageReorder}
                    loading={imageLoading}
                  />
                </Grid>
              </Grid>
            )}

            {/* Configuration tab */}
            {tabValue === 1 && (
              <Grid container spacing={2}>
                <MaintenanceHistory
                  machine={machine}
                  isEditing={isEditing}
                  setMachine={setMachine}
                />
                <Grid item xs={6}>
                  <MachineParts
                    parts={machine.parts || []}
                    isEditing={isEditing}
                    onChange={updateParts}
                    availableParts={availableParts}
                  />
                </Grid>
                <Grid item xs={6}>
                  <MachineAddons
                    addons={(machine.addons || []).filter(
                      (a) => a.category === 'accessory',
                    )}
                    isEditing={isEditing}
                    onChange={(newAddons) =>
                      updateAddons([
                        ...newAddons,
                        ...(machine.addons || []).filter(
                          (a) => a.category === 'option',
                        ),
                      ])
                    }
                    availableAddons={availableAddons.filter(
                      (a) => a.category === 'accessory',
                    )}
                    category="accessory"
                    title="Accessoires"
                  />
                </Grid>
                <Grid item xs={6}>
                  <MachineAddons
                    addons={(machine.addons || []).filter(
                      (a) => a.category === 'option',
                    )}
                    isEditing={isEditing}
                    onChange={(newAddons) =>
                      updateAddons([
                        ...(machine.addons || []).filter(
                          (a) => a.category === 'accessory',
                        ),
                        ...newAddons,
                      ])
                    }
                    availableAddons={availableAddons.filter(
                      (a) => a.category === 'option',
                    )}
                    category="option"
                    title="Options"
                  />
                </Grid>
                <Grid item xs={6}>
                  <MachineCategories
                    categories={machine.categories || []}
                    isEditing={isEditing}
                    onChange={updateCategories}
                    availableCategories={availableCategories}
                  />
                </Grid>
              </Grid>
            )}

            {/* Variantes tab */}
            {tabValue === 2 && (
              <MachineVariants
                ref={variantsRef}
                machine={machine}
                isEditing={isEditing}
                onMachineUpdate={refreshMachine}
                token={auth.token}
              />
            )}

            {/* Locations tab */}
            {tabValue === 3 && (
              <Box sx={{ height: maxHeightAgGridTable }}>
                <MachineRentalGrid
                  rowData={
                    loading
                      ? []
                      : (machine.machineRentals as MachineRentalWithMachineRented[])
                  }
                  loading={loading}
                  columnsToShow={[
                    COLUMN_ID_RENTAL_GRID.ID,
                    COLUMN_ID_RENTAL_GRID.CLIENT_FIRST_NAME,
                    COLUMN_ID_RENTAL_GRID.CLIENT_LAST_NAME,
                    COLUMN_ID_RENTAL_GRID.RENTAL_DATE,
                    COLUMN_ID_RENTAL_GRID.RETURN_DATE,
                  ]}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}
      <MaintenanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maintenanceDate={maintenanceDate}
        maintenanceComment={maintenanceComment}
        setMaintenanceDate={setMaintenanceDate}
        setMaintenanceComment={setMaintenanceComment}
        handleMaintenanceDone={handleMaintenanceDone}
      />
    </Box>
  );
};

export default SingleMachine;
