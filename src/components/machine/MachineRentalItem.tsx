import { MachineRental } from '../../utils/types';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import Divider from '@mui/material/Divider';
import 'dayjs/locale/fr';

export const MachineRentalItem = ({
  editing,
  onChangeRentalDate,
  onChangeReturnDate,
  onDelete,
  rental: { rentalDate, returnDate },
}: {
  editing: boolean;
  rental: MachineRental;
  onChangeRentalDate: (date: Dayjs | null) => void;
  onChangeReturnDate: (date: Dayjs | null) => void;
  onDelete: () => void;
}) => (
  <React.Fragment>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'fr'}>
      <Grid container spacing={2} sx={{ mb: 2, mt: 2 }}>
        <Grid item xs={5}>
          {editing ? (
            <DatePicker
              format={'DD/MM/YYYY'}
              label="Début"
              value={dayjs(rentalDate)}
              onChange={onChangeRentalDate}
            />
          ) : (
            <Typography variant="body1">
              Début : {new Date(rentalDate).toLocaleDateString('fr-FR')}
            </Typography>
          )}
        </Grid>
        <Grid item xs={5}>
          {editing ? (
            <DatePicker
              format={'DD/MM/YYYY'}
              label="Retour"
              value={returnDate ? dayjs(returnDate) : null}
              onChange={onChangeReturnDate}
            />
          ) : (
            <Typography variant="body1">
              Retour :{' '}
              {returnDate
                ? new Date(returnDate).toLocaleDateString('fr-FR')
                : 'Non retourné'}
            </Typography>
          )}
        </Grid>
        <Grid
          item
          xs={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {editing && (
            <IconButton color="error" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          )}
        </Grid>
      </Grid>
      <Divider />
    </LocalizationProvider>
  </React.Fragment>
);
