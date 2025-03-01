import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
} from '@mui/material';
import { useAuth } from '../../hooks/AuthProvider';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchConfigData,
  addConfigElement as addConfigElementAction,
  updateConfigElement as updateConfigElementAction,
  deleteConfigElement as deleteConfigElementAction,
} from '../../store/slices/configSlice';
import { getConfig, getConfigLoading } from '../../store/selectors';
import { ConfigElement } from '../../utils/types';
import type { ColDef } from 'ag-grid-community/dist/types/core/entities/colDef';
import { AG_GRID_LOCALE_FR } from '@ag-grid-community/locale';

interface EditConfigProps {}

const EditConfig: React.FC<EditConfigProps> = ({}) => {
  const { token } = useAuth();

  const dispatch = useAppDispatch();
  const config = useAppSelector(getConfig);
  const loadingConfig = useAppSelector(getConfigLoading);

  const addConfigElement = async (configElement: ConfigElement) => {
    if (token) {
      await dispatch(addConfigElementAction({ token, configElement })).unwrap();
    }
  };

  const updateConfigElement = async (configElement: ConfigElement) => {
    if (token) {
      await dispatch(
        updateConfigElementAction({ token, configElement }),
      ).unwrap();
    }
  };

  const deleteConfigElement = async (key: string) => {
    if (token) {
      await dispatch(deleteConfigElementAction({ token, key })).unwrap();
    }
  };

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [configElement, setConfigElement] = useState<ConfigElement>({
    key: '',
    value: '',
  });
  const theme = useTheme();
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    calculatePageSize();
  }, [config]);

  const handleAddConfigElement = () => {
    setConfigElement({ key: '', value: '' });
    setIsEditing(false);
    setOpen(true);
  };

  const handleEditConfigElement = (element: ConfigElement) => {
    setConfigElement(element);
    setIsEditing(true);
    setOpen(true);
  };

  const handleDeleteConfigElement = async (key: string) => {
    const answer = window.confirm(`Êtes-vous sûr de vouloir supprimer ${key}?`);
    if (answer) {
      try {
        await deleteConfigElement(key);
        toast.success(`${key} supprimé`);
      } catch (error) {
        console.error(`Failed to delete ${key}:`, error);
        toast.error(
          `Une erreur s'est produite lors de la suppression du ${key}`,
        );
      }
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!configElement) {
      return;
    }

    try {
      if (isEditing) {
        await updateConfigElement(configElement);
        toast.success(`${configElement.key} mis à jour`);
      } else {
        await addConfigElement(configElement);
        toast.success(`${configElement.key} sauvegardé`);
      }
    } catch (error) {
      console.error(`Failed to save ${configElement.key}:`, error);
      toast.error(
        `Une erreur s'est produite lors de la sauvegarde de ${configElement.key}`,
      );
    }
    setOpen(false);
  };

  // Common column configurations
  const baseColumnConfig = useMemo(
    () => ({
      sortable: true,
      filter: true,
      filterParams: {
        buttons: ['reset', 'apply'],
      },
    }),
    [],
  );

  // Action cell renderer
  const actionCellRenderer = useCallback(
    (params: any) => (
      <>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleEditConfigElement(params.data)}
          sx={{ mr: 1 }}
        >
          Modifier
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleDeleteConfigElement(params.data.key)}
        >
          Supprimer
        </Button>
      </>
    ),
    [handleEditConfigElement, handleDeleteConfigElement],
  );

  const columns = useMemo<ColDef<ConfigElement>[]>(
    () => [
      {
        headerName: 'Nom',
        field: 'key',
        ...baseColumnConfig,
      },
      {
        headerName: 'Valeur',
        field: 'value',
        ...baseColumnConfig,
      },
      {
        headerName: 'Actions',
        cellRenderer: actionCellRenderer,
        minWidth: 300,
        sortable: false,
        filter: false,
      },
    ],
    [baseColumnConfig, actionCellRenderer],
  );

  const calculatePageSize = useCallback(() => {
    const element = document.getElementById('config-table');
    const footer = document.querySelector('.ag-paging-panel');
    const header = document.querySelector('.ag-header-viewport');
    if (element) {
      const elementHeight = element.clientHeight;
      const footerHeight = footer?.clientHeight ?? 48;
      const headerHeight = header?.clientHeight ?? 48;
      const newPageSize = Math.floor(
        (elementHeight - headerHeight - footerHeight) / 50,
      );
      setPaginationPageSize(newPageSize > 0 ? newPageSize : 5);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', calculatePageSize);
    return () => {
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [calculatePageSize]);

  const onGridReady = useCallback(
    (params: any) => {
      if (loadingConfig) {
        params.api.showLoadingOverlay();
      } else {
        params.api.hideOverlay();
      }
    },
    [loadingConfig],
  );

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddConfigElement}
        sx={{ ml: 2, mb: 2, mt: 2, width: 'fit-content' }}
      >
        Ajouter un élément de configuration
      </Button>
      <div
        id="config-table"
        className={`config-table ag-theme-quartz${
          theme.palette.mode === 'dark' ? '-dark' : ''
        }`}
        style={{ height: '100%', width: '100%' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={loadingConfig ? [] : config}
          columnDefs={columns}
          rowHeight={50}
          pagination={true}
          paginationPageSize={paginationPageSize}
          localeText={AG_GRID_LOCALE_FR}
          autoSizeStrategy={{
            type: 'fitGridWidth',
          }}
          paginationPageSizeSelector={false}
          overlayLoadingTemplate={
            '<span class="ag-overlay-loading-center">Chargement...</span>'
          }
          overlayNoRowsTemplate={
            loadingConfig
              ? 'Chargement des données...'
              : 'Aucune configuration trouvée'
          }
          loadingOverlayComponentParams={{ loading: loadingConfig }}
          onGridReady={onGridReady}
        />
      </div>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSave}>
          <DialogTitle>
            {isEditing ? 'Modifier' : 'Ajouter'} un élément de configuration
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={'Nom'}
              type="text"
              required
              fullWidth
              value={configElement.key}
              onChange={(e) =>
                setConfigElement({ ...configElement, key: e.target.value })
              }
              autoComplete={'off'}
              disabled={isEditing}
            />
            <TextField
              autoFocus
              margin="dense"
              label={'Valeur'}
              type="text"
              required
              fullWidth
              value={configElement.value}
              onChange={(e) =>
                setConfigElement({ ...configElement, value: e.target.value })
              }
              autoComplete={'off'}
              multiline
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="secondary">
              Annuler
            </Button>
            <Button type="submit" color="primary">
              Sauvegarder
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default EditConfig;
