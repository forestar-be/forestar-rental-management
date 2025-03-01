import React, { useCallback, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import type { ColDef } from 'ag-grid-community/dist/types/core/entities/colDef';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import '../styles/MachineRentedTable.css';
import { addMachineRented } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MachineRented, MachineRentedCreated } from '../utils/types';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { toast } from 'react-toastify';
import CreateMachineDialog from '../components/CreateMachineDialog';
import { useGlobalData } from '../contexts/GlobalDataContext';

const rowHeight = 40;

const MachineRentedTable: React.FC = () => {
  const auth = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const gridRef = React.createRef<AgGridReact>();
  const {
    machineRentedList,
    refreshMachineRentedList,
    loadingMachineRentedList,
  } = useGlobalData();
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<MachineRentedCreated>({
    name: '',
    maintenance_type: 'BY_DAY',
    nb_day_before_maintenance: 0,
    nb_rental_before_maintenance: null,
    price_per_day: 0,
    guests: [],
    deposit: 0,
  });

  useEffect(() => {
    calculatePageSize();
  }, [machineRentedList]);

  const handleAddMachine = async (
    values: MachineRentedCreated & { image: File },
  ) => {
    try {
      setLoadingCreate(true);
      // remove empty guests
      values.guests = values.guests.filter((guest) => !!guest);

      if (values.maintenance_type === 'BY_NB_RENTAL') {
        values.nb_day_before_maintenance = null;
      } else {
        values.nb_rental_before_maintenance = null;
      }

      await addMachineRented(values, auth.token);
      await refreshMachineRentedList();
      setIsModalOpen(false);
      setInitialValues({
        name: '',
        maintenance_type: 'BY_DAY',
        nb_day_before_maintenance: 0,
        nb_rental_before_maintenance: null,
        price_per_day: 0,
        guests: [],
        deposit: 0,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      toast.error("Une erreur s'est produite lors de l'ajout de la machine");
    } finally {
      setLoadingCreate(false);
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
              href={`/machines/${params.value}`}
              rel="noopener noreferrer"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                navigate(`/machines/${params.value}`);
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ouvrir dans un nouvel onglet" arrow>
            <IconButton
              color="primary"
              component="a"
              href={`/machines/${params.value}`}
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
    <Paper
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      id="machineRentedTable"
    >
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
          rowData={loadingMachineRentedList ? [] : machineRentedList}
          columnDefs={columns}
          pagination={true}
          paginationPageSize={paginationPageSize}
          localeText={AG_GRID_LOCALE_FR}
          autoSizeStrategy={{
            type: 'fitGridWidth',
          }}
          paginationPageSizeSelector={false}
          overlayLoadingTemplate={
            '<span class="ag-overlay-loading-center">Chargement...</span>'
          }
          loadingOverlayComponentParams={{ loading: loadingMachineRentedList }}
          onGridReady={(params) => {
            if (loadingMachineRentedList) {
              params.api.showLoadingOverlay();
            } else {
              params.api.hideOverlay();
            }
          }}
        />
      </div>

      <CreateMachineDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddMachine}
        loadingCreate={loadingCreate}
        initialValues={initialValues}
      />
    </Paper>
  );
};

export default MachineRentedTable;
