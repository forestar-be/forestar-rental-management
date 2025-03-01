import React, { useCallback, useEffect, useState, useMemo } from 'react';
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

// Base column configuration to reduce repetition
const baseColDef = {
  sortable: true,
  filter: true,
  filterParams: {
    buttons: ['reset', 'apply'],
  },
};

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

  const handleAddMachine = useCallback(
    async (values: MachineRentedCreated & { image: File }) => {
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
    },
    [auth.token, refreshMachineRentedList],
  );

  const handleRowOpen = useCallback(
    (id: number) => {
      navigate(`/machines/${id}`);
    },
    [navigate],
  );

  // Memoized cell renderers
  const ActionsRenderer = useCallback(
    (params: { value: number }) => (
      <>
        <Tooltip title="Ouvrir" arrow>
          <IconButton
            color="primary"
            onClick={() => handleRowOpen(params.value)}
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
    [handleRowOpen],
  );

  // Memoized formatters
  const formatMaintenanceType = useCallback(
    (params: { value: MachineRented['maintenance_type'] }) => {
      const valueToShow = TYPE_VALUE_ASSOCIATION[params.value];
      return valueToShow ?? 'Non défini';
    },
    [],
  );

  const formatDate = useCallback((params: { value: string | null }) => {
    return params.value
      ? new Date(params.value).toLocaleDateString('fr-FR')
      : 'Non défini';
  }, []);

  const columns = useMemo(() => {
    const columnDefs: ColDef<MachineRented>[] = [
      {
        headerName: '',
        field: 'id',
        cellRenderer: ActionsRenderer,
        width: 180,
      },
      {
        ...baseColDef,
        headerName: 'Nom',
        field: 'name',
      },
      {
        ...baseColDef,
        headerName: 'Type de maintenance',
        field: 'maintenance_type',
        valueFormatter: formatMaintenanceType,
      },
      {
        ...baseColDef,
        headerName: 'Nb jours avant maintenance',
        field: 'nb_day_before_maintenance',
      },
      {
        ...baseColDef,
        headerName: 'Nb locations avant maintenance',
        field: 'nb_rental_before_maintenance',
      },
      {
        ...baseColDef,
        headerName: 'Dernière maintenance',
        field: 'last_maintenance_date',
        filter: 'agDateColumnFilter',
        valueFormatter: formatDate,
      },
      {
        ...baseColDef,
        headerName: 'Prochaine maintenance',
        field: 'next_maintenance',
        filter: 'agDateColumnFilter',
        valueFormatter: formatDate,
      },
    ];
    return columnDefs;
  }, [ActionsRenderer, formatMaintenanceType, formatDate]);

  const calculatePageSize = useCallback(() => {
    const element = document.getElementById('machine-repairs-table');
    const footer = document.querySelector('.ag-paging-panel');
    const header = document.querySelector('.ag-header-viewport');
    if (element) {
      const elementHeight = element.clientHeight;
      const footerHeight = footer?.clientHeight ?? 48;
      const headerHeight = header?.clientHeight ?? 48;
      const newPageSize = Math.floor(
        (elementHeight - headerHeight - footerHeight) / rowHeight,
      );
      setPaginationPageSize(newPageSize);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', calculatePageSize);
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [calculatePageSize]);

  const onGridReady = useCallback(
    (params: any) => {
      if (loadingMachineRentedList) {
        params.api.showLoadingOverlay();
      } else {
        params.api.hideOverlay();
      }
    },
    [loadingMachineRentedList],
  );

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
          onGridReady={onGridReady}
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
