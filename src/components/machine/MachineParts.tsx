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
  useTheme,
  CardHeader,
  Card,
  CardContent,
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
  const theme = useTheme();

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
      <Card>
        <CardHeader
          title="Pièces associées"
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            py: 1.5,
          }}
        />
        <CardContent>
          {parts.length === 0 ? (
            <Typography variant="subtitle1">Aucune pièce associée.</Typography>
          ) : (
            <Box
              display={'flex'}
              flexDirection={'column'}
              gap={'10px'}
              margin={'5px 0'}
            >
              {parts.map((part, index) => (
                <Typography key={index} variant="subtitle1">
                  {part.partName}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Pièces associées"
        titleTypographyProps={{ variant: 'h6' }}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 1.5,
        }}
      />
      <CardContent>
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
                  sx={{ margin: params.size === 'small' ? '8px 0' : '5px 0' }}
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
      </CardContent>
    </Card>
  );
};

export default MachineParts;
