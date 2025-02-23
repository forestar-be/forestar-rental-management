import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { AddCircleOutline, Delete } from '@mui/icons-material';
import { MachineRentedPart } from '../../utils/types';

interface MachinePartsProps {
  parts: MachineRentedPart[];
  isEditing: boolean;
  onChange: (newParts: MachineRentedPart[]) => void;
  availableParts: string[];
}

const MachineParts: React.FC<MachinePartsProps> = ({
  parts,
  isEditing,
  onChange,
  availableParts,
}) => {
  const handlePartChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].partName = value;
    onChange(newParts);
  };

  const handleAddPart = () => {
    const newParts = [...parts, { partName: '' }];
    onChange(newParts);
  };

  const handleRemovePart = (index: number) => {
    const newParts = parts.filter((_, i) => i !== index);
    onChange(newParts);
  };

  if (!isEditing) {
    return (
      <Box>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Pièces associées</Typography>
        </Box>
        {parts.length === 0 ? (
          <p>Aucune pièce associée.</p>
        ) : (
          <List sx={{ listStyleType: 'disc', pl: 2 }}>
            {parts.map((part, index) => (
              <ListItem key={index} sx={{ display: 'list-item', py: 0 }}>
                <ListItemText primary={part.partName} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">Modifier les pièces associées</Typography>
      </Box>
      {parts.map((part, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <Autocomplete
            size="small"
            freeSolo
            options={availableParts}
            value={part.partName}
            onChange={(event, newValue: string | null) => {
              if (newValue !== null) {
                handlePartChange(index, newValue);
              }
            }}
            onInputChange={(event, newInputValue) => {
              handlePartChange(index, newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Pièce ${index + 1}`}
                variant="outlined"
              />
            )}
            style={{ flex: 1 }}
          />
          <IconButton onClick={() => handleRemovePart(index)}>
            <Delete />
          </IconButton>
        </Box>
      ))}
      <IconButton onClick={handleAddPart} color="primary">
        <AddCircleOutline />
      </IconButton>
    </Box>
  );
};

export default MachineParts;
