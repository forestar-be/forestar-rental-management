import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  Box,
  Button,
  Chip,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import type { ColDef, GridReadyEvent, RowClickedEvent } from 'ag-grid-community';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import '../styles/MachineRentedTable.css';
import { addMachineRented } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { MachineRented, MachineRentedCreated } from '../utils/types';
import { TYPE_VALUE_ASSOCIATION } from '../config/constants';
import { toast } from 'react-toastify';
import CreateMachineDialog from '../components/CreateMachineDialog';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMachineRented } from '../store/slices/machineRentedSlice';
import {
  getMachineRentedList,
  getMachineRentedLoading,
} from '../store/selectors';
import { StyledAgGridWrapper } from '../components/styles/AgGridStyles';

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

  const dispatch = useAppDispatch();
  const machineRentedList = useAppSelector(getMachineRentedList);
  const loadingMachineRentedList = useAppSelector(getMachineRentedLoading);

  const refreshMachineRentedList = useCallback(() => {
    if (auth.token) {
      dispatch(fetchMachineRented(auth.token));
    }
  }, [dispatch, auth.token]);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<MachineRentedCreated>({
    name: '',
    description: null,
    maintenance_type: 'BY_DAY',
    nb_day_before_maintenance: 0,
    nb_rental_before_maintenance: null,
    price_per_day: 0,
    guests: [],
    deposit: 0,
    reservationDepositMode: 'PERCENT',
    reservationDepositValue: 50,
    operatingHours: null,
    fuelLevel: null,
    lastMeasurementUpdate: null,
    lastMeasurementUser: null,
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
          description: null,
          maintenance_type: 'BY_DAY',
          nb_day_before_maintenance: 0,
          nb_rental_before_maintenance: null,
          price_per_day: 0,
          guests: [],
          deposit: 0,
          reservationDepositMode: 'PERCENT',
          reservationDepositValue: 50,
          operatingHours: null,
          fuelLevel: null,
          lastMeasurementUpdate: null,
          lastMeasurementUser: null,
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

  // Next maintenance renderer with colored chips
  const NextMaintenanceRenderer = useCallback(
    (params: { value: string | null }) => {
      if (!params.value) return <span>Non défini</span>;

      const nextMaintenanceDate = new Date(params.value);
      const today = new Date();

      // Reset hours, minutes, seconds, and milliseconds for date comparison
      today.setHours(0, 0, 0, 0);
      nextMaintenanceDate.setHours(0, 0, 0, 0);

      const diffTime = nextMaintenanceDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Format the date for display
      const formattedDate = nextMaintenanceDate.toLocaleDateString('fr-FR');

      // Determine chip color and tooltip text based on days until maintenance
      let chipColor: 'error' | 'warning' | 'success' = 'success';
      let tooltipText = `Maintenance prévue dans ${diffDays} jours`;

      if (diffDays <= 0) {
        chipColor = 'error';
        tooltipText =
          diffDays === 0
            ? "Maintenance prévue aujourd'hui"
            : 'Maintenance en retard';
      } else if (diffDays <= 3) {
        chipColor = 'warning';
        tooltipText = `Maintenance prévue dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }

      return (
        <Tooltip title={tooltipText} arrow placement="left">
          <Chip
            label={formattedDate}
            color={chipColor}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Tooltip>
      );
    },
    [],
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

  const formatNextMaintenanceCounter = useCallback(
    (params: { data?: MachineRented }) => {
      if (!params.data) return 'Non défini';

      const {
        maintenance_type,
        nb_day_before_maintenance,
        nb_rental_before_maintenance,
      } = params.data;

      if (maintenance_type === 'BY_DAY' && nb_day_before_maintenance !== null) {
        return `${nb_day_before_maintenance} jours`;
      } else if (
        maintenance_type === 'BY_NB_RENTAL' &&
        nb_rental_before_maintenance !== null
      ) {
        return `${nb_rental_before_maintenance} locations`;
      }

      return 'Non défini';
    },
    [],
  );

  const columns = useMemo(() => {
    const columnDefs: ColDef<MachineRented>[] = [
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
        headerName: 'Maintenance tous les',
        field: 'maintenance_type',
        valueGetter: (params) => params.data,
        valueFormatter: formatNextMaintenanceCounter,
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
        cellRenderer: NextMaintenanceRenderer,
      },
    ];
    return columnDefs;
  }, [
    formatMaintenanceType,
    formatDate,
    formatNextMaintenanceCounter,
    NextMaintenanceRenderer,
  ]);

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
    (params: GridReadyEvent<MachineRented>) => {
      if (loadingMachineRentedList) {
        params.api.showLoadingOverlay();
      } else {
        params.api.hideOverlay();
      }
      calculatePageSize();
    },
    [loadingMachineRentedList, calculatePageSize],
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<MachineRented>) => {
      if (event.data?.id) {
        handleRowOpen(Number(event.data.id));
      }
    },
    [handleRowOpen],
  );

  return (
    <Paper
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      id="machineRentedTable"
    >
      <Box
        sx={{
          py: 1,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Machines en location</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsModalOpen(true)}
          >
            Ajouter une machine
          </Button>
        </Box>
      </Box>
      <StyledAgGridWrapper
        id="machine-repairs-table"
        className={`machine-repairs-table ag-theme-quartz${theme.palette.mode === 'dark' ? '-dark' : ''}`}
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
          onRowClicked={handleRowClicked}
        />
      </StyledAgGridWrapper>

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
