import React, { useEffect, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Paper, Typography } from '@mui/material';
import '../styles/MachineRentalTable.css';
import MachineRentalGrid from '../components/MachineRentalGrid';
import { useAppSelector } from '../store/hooks';
import {
  getMachineRentalList,
  getMachineRentedLoading,
} from '../store/selectors';

const MachineRentalTable: React.FC = () => {
  const machineRentalList = useAppSelector(getMachineRentalList);
  const loadingMachineRentedList = useAppSelector(getMachineRentedLoading);

  return (
    <Paper
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      id="machineRentalTable"
    >
      <div
        style={{
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Locations</Typography>
      </div>
      <MachineRentalGrid
        rowData={loadingMachineRentedList ? [] : machineRentalList}
        loading={loadingMachineRentedList}
      />
    </Paper>
  );
};

export default MachineRentalTable;
