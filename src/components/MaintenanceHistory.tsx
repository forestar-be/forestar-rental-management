import React from 'react';
import { Box, Typography, Grid, IconButton } from '@mui/material';
import SingleField from './machine/SingleField';
import { MachineRentedWithImage } from '../utils/types';
import DeleteIcon from '@mui/icons-material/Delete';

interface MaintenanceHistoryProps {
  machine: MachineRentedWithImage;
  isEditing: boolean;
  setMachine: React.Dispatch<
    React.SetStateAction<MachineRentedWithImage | null>
  >;
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({
  machine,
  isEditing,
  setMachine,
}) => {
  return (
    <Grid item xs={6}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">Historique des entretiens</Typography>
      </Box>
      {machine.maintenanceHistories.length === 0 ? (
        <Typography>Aucun entretien enregistré.</Typography>
      ) : (
        machine.maintenanceHistories.map((m) => (
          <Box
            key={m.id}
            display="flex"
            alignItems="center"
            gap={2}
            style={{ width: '100%' }}
          >
            <Box style={{ width: !isEditing ? '150px' : undefined }}>
              <SingleField
                label="Date"
                name={`maintenance_${m.id}_performedAt`}
                value={m?.performedAt || new Date()}
                valueType="date"
                isEditing={isEditing}
                xs={12}
                size="small"
                handleChange={(e) => {
                  setMachine((prevMachine) => {
                    if (!prevMachine) {
                      console.error('Previous machine state is null');
                      return null;
                    }
                    const updatedHistories =
                      prevMachine.maintenanceHistories.map((mh) =>
                        mh.id === m.id
                          ? { ...mh, performedAt: new Date(e!) }
                          : mh,
                      );

                    return {
                      ...prevMachine,
                      maintenanceHistories: updatedHistories,
                    };
                  });
                }}
                showLabelWhenNotEditing={false}
              />
            </Box>
            <Box style={{ flexGrow: !isEditing ? 1 : undefined }}>
              <SingleField
                label="Commentaire"
                name={`maintenance_${m.id}_notes`}
                value={m.notes || ''}
                valueType="text"
                isEditing={isEditing}
                xs={12}
                size="small"
                handleChange={(e) =>
                  setMachine((prevMachine) => ({
                    ...prevMachine!,
                    maintenanceHistories: prevMachine!.maintenanceHistories.map(
                      (mh) =>
                        mh.id === m.id ? { ...mh, notes: e as string } : mh,
                    ),
                  }))
                }
                noValueDisplay="Aucun commentaire"
                showLabelWhenNotEditing={false}
              />
            </Box>
            {isEditing && (
              <IconButton
                onClick={() =>
                  setMachine((prevMachine) => {
                    if (!prevMachine) return null;
                    const updatedHistories =
                      prevMachine.maintenanceHistories.filter(
                        (mh) => mh.id !== m.id,
                      );
                    return {
                      ...prevMachine,
                      maintenanceHistories: updatedHistories,
                    };
                  })
                }
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))
      )}
    </Grid>
  );
};

export default MaintenanceHistory;
