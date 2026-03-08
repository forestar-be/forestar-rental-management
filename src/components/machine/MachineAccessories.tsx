import React from 'react';
import {
  Box,
  IconButton,
  TextField,
  Autocomplete,
  Typography,
  useTheme,
  CardHeader,
  Card,
  CardContent,
} from '@mui/material';
import { AddCircleOutline, Delete } from '@mui/icons-material';
import { MachineRentedAccessory } from '../../utils/types';

interface MachineAccessoriesProps {
  accessories: MachineRentedAccessory[];
  isEditing: boolean;
  onChange: (newAccessories: MachineRentedAccessory[]) => void;
  availableAccessories: { name: string; price_per_day: number }[];
}

const MachineAccessories: React.FC<MachineAccessoriesProps> = ({
  accessories,
  isEditing,
  onChange,
  availableAccessories,
}) => {
  const theme = useTheme();

  const handleNameChange = (index: number, value: string) => {
    const newAccessories = [...accessories];
    // If selecting from autocomplete, find the matching price
    const existing = availableAccessories.find((a) => a.name === value);
    newAccessories[index] = {
      accessoryName: value,
      price_per_day:
        existing?.price_per_day ?? newAccessories[index].price_per_day,
    };
    onChange(newAccessories);
  };

  const handlePriceChange = (index: number, value: number) => {
    const newAccessories = [...accessories];
    newAccessories[index] = { ...newAccessories[index], price_per_day: value };
    onChange(newAccessories);
  };

  const handleAdd = () => {
    onChange([...accessories, { accessoryName: '', price_per_day: 0 }]);
  };

  const handleRemove = (index: number) => {
    onChange(accessories.filter((_, i) => i !== index));
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader
          title="Accessoires facultatifs"
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            py: 1.5,
          }}
        />
        <CardContent>
          {accessories.length === 0 ? (
            <Typography variant="subtitle1">Aucun accessoire.</Typography>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              gap="10px"
              margin="5px 0"
            >
              {accessories.map((acc, index) => (
                <Typography key={index} variant="subtitle1">
                  {acc.accessoryName} — {acc.price_per_day} €/jour
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
        title="Accessoires facultatifs"
        titleTypographyProps={{ variant: 'h6' }}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 1.5,
        }}
      />
      <CardContent>
        {accessories.map((acc, index) => (
          <Box key={index} display="flex" alignItems="center" mb={2} gap={1}>
            <Autocomplete
              size="small"
              freeSolo
              options={availableAccessories.map((a) => a.name)}
              value={acc.accessoryName}
              onChange={(_, newValue) => {
                if (newValue !== null) handleNameChange(index, newValue);
              }}
              onInputChange={(_, newInputValue) => {
                handleNameChange(index, newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Accessoire ${index + 1}`}
                  variant="outlined"
                  sx={{ margin: params.size === 'small' ? '8px 0' : '5px 0' }}
                />
              )}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              type="number"
              label="€/jour"
              value={acc.price_per_day}
              onChange={(e) =>
                handlePriceChange(index, parseFloat(e.target.value) || 0)
              }
              sx={{ flex: 1 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <IconButton onClick={() => handleRemove(index)}>
              <Delete />
            </IconButton>
          </Box>
        ))}
        <IconButton onClick={handleAdd} color="primary">
          <AddCircleOutline />
        </IconButton>
      </CardContent>
    </Card>
  );
};

export default MachineAccessories;
