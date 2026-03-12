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
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { AddCircleOutline, Delete } from '@mui/icons-material';
import { MachineRentedAddon } from '../../utils/types';

interface MachineAddonsProps {
  addons: MachineRentedAddon[];
  isEditing: boolean;
  onChange: (newAddons: MachineRentedAddon[]) => void;
  availableAddons: { name: string; price: number; category: string }[];
  category: 'accessory' | 'option';
  title: string;
}

const MachineAddons: React.FC<MachineAddonsProps> = ({
  addons,
  isEditing,
  onChange,
  availableAddons,
  category,
  title,
}) => {
  const theme = useTheme();

  const handleNameChange = (index: number, value: string) => {
    const newAddons = [...addons];
    const existing = availableAddons.find((a) => a.name === value);
    newAddons[index] = {
      ...newAddons[index],
      addonName: value,
      price: existing?.price ?? newAddons[index].price,
    };
    onChange(newAddons);
  };

  const handlePriceChange = (index: number, value: number) => {
    const newAddons = [...addons];
    newAddons[index] = { ...newAddons[index], price: value };
    onChange(newAddons);
  };

  const handlePriceTypeChange = (index: number, value: string) => {
    const newAddons = [...addons];
    newAddons[index] = { ...newAddons[index], price_type: value };
    onChange(newAddons);
  };

  const handleQuantityEnabledChange = (index: number, value: boolean) => {
    const newAddons = [...addons];
    newAddons[index] = {
      ...newAddons[index],
      quantity_enabled: value,
    };
    onChange(newAddons);
  };

  const handleAdd = () => {
    onChange([
      ...addons,
      {
        addonName: '',
        price: 0,
        category,
        price_type: 'per_day',
        quantity_enabled: false,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(addons.filter((_, i) => i !== index));
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            py: 1.5,
          }}
        />
        <CardContent>
          {addons.length === 0 ? (
            <Typography variant="subtitle1">Aucun élément.</Typography>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              gap="10px"
              margin="5px 0"
            >
              {addons.map((addon, index) => (
                <Typography key={index} variant="subtitle1">
                  {addon.addonName} — {addon.price} €
                  {addon.price_type === 'per_day' ? '/jour' : ''}
                  {addon.quantity_enabled ? ' (quantité activée)' : ''}
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
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 1.5,
        }}
      />
      <CardContent>
        {addons.map((addon, index) => (
          <Box key={index} display="flex" alignItems="center" mb={2} gap={1}>
            <Autocomplete
              size="small"
              freeSolo
              options={availableAddons.map((a) => a.name)}
              value={addon.addonName}
              onChange={(_, newValue) => {
                if (newValue !== null) handleNameChange(index, newValue);
              }}
              onInputChange={(_, newInputValue) => {
                handleNameChange(index, newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Élément ${index + 1}`}
                  variant="outlined"
                  sx={{ margin: params.size === 'small' ? '8px 0' : '5px 0' }}
                />
              )}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              type="number"
              label="Prix"
              value={addon.price}
              onChange={(e) =>
                handlePriceChange(index, parseFloat(e.target.value) || 0)
              }
              sx={{ flex: 1 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <Select
              size="small"
              value={addon.price_type}
              onChange={(e) => handlePriceTypeChange(index, e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="per_day">€/jour</MenuItem>
              <MenuItem value="unit">Unitaire</MenuItem>
            </Select>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={addon.quantity_enabled}
                  onChange={(e) =>
                    handleQuantityEnabledChange(index, e.target.checked)
                  }
                />
              }
              label="Qté"
              sx={{ ml: 0 }}
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

export default MachineAddons;
