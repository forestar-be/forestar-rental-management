import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Autocomplete,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  AddCircleOutline,
  Delete,
} from '@mui/icons-material';
import {
  MachineRentedVariant,
  MachineRentedAddon,
  MachineRentedCategory,
  VariantAddonState,
} from '../../utils/types';
import {
  updateVariant,
  uploadVariantImages,
  deleteVariantImage,
} from '../../utils/api';
import { formatPriceNumberToFrenchFormatStr } from '../../utils/common.utils';
import {
  notifyError,
  notifyLoading,
} from '../../utils/notifications';
import VariantAddonConfig from './VariantAddonConfig';
import MultiImageUpload from './MultiImageUpload';

export interface VariantEditorHandle {
  save: () => Promise<void>;
}

interface VariantEditorProps {
  variant: MachineRentedVariant;
  machineId: string;
  machineAddons: MachineRentedAddon[];
  availableCategories: string[];
  isEditing: boolean;
  onUpdate: () => void;
  token: string;
}

const VariantEditor = forwardRef<VariantEditorHandle, VariantEditorProps>(
  (
    {
      variant,
      machineId,
      machineAddons,
      availableCategories,
      isEditing,
      onUpdate,
      token,
    },
    ref,
  ) => {
  const [title, setTitle] = useState(variant.title);
  const [description, setDescription] = useState(variant.description || '');
  const [categories, setCategories] = useState<MachineRentedCategory[]>(
    variant.categories || [],
  );
  const [variantAddons, setVariantAddons] = useState<
    { addonName: string; state: VariantAddonState }[]
  >(
    variant.addons?.map((a) => ({ addonName: a.addonName, state: a.state })) ||
      [],
  );
  const [imageLoading, setImageLoading] = useState(false);

  // Sync local state when variant prop changes (e.g. after save + refresh)
  React.useEffect(() => {
    setTitle(variant.title);
    setDescription(variant.description || '');
    setCategories(variant.categories || []);
    setVariantAddons(
      variant.addons?.map((a) => ({
        addonName: a.addonName,
        state: a.state,
      })) || [],
    );
  }, [variant]);

  const calculatedPrice = useMemo(() => {
    // We don't have the machine price_per_day here directly,
    // but forced addons price can be computed
    const forcedTotal = machineAddons.reduce((total, addon) => {
      const found = variantAddons.find((a) => a.addonName === addon.addonName);
      const state = found?.state ?? 'OPTIONAL';
      if (state === 'FORCED') {
        return total + addon.price;
      }
      return total;
    }, 0);
    return forcedTotal;
  }, [machineAddons, variantAddons]);

  const handleSave = useCallback(async () => {
    const notif = notifyLoading(
      'Mise à jour de la variante...',
      'Variante mise à jour',
      'Erreur lors de la mise à jour de la variante',
    );
    try {
      await updateVariant(
        machineId,
        String(variant.id),
        {
          title,
          description: description || undefined,
          categories: categories
            .filter((c) => c.categoryName.trim() !== '')
            .map((c) => ({
              categoryName: c.categoryName.trim(),
            })),
          addons: variantAddons.map((a) => ({
            addonName: a.addonName,
            state: a.state,
          })),
        },
        token,
      );
      notif.success(null);
      onUpdate();
    } catch (error) {
      notif.error(`Erreur lors de la mise à jour de la variante: ${error}`);
      console.error('Error updating variant:', error);
    }
  }, [
    machineId,
    variant.id,
    title,
    description,
    categories,
    variantAddons,
    token,
    onUpdate,
  ]);

  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      setImageLoading(true);
      try {
        await uploadVariantImages(machineId, String(variant.id), files, token);
        onUpdate();
      } catch (error) {
        notifyError("Erreur lors de l'upload des images");
        console.error('Error uploading variant images:', error);
      } finally {
        setImageLoading(false);
      }
    },
    [machineId, variant.id, token, onUpdate],
  );

  const handleImageDelete = useCallback(
    async (imageId: number) => {
      try {
        await deleteVariantImage(
          machineId,
          String(variant.id),
          String(imageId),
          token,
        );
        onUpdate();
      } catch (error) {
        notifyError("Erreur lors de la suppression de l'image");
        console.error('Error deleting variant image:', error);
      }
    },
    [machineId, variant.id, token, onUpdate],
  );

  // Categories management
  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = { categoryName: value };
    setCategories(newCategories);
  };

  const handleAddCategory = () => {
    setCategories([...categories, { categoryName: '' }]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* Title */}
      {isEditing ? (
        <TextField
          size="small"
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
      ) : (
        <Typography variant="subtitle2">
          <strong>Titre :</strong> {variant.title}
        </Typography>
      )}

      {/* Description */}
      {isEditing ? (
        <TextField
          size="small"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {variant.description || 'Aucune description'}
        </Typography>
      )}

      {/* Categories */}
      <Divider />
      <Typography variant="subtitle2" fontWeight="medium">
        Catégories
      </Typography>
      {isEditing ? (
        <Box>
          {categories.map((cat, index) => (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <Autocomplete
                size="small"
                freeSolo
                options={availableCategories}
                value={cat.categoryName}
                onChange={(_, newValue: string | null) => {
                  handleCategoryChange(index, newValue || '');
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === 'input') {
                    handleCategoryChange(index, newInputValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Catégorie ${index + 1}`}
                    variant="outlined"
                    sx={{
                      margin: params.size === 'small' ? '8px 0' : '5px 0',
                    }}
                  />
                )}
                style={{ flex: 1 }}
              />
              <IconButton onClick={() => handleRemoveCategory(index)}>
                <Delete />
              </IconButton>
            </Box>
          ))}
          <IconButton onClick={handleAddCategory} color="primary">
            <AddCircleOutline />
          </IconButton>
        </Box>
      ) : (
        <Box>
          {categories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune catégorie
            </Typography>
          ) : (
            categories.map((cat, index) => (
              <Typography key={index} variant="body2">
                {cat.categoryName}
              </Typography>
            ))
          )}
        </Box>
      )}

      {/* Addons configuration */}
      <Divider />
      <Typography variant="subtitle2" fontWeight="medium">
        Configuration des accessoires et options
      </Typography>
      <VariantAddonConfig
        machineAddons={machineAddons}
        variantAddons={variantAddons}
        onChange={setVariantAddons}
        isEditing={isEditing}
      />

      {/* Images */}
      <Divider />
      <Typography variant="subtitle2" fontWeight="medium">
        Images
      </Typography>
      <MultiImageUpload
        images={variant.images || []}
        isEditing={isEditing}
        onUpload={handleImageUpload}
        onDelete={handleImageDelete}
        onReorder={async () => {
          // Variant images don't have a dedicated reorder endpoint;
          // reorder is handled via position in update
        }}
        loading={imageLoading}
      />

      {/* Calculated price */}
      <Divider />
      <Typography variant="body2">
        <strong>Prix options forcées :</strong>{' '}
        {formatPriceNumberToFrenchFormatStr(calculatedPrice)} /jour
      </Typography>

      {/* Save */}
      {isEditing && (
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            size="small"
          >
            Enregistrer la variante
          </Button>
        </Box>
      )}
    </Box>
  );
});

VariantEditor.displayName = 'VariantEditor';

export default VariantEditor;
