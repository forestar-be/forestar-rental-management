import { MachineRental, MachineRented } from '../../utils/types';
import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';

export const MachineRentals = ({
  editing,
  machine: { machineRentals },
  onAddRental,
  renderMachineRentalItem,
}: {
  editing: boolean;
  onAddRental: () => void;
  machine: MachineRented;
  renderMachineRentalItem: (
    rental: MachineRental,
    index: number,
  ) => React.JSX.Element;
}) => (
  <Grid item xs={6}>
    <Grid item xs={12}>
      <Box display="flex" alignItems="center">
        <Typography variant="h6">Liste des locations</Typography>
        {editing && (
          <Button color="primary" onClick={onAddRental} sx={{ ml: 2 }}>
            Ajouter une location
          </Button>
        )}
      </Box>
    </Grid>
    {machineRentals.map(renderMachineRentalItem)}
  </Grid>
);
