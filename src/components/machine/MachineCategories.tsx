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
import { MachineRentedCategory } from '../../utils/types';

interface MachineCategoriesProps {
  categories: MachineRentedCategory[];
  isEditing: boolean;
  onChange: (newCategories: MachineRentedCategory[]) => void;
  availableCategories: string[];
}

const MachineCategories: React.FC<MachineCategoriesProps> = ({
  categories,
  isEditing,
  onChange,
  availableCategories,
}) => {
  const theme = useTheme();

  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = { categoryName: value };
    onChange(newCategories);
  };

  const handleAdd = () => {
    onChange([...categories, { categoryName: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(categories.filter((_, i) => i !== index));
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader
          title="Catégories"
          titleTypographyProps={{ variant: 'h6' }}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            py: 1.5,
          }}
        />
        <CardContent>
          {categories.length === 0 ? (
            <Typography variant="subtitle1">Aucune catégorie.</Typography>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              gap="10px"
              margin="5px 0"
            >
              {categories.map((cat, index) => (
                <Typography key={index} variant="subtitle1">
                  {cat.categoryName}
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
        title="Catégories"
        titleTypographyProps={{ variant: 'h6' }}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 1.5,
        }}
      />
      <CardContent>
        {categories.map((cat, index) => (
          <Box key={index} display="flex" alignItems="center" mb={2}>
            <Autocomplete
              size="small"
              freeSolo
              options={availableCategories}
              value={cat.categoryName}
              onChange={(_, newValue: string | null) => {
                if (newValue !== null) {
                  handleCategoryChange(index, newValue);
                }
              }}
              onInputChange={(_, newInputValue) => {
                handleCategoryChange(index, newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Catégorie ${index + 1}`}
                  variant="outlined"
                  sx={{ margin: params.size === 'small' ? '8px 0' : '5px 0' }}
                />
              )}
              style={{ flex: 1 }}
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

export default MachineCategories;
