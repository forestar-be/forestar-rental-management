import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { MachineRentedAddon, VariantAddonState } from '../../utils/types';
import { formatPriceNumberToFrenchFormatStr } from '../../utils/common.utils';

interface VariantAddonConfigProps {
  machineAddons: MachineRentedAddon[];
  variantAddons: { addonName: string; state: VariantAddonState }[];
  onChange: (addons: { addonName: string; state: VariantAddonState }[]) => void;
  isEditing: boolean;
}

const STATE_LABELS: Record<VariantAddonState, string> = {
  FORCED: 'Forcé',
  OPTIONAL: 'Optionnel',
  HIDDEN: 'Masqué',
};

const STATE_COLORS: Record<
  VariantAddonState,
  'success' | 'primary' | 'default'
> = {
  FORCED: 'success',
  OPTIONAL: 'primary',
  HIDDEN: 'default',
};

const VariantAddonConfig: React.FC<VariantAddonConfigProps> = ({
  machineAddons,
  variantAddons,
  onChange,
  isEditing,
}) => {
  const getAddonState = (addonName: string): VariantAddonState => {
    const found = variantAddons.find((a) => a.addonName === addonName);
    return found?.state ?? 'OPTIONAL';
  };

  const handleStateChange = (
    addonName: string,
    newState: VariantAddonState | null,
  ) => {
    if (newState === null) return;
    const existingIndex = variantAddons.findIndex(
      (a) => a.addonName === addonName,
    );
    const newAddons = [...variantAddons];
    if (existingIndex >= 0) {
      newAddons[existingIndex] = { addonName, state: newState };
    } else {
      newAddons.push({ addonName, state: newState });
    }
    onChange(newAddons);
  };

  const totalForcedPrice = useMemo(() => {
    return machineAddons.reduce((total, addon) => {
      const state = getAddonState(addon.addonName);
      if (state === 'FORCED') {
        return total + addon.price;
      }
      return total;
    }, 0);
  }, [machineAddons, variantAddons]);

  if (machineAddons.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aucun accessoire ou option configuré sur la machine.
      </Typography>
    );
  }

  return (
    <Box>
      {machineAddons.map((addon) => {
        const state = getAddonState(addon.addonName);
        return (
          <Box
            key={addon.addonName}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={1}
            px={1}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} flex={1}>
              {!isEditing && state === 'FORCED' && (
                <LockIcon fontSize="small" color="success" />
              )}
              <Typography variant="body2">{addon.addonName}</Typography>
              <Chip
                label={addon.category === 'accessory' ? 'Accessoire' : 'Option'}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatPriceNumberToFrenchFormatStr(addon.price)}
                {addon.price_type === 'per_day' ? '/jour' : ''}
              </Typography>
            </Box>
            {isEditing ? (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={state}
                onChange={(_, newValue) =>
                  handleStateChange(addon.addonName, newValue)
                }
              >
                <ToggleButton
                  value="FORCED"
                  sx={{
                    fontSize: '0.7rem',
                    px: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'success.light',
                      color: 'success.contrastText',
                      '&:hover': { backgroundColor: 'success.main' },
                    },
                  }}
                >
                  Forcé
                </ToggleButton>
                <ToggleButton
                  value="OPTIONAL"
                  sx={{
                    fontSize: '0.7rem',
                    px: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': { backgroundColor: 'primary.main' },
                    },
                  }}
                >
                  Optionnel
                </ToggleButton>
                <ToggleButton
                  value="HIDDEN"
                  sx={{
                    fontSize: '0.7rem',
                    px: 1,
                  }}
                >
                  Masqué
                </ToggleButton>
              </ToggleButtonGroup>
            ) : (
              <Chip
                label={STATE_LABELS[state]}
                size="small"
                color={STATE_COLORS[state]}
                icon={state === 'FORCED' ? <LockIcon /> : undefined}
              />
            )}
          </Box>
        );
      })}
      <Box display="flex" justifyContent="flex-end" mt={1.5} px={1}>
        <Typography variant="body2" fontWeight="bold">
          Total options forcées :{' '}
          {formatPriceNumberToFrenchFormatStr(totalForcedPrice)}
        </Typography>
      </Box>
    </Box>
  );
};

export default VariantAddonConfig;
