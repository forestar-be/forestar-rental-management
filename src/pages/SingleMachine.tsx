import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/SingleRepair.css';
import { useTheme } from '@mui/material/styles';
import SingleMachineField from '../components/machine/SingleMachineField';
import { MachineLoading } from '../components/machine/MachineLoading';
import DeleteIcon from '@mui/icons-material/Delete';
import { MachineRented } from '../utils/types';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  deleteMachineApi,
  fetchMachineById,
  updateMachine,
} from '../utils/api';
import { toast } from 'react-toastify';
import { MachineSelect } from '../components/machine/MachineSelect';
import { SelectChangeEvent } from '@mui/material/Select/SelectInput';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { getKeys } from '../utils/common.utils';
import { MachineRentals } from '../components/machine/MachineRentals';
import { MachineRentalItem } from '../components/machine/MachineRentalItem';

const SingleMachine = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<null | MachineRented>(null);
  const [initialMachine, setInitialMachine] = useState<null | MachineRented>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const switchEditing = useCallback(() => {
    if (isEditing) {
      // compare initialMachine and machine
      if (initialMachine && machine) {
        const updatedData: Record<keyof MachineRented, any> = getKeys(
          machine,
        ).reduce((acc: any, key: keyof MachineRented) => {
          if (machine[key] !== initialMachine[key]) {
            acc[key] = machine[key];
          }
          return acc;
        }, {});
        if (Object.keys(updatedData).length > 0) {
          updateMachine(id!, updatedData, auth.token)
            .then(({ eventUpdateType, ...newPartialMachine }) => {
              toast.success('Machine mise à jour');
              const newMachine = { ...machine, ...newPartialMachine };
              setMachine(newMachine);
              setInitialMachine(newMachine);

              if (eventUpdateType && eventUpdateType !== 'none') {
                switch (eventUpdateType) {
                  case 'create':
                    toast.success(
                      "Evénement d'entretien crée dans le calendrier",
                    );
                    break;
                  case 'update':
                    toast.success(
                      "Evénement d'entretien mis à jour dans le calendrier",
                    );
                    break;
                  case 'delete':
                    toast.success(
                      "Evénement d'entretien supprimé dans le calendrier",
                    );
                    break;
                  default:
                    break;
                }
              }
            })
            .catch((error: Error) => {
              toast.error(
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
      const updatedData = { [name as keyof MachineRented]: value as unknown };
      const newMachine = { ...machine, ...updatedData } as MachineRented;
      if (name === 'maintenance_type') {
        if ((value as MachineRented['maintenance_type']) === 'BY_DAY') {
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
      const updatedData = { [name as keyof MachineRented]: value };
      const newMachine = { ...machine, ...updatedData } as MachineRented;
      setMachine(newMachine);
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
          toast.error(
            `Une erreur s'est produite lors de la suppression de la machine: ${error}`,
          );
          console.error('Error deleting machine:', error);
        });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) {
      alert('ID invalide');
      return;
    }
    const fetchData = async () => {
      try {
        const data: MachineRented = await fetchMachineById(id, auth.token);
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
    <SingleMachineField
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

  return (
    <Box sx={{ padding: 4, paddingTop: 2 }}>
      {loading && <MachineLoading />}
      <Grid container display={'flex'} mb={2}>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center">
            <Typography variant="h4" gutterBottom paddingTop={1}>
              Machine de location n°{id} - {machine?.name}
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
          <Grid item xs={6}>
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
          </Grid>
          <MachineRentals
            editing={isEditing}
            onAddRental={() => {
              const newRental = {
                rentalDate: new Date(),
                returnDate: null,
              };
              const updatedMachine = {
                ...machine,
                machineRentals: [...machine.machineRentals, newRental],
              };
              setMachine(updatedMachine as MachineRented);
            }}
            machine={machine}
            renderMachineRentalItem={(rental, index) => (
              <MachineRentalItem
                key={index}
                editing={isEditing}
                rental={rental}
                onChangeRentalDate={(date) => {
                  const updatedRentals = [...machine.machineRentals];
                  updatedRentals[index].rentalDate =
                    date?.toDate() ?? new Date();
                  setMachine({
                    ...machine,
                    machineRentals: updatedRentals,
                  } as MachineRented);
                }}
                onChangeReturnDate={(date) => {
                  const updatedRentals = [...machine.machineRentals];
                  updatedRentals[index].returnDate = date?.toDate() ?? null;
                  setMachine({
                    ...machine,
                    machineRentals: updatedRentals,
                  } as MachineRented);
                }}
                onDelete={() => {
                  const updatedRentals = machine.machineRentals.filter(
                    (_, rentalIndex) => rentalIndex !== index,
                  );
                  setMachine({
                    ...machine,
                    machineRentals: updatedRentals,
                  } as MachineRented);
                }}
              />
            )}
          />
        </Grid>
      )}
    </Box>
  );
};

export default SingleMachine;
