import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import SingleField from './machine/SingleField';

interface MaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  maintenanceDate: Date | null;
  maintenanceComment: string;
  setMaintenanceDate: (date: Date) => void;
  setMaintenanceComment: (comment: string) => void;
  handleMaintenanceDone: (date: Date | null, comment: string) => void;
}

const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({
  open,
  onClose,
  maintenanceDate,
  maintenanceComment,
  setMaintenanceDate,
  setMaintenanceComment,
  handleMaintenanceDone,
}) => {
  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Ajouter un entretien</DialogTitle>
      <DialogContent>
        <SingleField
          label="Date"
          name="maintenance_date"
          value={maintenanceDate ?? new Date()}
          valueType="date"
          isEditing={true}
          xs={12}
          handleChange={(e) => {
            setMaintenanceDate(e as Date);
          }}
          size="medium"
        />
        <SingleField
          label="Commentaire"
          name="maintenance_comment"
          value={maintenanceComment}
          valueType="text"
          isEditing={true}
          xs={12}
          handleChange={(e) => setMaintenanceComment(e as string)}
          isMultiline={true}
          size="medium"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Annuler
        </Button>
        <Button
          onClick={() => {
            handleMaintenanceDone(maintenanceDate, maintenanceComment);
            onClose();
          }}
          color="primary"
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceDialog;
