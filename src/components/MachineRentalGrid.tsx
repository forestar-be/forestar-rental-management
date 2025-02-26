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

  const allColumns = useMemo<ColDef<MachineRentalWithMachineRented>[]>(
    () => [
      {
        headerName: '',
        field: COLUMN_ID_RENTAL_GRID.ID,
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
        width: 180,
      },
      {
        headerName: 'Machine',
        field: COLUMN_ID_RENTAL_GRID.MACHINE_NAME,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Prénom',
        field: COLUMN_ID_RENTAL_GRID.CLIENT_FIRST_NAME,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Nom',
        field: COLUMN_ID_RENTAL_GRID.CLIENT_LAST_NAME,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Date de début',
        field: COLUMN_ID_RENTAL_GRID.RENTAL_DATE,
        sortable: true,
        filter: true,
        valueFormatter: (params: { value: string }) =>
          params.value
            ? new Date(params.value).toLocaleDateString('fr-FR')
            : 'Non défini',
      },
      {
        headerName: 'Date de retour',
        field: COLUMN_ID_RENTAL_GRID.RETURN_DATE,
        sortable: true,
        filter: true,
        valueFormatter: (params: { value: string }) =>
          params.value
            ? new Date(params.value).toLocaleDateString('fr-FR')
            : 'Non défini',
      },
    ],
    [navigate],
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
    if (element && footer && header) {
      const elementHeight = element.clientHeight;
      const footerHeight = footer.clientHeight;
      const headerHeight = header.clientHeight;
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
  }, []);

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
        onGridReady={(params) => {
          if (loading) {
            params.api.showLoadingOverlay();
          } else {
            params.api.hideOverlay();
          }
        }}
      />
    </div>
  );
};

export default MachineRentalGrid;
