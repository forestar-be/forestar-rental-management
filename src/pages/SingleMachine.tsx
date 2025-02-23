import React, { useCallback, useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  ImageList,
  MenuItem,
  SxProps,
  Theme,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  MachineRentalWithMachineRented,
  MachineRentedPart,
  MachineRentedWithImage,
} from '../utils/types';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  deleteMachineApi,
  fetchMachineById,
  updateMachine,
  updateMachineRentedImage,
  addMaintenanceHistory,
} from '../utils/api';
import { MachineSelect } from '../components/machine/MachineSelect';
import { SelectChangeEvent } from '@mui/material/Select/SelectInput';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { compressImage, getKeys } from '../utils/common.utils';
import VisuallyHiddenInput from '../components/VisuallyHiddenInput';
import MachineRentalGrid, {
  COLUMN_ID_RENTAL_GRID,
} from '../components/MachineRentalGrid';
import MachineRentedImageItem from '../components/MachineRentedImageItem';
import {
  notifyError,
  notifyLoading,
  notifySuccess,
} from '../utils/notifications';
import MachineParts from '../components/machine/MachineParts';
import { Add as AddIcon } from '@mui/icons-material';
import { getAvailableParts } from '../utils/api';
import MaintenanceDialog from '../components/MaintenanceDialog';
import MaintenanceHistory from '../components/MaintenanceHistory';

const SingleMachine = () => {
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

  const [tabValue, setTabValue] = useState<number>(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState<Date | null>(null);
  const [maintenanceComment, setMaintenanceComment] = useState('');

  const [availableParts, setAvailableParts] = useState<string[]>([]);

  const switchEditing = useCallback(async () => {
    if (!isEditing) {
      setTabValue(1); // Switch to 'Entretiens & Pièces' tab when editing starts
    }
    if (isEditing && initialMachine && machine) {
      // Préparer les mises à jour de la machine
      const updatedData: Record<keyof MachineRentedWithImage, any> = getKeys(
        machine,
      ).reduce((acc: any, key: keyof MachineRentedWithImage) => {
        if (key === 'last_maintenance_date' || key === 'next_maintenance')
          return acc;

        const isDifferent = (obj1: any, obj2: any): boolean => {
          if (typeof obj1 !== typeof obj2) return true;
          if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
            return String(obj1) !== String(obj2);
          }
          if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) return true;
            for (let i = 0; i < obj1.length; i++) {
              if (isDifferent(obj1[i], obj2[i])) return true;
            }
            return false;
          }
          const keys1 = Object.keys(obj1);
          const keys2 = Object.keys(obj2);
          if (keys1.length !== keys2.length) return true;
          for (const key of keys1) {
            if (isDifferent(obj1[key], obj2[key])) return true;
          }
          return false;
        };

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
              switch (eventUpdateType) {
                case 'create':
                  notifySuccess(
                    "Evénement d'entretien crée dans le calendrier",
                  );
                  break;
                case 'update':
                  notifySuccess(
                    "Evénement d'entretien mis à jour dans le calendrier",
                  );
                  break;
                case 'delete':
                  notifySuccess(
                    "Evénement d'entretien supprimé dans le calendrier",
                  );
                  break;
                default:
                  break;
              }
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
      await Promise.all([machinePromise]);
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
    (value: string | Date | number | null, name: string) => {
      const updatedData = { [name as keyof MachineRentedWithImage]: value };
      const newMachine = {
        ...machine,
        ...updatedData,
      } as MachineRentedWithImage;
      setMachine(newMachine);
    },
    [machine],
  );

  const onUpdateImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      const file = files?.[0];
      if (file) {
        try {
          setLoading(true);
          const newImage = await compressImage(file);
          const res = await updateMachineRentedImage(id!, newImage, auth.token);

          const machineUpdated: MachineRentedWithImage = {
            ...machine!,
            imageUrl: res.imageUrl,
          };
          setMachine(machineUpdated);
          setInitialMachine(cloneDeep(machineUpdated));
        } catch (e) {
          console.error('Error compressing image:', e);
          notifyError("Erreur lors de la compression de l'image");
          return;
        } finally {
          setLoading(false);
        }
      }
    },
    [id, machine, auth.token],
  );

  const deleteMachine = useCallback(() => {
    if (!id) {
      alert('ID invalide');
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

  useEffect(() => {
    if (!id) {
      alert('ID invalide');
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
        alert(
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
    onChange?: (value: string | Date | number | null) => void,
    noValueDisplay?: string,
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

  const handleMaintenanceDone = async (date: Date | null, comment: string) => {
    if (!id) return;
    try {
      const newMaintenance = await addMaintenanceHistory(
        id,
        comment,
        auth.token,
      );
      setMachine((prevMachine) => ({
        ...prevMachine!,
        maintenanceHistories: [
          ...(prevMachine?.maintenanceHistories || []),
          newMaintenance,
        ],
      }));
    } catch (error: any) {
      notifyError("Erreur lors de l'ajout de l'entretien");
      console.error("Erreur lors de l'ajout de l'entretien", error);
    }
  };

  return (
    <Box sx={{ padding: 4, paddingTop: 2 }}>
      {loading && <MachineLoading />}
      {machine && (
        <Grid container spacing={2}>
          <Grid item xs={4} mt={1}>
            <Grid item xs={12} mb={1}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">Machine {machine?.name}</Typography>
              </Box>
            </Grid>
            {isEditing && (
              <Grid item xs={12} display={'flex'} gap={'10px'}>
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
            )}
            <Grid item xs={12} display={'flex'} gap={'10px'}>
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
            <Grid item xs={12} display={'flex'} gap={'10px'}>
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
            <Grid item xs={12} display={'flex'}>
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
            <Grid item xs={12} display={'flex'}>
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
            <Grid item xs={12} display={'flex'}>
              {renderField(
                'Prix par jour',
                'price_per_day',
                isEditing
                  ? machine.price_per_day
                  : `${machine.price_per_day} €`,
                isEditing ? 'number' : 'text',
                false,
                isEditing,
                12,
                'small',
              )}
            </Grid>
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
              touchedEmails={true}
              lastIndexEmail={machine.guests.length - 1}
              handleEditEmailGuestByIndex={handleEditEmailGuestByIndex}
              handleAddEmailGuest={handleAddEmailGuest}
              handleRemoveEmailGuest={handleRemoveEmailGuest}
              size="small"
            />
            <Grid item xs={12} display={'flex'}>
              <ImageList variant="masonry" cols={1} gap={8}>
                <MachineRentedImageItem
                  item={machine}
                  onClick={null}
                  showItemBar={false}
                >
                  {isEditing ? (
                    <IconButton
                      component={'label'}
                      color={'default'}
                      sx={{
                        position: 'absolute',
                        bottom: 5,
                        right: 5,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                      }}
                    >
                      <EditIcon />
                      <VisuallyHiddenInput
                        accept={'image/*'}
                        type="file"
                        onChange={onUpdateImage}
                      />
                    </IconButton>
                  ) : undefined}
                </MachineRentedImageItem>
              </ImageList>
            </Grid>
          </Grid>
          <Grid item xs={8}>
            <Grid
              container
              display={'flex'}
              mb={2}
              justifyContent="space-between"
            >
              <Grid item>
                <Tabs
                  value={tabValue}
                  onChange={(event, newValue) => setTabValue(newValue)}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab label="Locations" />
                  <Tab label="Entretiens & Pièces" />
                </Tabs>
              </Grid>
              <Grid item display={'flex'} flexDirection={'row'} gap={4}>
                <Button
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                >
                  Ajouter un entretien
                </Button>
                <Button
                  color={isEditing ? 'success' : 'warning'}
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={switchEditing}
                >
                  {isEditing ? 'enregistrer la machine' : 'modifier la machine'}
                </Button>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={deleteMachine}
                >
                  Supprimer la machine
                </Button>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, maxHeight: '75vh', height: '100%' }}>
              {tabValue === 0 && (
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
              )}
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
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
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
