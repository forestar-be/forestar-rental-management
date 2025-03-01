import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useTheme, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { ColDef } from 'ag-grid-community/dist/types/core/entities/colDef';
import { useNavigate } from 'react-router-dom';
import { MachineRentalWithMachineRented } from '../utils/types';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';

export enum COLUMN_ID_RENTAL_GRID {
  ID = 'id',
  CLIENT_FIRST_NAME = 'clientFirstName',
  CLIENT_LAST_NAME = 'clientLastName',
  RENTAL_DATE = 'rentalDate',
  RETURN_DATE = 'returnDate',
  MACHINE_NAME = 'machineRented.name',
}

interface MachineRentalGridProps {
  rowData: MachineRentalWithMachineRented[];
  rowHeight?: number;
  loading?: boolean;
  columnsToShow?: 'all' | COLUMN_ID_RENTAL_GRID[];
}

const MachineRentalGrid: React.FC<MachineRentalGridProps> = ({
  rowData,
  rowHeight = 40,
  loading = false,
  columnsToShow = 'all',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const gridRef = React.createRef<AgGridReact>();

  useEffect(() => {
    calculatePageSize();
  }, [rowData]);

  // Common column configurations to avoid repetition
  const baseColumnConfig = useMemo(
    () => ({
      sortable: true,
      filter: true,
      filterParams: {
        buttons: ['reset', 'apply'],
      },
    }),
    [],
  );

  // Date column formatter
  const formatDate = useCallback(
    (params: { value: string }) =>
      params.value
        ? new Date(params.value).toLocaleDateString('fr-FR')
        : 'Non défini',
    [],
  );

  // Action cell renderer
  const actionCellRenderer = useCallback(
    (params: { value: number }) => (
      <>
        <Tooltip title="Ouvrir" arrow>
          <IconButton
            color="primary"
            component="a"
            href={`/machines/${params.value}`}
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate(`/locations/${params.value}`);
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ouvrir dans un nouvel onglet" arrow>
          <IconButton
            color="primary"
            component="a"
            href={`/locations/${params.value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
      </>
    ),
    [navigate],
  );

  const allColumns = useMemo<ColDef<MachineRentalWithMachineRented>[]>(
    () => [
      {
        headerName: '',
        field: COLUMN_ID_RENTAL_GRID.ID,
        cellRenderer: actionCellRenderer,
        width: 180,
      },
      {
        headerName: 'Machine',
        field: COLUMN_ID_RENTAL_GRID.MACHINE_NAME,
        ...baseColumnConfig,
      },
      {
        headerName: 'Prénom',
        field: COLUMN_ID_RENTAL_GRID.CLIENT_FIRST_NAME,
        ...baseColumnConfig,
      },
      {
        headerName: 'Nom',
        field: COLUMN_ID_RENTAL_GRID.CLIENT_LAST_NAME,
        ...baseColumnConfig,
      },
      {
        headerName: 'Date de début',
        field: COLUMN_ID_RENTAL_GRID.RENTAL_DATE,
        ...baseColumnConfig,
        filter: 'agDateColumnFilter',
        valueFormatter: formatDate,
      },
      {
        headerName: 'Date de retour',
        field: COLUMN_ID_RENTAL_GRID.RETURN_DATE,
        ...baseColumnConfig,
        filter: 'agDateColumnFilter',
        valueFormatter: formatDate,
      },
    ],
    [baseColumnConfig, actionCellRenderer, formatDate],
  );

  // Dynamically filter columns based on columnsToShow prop
  const columns = useMemo<ColDef<MachineRentalWithMachineRented>[]>(() => {
    if (columnsToShow === 'all') {
      return allColumns;
    }
    return allColumns.filter(
      (column) =>
        column.field &&
        columnsToShow.includes(column.field as COLUMN_ID_RENTAL_GRID),
    );
  }, [allColumns, columnsToShow]);

  const calculatePageSize = useCallback(() => {
    const element = document.getElementById('machine-rental-table');
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
  }, [rowHeight]);

  useEffect(() => {
    window.addEventListener('resize', calculatePageSize);
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [calculatePageSize]);

  const onGridReady = useCallback(
    (params: any) => {
      if (loading) {
        params.api.showLoadingOverlay();
      } else {
        params.api.hideOverlay();
      }
    },
    [loading],
  );

  return (
    <div
      id="machine-rental-table"
      className={`machine-rental-table ag-theme-quartz${
        theme.palette.mode === 'dark' ? '-dark' : ''
      }`}
      style={{ height: '100%', width: '100%' }}
    >
      <AgGridReact
        rowHeight={rowHeight}
        ref={gridRef}
        rowData={loading ? [] : rowData}
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
        loadingOverlayComponentParams={{ loading }}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default MachineRentalGrid;
