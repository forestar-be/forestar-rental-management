import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  MenuItem,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleField from '../components/machine/SingleField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  MachineRentalWithMachineRented,
  MachineRentedWithImage,
} from '../utils/types';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  deleteMachineApi,
  fetchMachineById,
  updateMachine,
  updateMachineRentedImage,
} from '../utils/api';
import { toast } from 'react-toastify';
import { MachineSelect } from '../components/machine/MachineSelect';
import { SelectChangeEvent } from '@mui/material/Select/SelectInput';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { compressImage, getKeys } from '../utils/common.utils';
import { MachineRentals } from '../components/machine/MachineRentals';
import { MachineRentalItem } from '../components/machine/MachineRentalItem';
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

  const switchEditing = useCallback(() => {
    if (isEditing) {
      // compare initialMachine and machine
      if (initialMachine && machine) {
        const updatedData: Record<keyof MachineRentedWithImage, any> = getKeys(
          machine,
        ).reduce((acc: any, key: keyof MachineRentedWithImage) => {
          if (machine[key] !== initialMachine[key]) {
            acc[key] = machine[key];
          }
          return acc;
        }, {});
        if (Object.keys(updatedData).length > 0) {
          const notif = notifyLoading(
            'Mise à jour de la machine en cours',
            'Machine mise à jour',
            "Une erreur s'est produite lors de la mise à jour de la machine",
          );
          updateMachine(id!, updatedData, auth.token)
            .then(({ eventUpdateType, ...newPartialMachine }) => {
              notif.success(null);
              const newMachine = { ...machine, ...newPartialMachine };
              setMachine(newMachine);
              setInitialMachine(newMachine);

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
        }
      }
    }

    setIsEditing(!isEditing);
  }, [isEditing, machine, initialMachine, id, auth.token]);

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
          setInitialMachine(machineUpdated);
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
        setInitialMachine(data);
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

  const renderField = (
    label: string,
    name: string,
    value: string | Date | number | null,
    valueType: 'text' | 'date' | 'number' = 'text',
    isMultiline: boolean = false,
    isEditing: boolean,
    xs?: 6 | 12 | 3,
  ) => (
    <SingleField
      label={label}
      name={name}
      value={value}
      valueType={valueType}
      isMultiline={isMultiline}
      isEditing={isEditing}
      handleChange={handleChange}
      xs={xs}
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

  return (
    <Box sx={{ padding: 4, paddingTop: 2 }}>
      {loading && <MachineLoading />}
      <Grid container display={'flex'} mb={2}>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center">
            <Typography variant="h4" gutterBottom paddingTop={1}>
              {machine?.name}
            </Typography>
            <IconButton onClick={switchEditing}>
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </IconButton>
          </Box>
        </Grid>
        <Grid
          item
          xs={6}
          display={'flex'}
          flexDirection={'row-reverse'}
          gap={4}
        >
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={deleteMachine}
          >
            Supprimer la machine
          </Button>
        </Grid>
      </Grid>
      {machine && (
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Grid item xs={12} mb={1}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">Informations</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} display={'flex'} gap={'10px'}>
              {renderField(
                'Nom',
                'name',
                machine.name,
                'text',
                false,
                isEditing,
                12,
              )}
            </Grid>
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
                  )
                : renderField(
                    'Nombre de location avant maintenance',
                    'nb_rental_before_maintenance',
                    machine.nb_rental_before_maintenance,
                    'number',
                    false,
                    isEditing,
                    12,
                  )}
            </Grid>
            <Grid item xs={12} display={'flex'}>
              {renderField(
                'Date de dernière maintenance',
                'last_maintenance_date',
                machine.last_maintenance_date,
                'date',
                false,
                isEditing,
                12,
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
          <Grid item xs={8} maxHeight={'75vh'}>
            <Grid item xs={12} mb={1}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">Locations</Typography>
              </Box>
            </Grid>
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
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SingleMachine;
