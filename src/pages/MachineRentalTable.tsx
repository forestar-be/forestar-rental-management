import React, { useEffect, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  Box,
  Paper,
  Tooltip,
  Typography,
  ToggleButton,
} from '@mui/material';
import '../styles/MachineRentalTable.css';
import MachineRentalGrid from '../components/MachineRentalGrid';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  getMachineRentalList,
  getMachineRentedLoading,
} from '../store/selectors';
import FilterListIcon from '@mui/icons-material/FilterList';
import { fetchMachineRentalIfStale } from '../store/slices/machineRentalSlice';
import { useAuth } from '../hooks/AuthProvider';

const MachineRentalTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token } = useAuth();
  const machineRentalList = useAppSelector(getMachineRentalList);
  const loadingMachineRentedList = useAppSelector(getMachineRentedLoading);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchMachineRentalIfStale(token));
    }
  }, [dispatch, token]);

  const pendingCount = machineRentalList.filter(
    (r) => r.status === 'PENDING_APPROVAL',
  ).length;

  return (
    <Paper
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      id="machineRentalTable"
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
        <Typography variant="h6">Locations</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip
            title={
              showPendingOnly
                ? 'Afficher toutes les locations'
                : 'Afficher uniquement les locations en attente de validation'
            }
            arrow
          >
            <ToggleButton
              value="pending"
              selected={showPendingOnly}
              onChange={() => setShowPendingOnly(!showPendingOnly)}
              size="small"
              color="warning"
              sx={{ textTransform: 'none', gap: 0.5 }}
            >
              <FilterListIcon fontSize="small" />
              En attente{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </ToggleButton>
          </Tooltip>
        </Box>
      </Box>
      <MachineRentalGrid
        rowData={loadingMachineRentedList ? [] : machineRentalList}
        loading={loadingMachineRentedList}
        filterPendingOnly={showPendingOnly}
      />
    </Paper>
  );
};

export default MachineRentalTable;
