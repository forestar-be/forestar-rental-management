import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useTheme, IconButton, Tooltip, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type {
  ColDef,
  ValueGetterParams,
} from 'ag-grid-community/dist/types/core/entities/colDef';
import { useNavigate } from 'react-router-dom';
import { MachineRentalWithMachineRented } from '../utils/types';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import { StyledAgGridWrapper } from './styles/AgGridStyles';
import { calculateTotalPrice } from '../utils/rental.util';

export enum COLUMN_ID_RENTAL_GRID {
  ID = 'id',
  CLIENT_FIRST_NAME = 'clientFirstName',
  CLIENT_LAST_NAME = 'clientLastName',
  RENTAL_DATE = 'rentalDate',
  RETURN_DATE = 'returnDate',
  MACHINE_NAME = 'machineRented.name',
  SIGNED = 'finalTermsPdfId',
  PAID = 'paid',
  WITH_SHIPPING = 'with_shipping',
  DEPOSIT_TO_PAY = 'depositToPay',
  TOTAL_PRICE = 'totalPrice',
}

interface MachineRentalGridProps {
  rowData: MachineRentalWithMachineRented[];
  rowHeight?: number;
  loading?: boolean;
  columnsToShow?: 'all' | COLUMN_ID_RENTAL_GRID[];
  priceShipping?: number;
}

const MachineRentalGrid: React.FC<MachineRentalGridProps> = ({
  rowData,
  rowHeight = 40,
  loading = false,
  columnsToShow = 'all',
  priceShipping = 0,
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

  // Price formatter
  const formatPrice = useCallback((params: { value: number }) => {
    return params.value !== undefined && params.value !== null
      ? `${params.value.toLocaleString('fr-FR')} €`
      : '';
  }, []);

  // Price cell renderer with colored chips
  const priceCellRenderer = useCallback((params: { value: number }) => {
    if (params.value === undefined || params.value === null) {
      return <Chip label="Non défini" color="default" size="small" />;
    }
    // Format the price
    const formattedPrice = `${params.value.toLocaleString('fr-FR')} €`;

    return <Chip label={formattedPrice} color={'primary'} size="small" />;
  }, []);

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

  // Boolean cell renderer for yes/no values
  const booleanCellRenderer = useCallback(
    (params: { value: boolean | undefined }) => (
      <Chip
        label={params.value ? 'Oui' : 'Non'}
        color={params.value ? 'success' : 'default'}
        size="small"
      />
    ),
    [],
  );

  // Signed cell renderer
  const signedCellRenderer = useCallback(
    (params: { value: string | undefined }) => (
      <Chip
        label={params.value ? 'Oui' : 'Non'}
        color={params.value ? 'success' : 'default'}
        size="small"
      />
    ),
    [],
  );

  // Client name value getter
  const clientNameValueGetter = useCallback(
    (params: ValueGetterParams<MachineRentalWithMachineRented>) => {
      if (!params.data) return '';
      return `${params.data.clientFirstName || ''} ${params.data.clientLastName || ''}`.trim();
    },
    [],
  );

  // Total price value getter
  const totalPriceValueGetter = useCallback(
    (params: ValueGetterParams<MachineRentalWithMachineRented>) => {
      if (!params.data) return 0;
      return calculateTotalPrice(params.data, priceShipping);
    },
    [priceShipping],
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
        headerName: 'Client',
        colId: 'clientFullName',
        valueGetter: clientNameValueGetter,
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
      {
        headerName: 'Signé',
        field: COLUMN_ID_RENTAL_GRID.SIGNED,
        ...baseColumnConfig,
        cellRenderer: signedCellRenderer,
        width: 120,
      },
      {
        headerName: 'Payé',
        field: COLUMN_ID_RENTAL_GRID.PAID,
        ...baseColumnConfig,
        cellRenderer: booleanCellRenderer,
        width: 120,
      },
      {
        headerName: 'Caution payé',
        field: COLUMN_ID_RENTAL_GRID.DEPOSIT_TO_PAY,
        ...baseColumnConfig,
        cellRenderer: (params: { value: boolean | undefined }) => {
          return booleanCellRenderer({
            ...params,
            value: !params.value,
          });
        },
        width: 150,
      },
      {
        headerName: 'Avec livraison',
        field: COLUMN_ID_RENTAL_GRID.WITH_SHIPPING,
        ...baseColumnConfig,
        cellRenderer: booleanCellRenderer,
        width: 150,
      },
      {
        headerName: 'Prix total',
        colId: COLUMN_ID_RENTAL_GRID.TOTAL_PRICE,
        valueGetter: totalPriceValueGetter,
        cellRenderer: priceCellRenderer,
        ...baseColumnConfig,
        width: 150,
      },
    ],
    [
      baseColumnConfig,
      actionCellRenderer,
      formatDate,
      formatPrice,
      signedCellRenderer,
      booleanCellRenderer,
      clientNameValueGetter,
      totalPriceValueGetter,
      priceCellRenderer,
    ],
  );

  // Dynamically filter columns based on columnsToShow prop
  const columns = useMemo<ColDef<MachineRentalWithMachineRented>[]>(() => {
    if (columnsToShow === 'all') {
      return allColumns;
    }
    return allColumns.filter(
      (column) =>
        (column.field || column.colId) &&
        (column.field
          ? columnsToShow.includes(column.field as COLUMN_ID_RENTAL_GRID)
          : (column.colId === 'clientFullName' &&
              columnsToShow.includes(COLUMN_ID_RENTAL_GRID.CLIENT_FIRST_NAME) &&
              columnsToShow.includes(COLUMN_ID_RENTAL_GRID.CLIENT_LAST_NAME)) ||
            columnsToShow.includes(column.colId as COLUMN_ID_RENTAL_GRID)),
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
    <StyledAgGridWrapper
      id="machine-rental-table"
      className={`machine-rental-table ag-theme-quartz${
        theme.palette.mode === 'dark' ? '-dark' : ''
      }`}
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
    </StyledAgGridWrapper>
  );
};

export default MachineRentalGrid;
