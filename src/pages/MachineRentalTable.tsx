import React, { useCallback, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
  ToggleButton,
} from '@mui/material';
import '../styles/MachineRentalTable.css';
import MachineRentalGrid from '../components/MachineRentalGrid';
import { useAppSelector } from '../store/hooks';
import {
  getMachineRentalList,
  getMachineRentedLoading,
} from '../store/selectors';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import { clearGridState } from '../utils/agGridSettingsHelper';

const MachineRentalTable: React.FC = () => {
  const machineRentalList = useAppSelector(getMachineRentalList);
  const loadingMachineRentedList = useAppSelector(getMachineRentedLoading);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const pendingCount = machineRentalList.filter((r) => r.to_validate).length;

  // Handle reset grid state
  const handleResetGrid = useCallback(() => {
    if (
      window.confirm(
        'Réinitialiser tous les paramètres du tableau (colonnes, filtres) ?',
      )
    ) {
      // Clear the saved state
      clearGridState('machineRentalAgGridState');
      // Reload the page to apply the reset
      window.location.reload();
    }
  }, []);

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
          <Tooltip
            title="Réinitialiser le tableau (filtre, tri, déplacement et taille des colonnes)"
            arrow
          >
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RestartAltIcon />}
              onClick={handleResetGrid}
              size="small"
            >
              Réinitialiser
            </Button>
          </Tooltip>
        </Box>
      </Box>
      <MachineRentalGrid
        rowData={loadingMachineRentedList ? [] : machineRentalList}
        loading={loadingMachineRentedList}
        gridStateKey="machineRentalAgGridState"
        filterPendingOnly={showPendingOnly}
      />
    </Paper>
  );
};

export default MachineRentalTable;
