import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { MachineRentedWithImage } from '../../utils/types';
import { createVariant, deleteVariant, updateMachine } from '../../utils/api';
import {
  notifyError,
  notifyLoading,
} from '../../utils/notifications';
import VariantEditor, { VariantEditorHandle } from './VariantEditor';

export interface MachineVariantsHandle {
  saveAll: () => Promise<void>;
}

interface MachineVariantsProps {
  machine: MachineRentedWithImage;
  isEditing: boolean;
  onMachineUpdate: () => void;
  token: string;
}

const MachineVariants = forwardRef<MachineVariantsHandle, MachineVariantsProps>(
  ({ machine, isEditing, onMachineUpdate, token }, ref) => {
  const theme = useTheme();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const availableCategories = [
    ...new Set((machine.categories || []).map((c) => c.categoryName)),
  ];

  const variantRefs = useRef<Map<number, VariantEditorHandle>>(new Map());

  useImperativeHandle(
    ref,
    () => ({
      saveAll: async () => {
        const promises: Promise<void>[] = [];
        variantRefs.current.forEach((handle) => {
          promises.push(handle.save());
        });
        await Promise.all(promises);
      },
    }),
    [],
  );

  const handleToggleShowBase = useCallback(
    async (newValue: boolean) => {
      try {
        await updateMachine(
          machine.id,
          { show_base_in_catalog: newValue },
          token,
        );
        onMachineUpdate();
      } catch (error) {
        notifyError('Erreur lors de la mise à jour de la visibilité');
        console.error('Error toggling show_base_in_catalog:', error);
      }
    },
    [machine.id, token, onMachineUpdate],
  );

  const handleCreateVariant = useCallback(async () => {
    if (!newTitle.trim()) {
      notifyError('Le titre est requis');
      return;
    }
    const notif = notifyLoading(
      'Création de la variante...',
      'Variante créée',
      'Erreur lors de la création de la variante',
    );
    try {
      await createVariant(
        machine.id,
        {
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          categories: (machine.categories || []).map((c) => ({
            categoryName: c.categoryName,
          })),
          addons: [],
        },
        token,
      );
      notif.success(null);
      setCreateDialogOpen(false);
      setNewTitle('');
      setNewDescription('');
      onMachineUpdate();
    } catch (error) {
      notif.error(`Erreur lors de la création de la variante: ${error}`);
      console.error('Error creating variant:', error);
    }
  }, [machine.id, newTitle, newDescription, token, onMachineUpdate]);

  const handleDeleteVariant = useCallback(
    async (variantId: number) => {
      const notif = notifyLoading(
        'Suppression de la variante...',
        'Variante supprimée',
        'Erreur lors de la suppression de la variante',
      );
      try {
        await deleteVariant(machine.id, String(variantId), token);
        notif.success(null);
        setDeleteConfirmId(null);
        onMachineUpdate();
      } catch (error) {
        notif.error(`Erreur lors de la suppression de la variante: ${error}`);
        console.error('Error deleting variant:', error);
      }
    },
    [machine.id, token, onMachineUpdate],
  );

  const sortedVariants = [...(machine.variants || [])].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <Box>
      {/* Show base toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={machine.show_base_in_catalog}
            onChange={(e) => handleToggleShowBase(e.target.checked)}
          />
        }
        label="Afficher la machine de base dans le catalogue"
        sx={{ mb: 2 }}
      />

      {/* Add variant button */}
      <Box mb={2}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Ajouter une variante
        </Button>
      </Box>

      {/* Variants list */}
      {sortedVariants.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucune variante configurée.
        </Typography>
      ) : (
        sortedVariants.map((variant) => (
          <Accordion key={variant.id} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: theme.palette.grey[50],
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flex={1}
                mr={1}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  {variant.title}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(variant.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <VariantEditor
                ref={(handle) => {
                  if (handle) {
                    variantRefs.current.set(variant.id, handle);
                  } else {
                    variantRefs.current.delete(variant.id);
                  }
                }}
                variant={variant}
                machineId={machine.id}
                machineAddons={machine.addons || []}
                availableCategories={availableCategories}
                isEditing={isEditing}
                onUpdate={onMachineUpdate}
                token={token}
              />
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Create dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter une variante</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Titre"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <TextField
              label="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateVariant}
            disabled={!newTitle.trim()}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer cette variante ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              deleteConfirmId !== null && handleDeleteVariant(deleteConfirmId)
            }
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

MachineVariants.displayName = 'MachineVariants';

export default MachineVariants;
