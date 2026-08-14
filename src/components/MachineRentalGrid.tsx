import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useTheme, Chip } from '@mui/material';
import type {
  ColDef,
  ValueGetterParams,
  GridReadyEvent,
  RowClassParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import { MachineRentalWithMachineRented } from '../utils/types';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';
import { StyledAgGridWrapper } from './styles/AgGridStyles';
import { calculateTotalPrice } from '../utils/rental.util';
import {
  getRentalDisplayStatus,
  RENTAL_STATUS_LABELS,
  RentalDisplayStatus,
} from '../utils/rentalStatus.util';

export enum COLUMN_ID_RENTAL_GRID {
  ID = 'id',
  CLIENT_FIRST_NAME = 'clientFirstName',
  CLIENT_LAST_NAME = 'clientLastName',
  RENTAL_DATE = 'rentalDate',
  RETURN_DATE = 'returnDate',
  MACHINE_NAME = 'machineRented.name',
  STATUS = 'status',
  SIGNED = 'finalTermsPdfId',
  PAYMENT_AMOUNT = 'paymentAmount',
  PAYMENT_DUE_AT = 'paymentDueAt',
  STRUCTURED_COMMUNICATION = 'structuredCommunication',
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
  filterPendingOnly?: boolean;
}

const MachineRentalGrid: React.FC<MachineRentalGridProps> = ({
  rowData,
  rowHeight = 40,
  loading = false,
  columnsToShow = 'all',
  priceShipping = 0,
  filterPendingOnly = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const gridRef = React.createRef<AgGridReact>();

  const filteredRowData = useMemo(
    () =>
      filterPendingOnly
        ? rowData.filter((r) => r.status === 'PENDING_APPROVAL')
        : rowData,
    [rowData, filterPendingOnly],
  );

  const rowClassRules = useMemo(
    () => ({
      'row-pending-validation': (
        params: RowClassParams<MachineRentalWithMachineRented>,
      ) => params.data?.status === 'PENDING_APPROVAL',
      'row-payment-overdue': (
        params: RowClassParams<MachineRentalWithMachineRented>,
      ) => !!params.data && getRentalDisplayStatus(params.data) === 'OVERDUE',
      'row-cancelled': (
        params: RowClassParams<MachineRentalWithMachineRented>,
      ) => params.data?.status === 'CANCELLED',
    }),
    [],
  );

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
      if (newPageSize > 0) setPaginationPageSize(newPageSize);
    }
  }, [rowHeight]);

  useEffect(() => {
    calculatePageSize();
  }, [calculatePageSize, rowData]);

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

  // Price cell renderer with colored chips
  const priceCellRenderer = useCallback((params: { value: number }) => {
    if (params.value === undefined || params.value === null) {
      return <Chip label="Non défini" color="default" size="small" />;
    }
    // Format the price
    const formattedPrice = `${params.value.toLocaleString('fr-FR')} €`;

    return <Chip label={formattedPrice} color={'primary'} size="small" />;
  }, []);

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

  const statusCellRenderer = useCallback(
    (params: { data?: MachineRentalWithMachineRented }) => {
      if (!params.data) return null;
      const status = getRentalDisplayStatus(params.data);
      const colors: Record<
        RentalDisplayStatus,
        'default' | 'warning' | 'error' | 'success' | 'info'
      > = {
        PENDING_APPROVAL: 'warning',
        UNPAID: 'default',
        PAYMENT_PENDING: 'info',
        OVERDUE: 'error',
        PAID: 'success',
        CANCELLED: 'default',
      };
      return (
        <Chip
          label={RENTAL_STATUS_LABELS[status]}
          color={colors[status]}
          size="small"
        />
      );
    },
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
        sort: 'desc',
      },
      {
        headerName: 'Date de retour',
        field: COLUMN_ID_RENTAL_GRID.RETURN_DATE,
        ...baseColumnConfig,
        filter: 'agDateColumnFilter',
        valueFormatter: formatDate,
      },
      {
        headerName: 'Statut',
        colId: COLUMN_ID_RENTAL_GRID.STATUS,
        valueGetter: (params) =>
          params.data
            ? RENTAL_STATUS_LABELS[getRentalDisplayStatus(params.data)]
            : '',
        ...baseColumnConfig,
        cellRenderer: statusCellRenderer,
        width: 190,
      },
      {
        headerName: 'Signé',
        field: COLUMN_ID_RENTAL_GRID.SIGNED,
        ...baseColumnConfig,
        cellRenderer: signedCellRenderer,
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
      formatDate,
      signedCellRenderer,
      statusCellRenderer,
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

  useEffect(() => {
    window.addEventListener('resize', calculatePageSize);
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [calculatePageSize]);

  // Handle grid ready event
  const onGridReady = useCallback(
    (params: GridReadyEvent<MachineRentalWithMachineRented>) => {
      if (loading) {
        params.api.showLoadingOverlay();
      } else {
        params.api.hideOverlay();
      }
      calculatePageSize();
    },
    [loading, calculatePageSize],
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<MachineRentalWithMachineRented>) => {
      if (event.data?.id) {
        navigate(`/locations/${event.data.id}`);
      }
    },
    [navigate],
  );

  return (
    <StyledAgGridWrapper
      id="machine-rental-table"
      className={`machine-rental-table ag-theme-quartz${
        theme.palette.mode === 'dark' ? '-dark' : ''
      }`}
    >
      <AgGridReact
        ref={gridRef}
        suppressCellFocus={true}
        rowData={filteredRowData}
        columnDefs={columns}
        rowClassRules={rowClassRules}
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
        overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">Aucune location</span>'
        onGridReady={onGridReady}
        onRowClicked={handleRowClicked}
      />
    </StyledAgGridWrapper>
  );
};

export default MachineRentalGrid;
