import React, { useEffect, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Paper, Typography } from '@mui/material';
import { useAuth } from '../hooks/AuthProvider';
import '../styles/MachineRentalTable.css';
import { getAllMachineRental } from '../utils/api';
import { MachineRentalWithMachineRented } from '../utils/types';
import { toast } from 'react-toastify';
import MachineRentalGrid from '../components/MachineRentalGrid';

const MachineRentalTable: React.FC = () => {
  const auth = useAuth();
  const [machineRentalList, setMachineRentalList] = useState<
    MachineRentalWithMachineRented[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data: MachineRentalWithMachineRented[] = await getAllMachineRental(
        auth.token,
      );
      setMachineRentalList(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(
        "Une erreur s'est produite lors de la récupération des données",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        rowData={loading ? [] : machineRentalList}
        loading={loading}
      />
    </Paper>
  );
};

export default MachineRentalTable;
