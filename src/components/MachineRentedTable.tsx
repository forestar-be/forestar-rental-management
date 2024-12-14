import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import type { ColDef } from 'ag-grid-community/dist/types/core/entities/colDef';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import '../styles/MachineRentedTable.css';
import { getAllMachineRented, addMachineRented } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MachineRented, MachineRentedCreated } from '../utils/types';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { MachineSelect } from './machine/MachineSelect';
import SingleMachineField from './machine/SingleMachineField';

const rowHeight = 40;

const MachineRentedTable: React.FC = () => {
  const auth = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const gridRef = React.createRef<AgGridReact>();
  const [machineRentedList, setMachineRentedList] = useState<MachineRented[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false); // État pour le modal
  const [newMachine, setNewMachine] = useState<MachineRentedCreated>({
    name: '',
    maintenance_type: 'BY_DAY',
    nb_day_before_maintenance: 0,
    nb_rental_before_maintenance: 0,
    last_maintenance_date: null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data: MachineRented[] = await getAllMachineRented(auth.token);
      setMachineRentedList(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert("Une erreur s'est produite lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculatePageSize();
  }, [machineRentedList]);

  const handleAddMachine = async () => {
    try {
      const addedMachine = await addMachineRented(newMachine, auth.token);
      setMachineRentedList((prev) => [...prev, addedMachine]);
      setIsModalOpen(false);
      setNewMachine({
        name: '',
        maintenance_type: 'BY_DAY',
        nb_day_before_maintenance: 0,
        nb_rental_before_maintenance: 0,
        last_maintenance_date: null,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      alert("Une erreur s'est produite lors de l'ajout de la machine");
    }
  };

  const columns: ColDef<MachineRented>[] = [
    {
      headerName: '',
      field: 'id',
      cellRenderer: (params: { value: number }) => (
        <>
          <Tooltip title="Ouvrir" arrow>
            <IconButton
              color="primary"
              component="a"
              href={`/machine/${params.value}`}
              rel="noopener noreferrer"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                navigate(`/machine/${params.value}`);
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ouvrir dans un nouvel onglet" arrow>
            <IconButton
              color="primary"
              component="a"
              href={`/machine/${params.value}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
      width: 180,
    },
    {
      headerName: 'Nom',
      field: 'name' as keyof MachineRented,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Type de maintenance',
      field: 'maintenance_type' as keyof MachineRented,
      sortable: true,
      filter: true,
      valueFormatter: (params: {
        value: MachineRented['maintenance_type'];
      }) => {
        const valueToShow = TYPE_VALUE_ASSOCIATION[params.value];

        return valueToShow ?? 'Non défini';
      },
    },
    {
      headerName: 'Nb jours avant maintenance',
      field: 'nb_day_before_maintenance' as keyof MachineRented,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Nb locations avant maintenance',
      field: 'nb_rental_before_maintenance' as keyof MachineRented,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Dernière maintenance',
      field: 'last_maintenance_date' as keyof MachineRented,
      sortable: true,
      filter: true,
      valueFormatter: (params: {
        value: MachineRented['last_maintenance_date'];
      }) => {
        return params.value
          ? new Date(params.value).toLocaleDateString('fr-FR')
          : 'Non défini';
      },
    },
    {
      headerName: 'Prochaine maintenance',
      field: 'next_maintenance' as keyof MachineRented,
      sortable: true,
      filter: true,
      valueFormatter: (params: {
        value: MachineRented['next_maintenance'];
      }) => {
        return params.value
          ? new Date(params.value).toLocaleDateString('fr-FR')
          : 'Non défini';
      },
    },
  ];

  const calculatePageSize = () => {
    const element = document.getElementById('machine-repairs-table');
    const footer = document.querySelector('.ag-paging-panel');
    const header = document.querySelector('.ag-header-viewport');
    if (element && footer && header) {
      const elementHeight = element.clientHeight;
      const footerHeight = footer.clientHeight;
      const headerHeight = header.clientHeight;
      const newPageSize = Math.floor(
        (elementHeight - headerHeight - footerHeight) / rowHeight,
      );
      setPaginationPageSize(newPageSize);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', calculatePageSize);
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, []);

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Machines en location</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Ajouter une machine
        </Button>
      </div>
      <div
        id="machine-repairs-table"
        className={`machine-repairs-table ag-theme-quartz${theme.palette.mode === 'dark' ? '-dark' : ''}`}
        style={{ height: '100%', width: '100%' }}
      >
        <AgGridReact
          rowHeight={rowHeight}
          ref={gridRef}
          rowData={machineRentedList}
          columnDefs={columns}
          pagination={true}
          paginationPageSize={paginationPageSize}
          localeText={AG_GRID_LOCALE_FR}
          autoSizeStrategy={{
            type: 'fitGridWidth',
          }}
          paginationPageSizeSelector={false}
        />
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={{ paper: 'dialog-paper' }}
      >
        <form onSubmit={handleAddMachine}>
          <DialogTitle>Ajouter une machine</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <SingleMachineField
                label="Nom"
                name={'name'}
                value={newMachine.name}
                valueType={'text'}
                isMultiline={false}
                isEditing={true}
                handleChange={(value, name) => {
                  setNewMachine({ ...newMachine, [name]: value });
                }}
                xs={12}
                required
              />
              <MachineSelect
                required
                xs={12}
                isEditing={true}
                name={'maintenance_type'}
                sx={{ width: '100%' }}
                label="Type de maintenance"
                value={newMachine.maintenance_type}
                onChange={(e) => {
                  const newType = e.target
                    .value as MachineRentedCreated['maintenance_type'];
                  setNewMachine({
                    ...newMachine,
                    maintenance_type: newType,
                    ...(newType === 'BY_DAY' && {
                      nb_rental_before_maintenance: null,
                    }),
                    ...(newType === 'BY_NB_RENTAL' && {
                      nb_day_before_maintenance: null,
                    }),
                  });
                }}
                strings={['BY_DAY', 'BY_NB_RENTAL']}
                callbackfn={(val) => (
                  <MenuItem key={val} value={val}>
                    {TYPE_VALUE_ASSOCIATION[val] ?? val}
                  </MenuItem>
                )}
                colorByValue={{}}
                renderValue={(val) => TYPE_VALUE_ASSOCIATION[val] ?? val}
              />
              {newMachine.maintenance_type === 'BY_DAY' && (
                <SingleMachineField
                  label="Nb jours avant maintenance"
                  name="nb_day_before_maintenance"
                  value={newMachine.nb_day_before_maintenance}
                  valueType={'number'}
                  isMultiline={false}
                  isEditing={true}
                  handleChange={(value, name) => {
                    setNewMachine({ ...newMachine, [name]: value });
                  }}
                  xs={12}
                />
              )}
              {newMachine.maintenance_type === 'BY_NB_RENTAL' && (
                <SingleMachineField
                  label="Nb locations avant maintenance"
                  name="nb_rental_before_maintenance"
                  value={newMachine.nb_rental_before_maintenance}
                  valueType={'number'}
                  isMultiline={false}
                  isEditing={true}
                  handleChange={(value, name) => {
                    setNewMachine({ ...newMachine, [name]: value });
                  }}
                  xs={12}
                />
              )}
              <SingleMachineField
                label="Dernière maintenance"
                name="last_maintenance_date"
                value={newMachine.last_maintenance_date}
                valueType={'date'}
                isMultiline={false}
                isEditing={true}
                handleChange={(value, name) => {
                  setNewMachine({ ...newMachine, [name]: value });
                }}
                xs={12}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={
                !newMachine.name ||
                !newMachine.maintenance_type ||
                !newMachine.last_maintenance_date ||
                (newMachine.maintenance_type === 'BY_DAY' &&
                  !newMachine.nb_day_before_maintenance) ||
                (newMachine.maintenance_type === 'BY_NB_RENTAL' &&
                  !newMachine.nb_rental_before_maintenance)
              }
            >
              Ajouter
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default MachineRentedTable;
