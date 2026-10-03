import React, { useContext, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HomeIcon from '@mui/icons-material/Home';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTheme } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ColorModeContext from '../utils/ColorModeContext';
import headerData from '../config/header.json';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useUnsavedChanges } from '../hooks/UnsavedChangesProvider';
import AccountMenu from '../components/AccountMenu';
import AppMenu from '../components/AppMenu';

interface Props {
  onSidebarOpen: () => void;
}

export interface HeaderProps {
  title: string;
}

const Header = ({ onSidebarOpen }: Props): JSX.Element => {
  const theme = useTheme();
  const auth = useAuth();
  const colorMode = useContext(ColorModeContext);
  const [header] = useState<HeaderProps>(headerData);
  const navigate = useNavigate();
  const { confirmNavigation } = useUnsavedChanges();
  const navigateSafely = (path: string) => {
    if (confirmNavigation()) navigate(path);
  };

  return (
    <>
      <AppBar
        color="transparent"
        position="sticky"
        sx={{
          border: 0,
          // padding: '10px 0',
          top: 'auto',
          boxShadow:
            '0 4px 18px 0px rgba(0, 0, 0, 0.12), 0 7px 10px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/*
          Sur téléphone (< 900 px) la barre passe sur deux lignes : logo, bouton
          Applications, compte et thème en haut ; navigation et paramètres en
          dessous. Sur une seule ligne, le bouton avatar sortait de l'écran. L'ordre
          visuel est porté par `order` ; à partir de `md` tout reprend l'ordre du DOM.
        */}
        <Toolbar
          sx={{
            minHeight: 70,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            py: { xs: 1, md: 0 },
            rowGap: { xs: 1, md: 0 },
          }}
        >
          <Link
            href="/"
            sx={{
              textDecoration: 'none',
              order: { xs: 0, md: 0 },
              '& img': { height: { xs: 30, md: 50 } },
            }}
            onClick={(e) => {
              e.preventDefault();
              navigateSafely('/');
            }}
          >
            <Logo isDark={theme.palette.mode === 'dark'} />
          </Link>
          <Box sx={{ flexGrow: 1, order: { xs: 1, md: 0 } }} />
          <Box
            sx={{
              alignItems: 'center',
              display: { lg: 'flex', md: 'none', xs: 'none' },
            }}
          ></Box>
          {auth.token && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.5, md: 1 },
                  order: { xs: 6, md: 0 },
                  '& .MuiButton-root': {
                    px: { xs: 0.75, md: 2 },
                    minWidth: 0,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                  },
                  '& .MuiButton-startIcon': { mr: { xs: 0.25, md: 1 } },
                  '& .MuiButton-startIcon .MuiSvgIcon-root': {
                    fontSize: { xs: 18, md: 24 },
                  },
                }}
              >
                <Button
                  component="a"
                  href={`/`}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    navigateSafely(`/`);
                  }}
                  aria-label="Accueil"
                  color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'}
                  startIcon={<HomeIcon fontSize="medium" />}
                  variant="contained"
                >
                  Accueil
                </Button>
                <Button
                  component="a"
                  href={`/locations`}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    navigateSafely(`/locations`);
                  }}
                  aria-label="Locations"
                  color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'}
                  startIcon={<CalendarMonthIcon fontSize="medium" />}
                  variant="contained"
                >
                  Locations
                </Button>
                <Button
                  component="a"
                  href={`/machines`}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    navigateSafely(`/machines`);
                  }}
                  aria-label="Machines"
                  color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'}
                  startIcon={<PrecisionManufacturingIcon fontSize="medium" />}
                  variant="contained"
                >
                  Machines
                </Button>
              </Box>

              <Divider
                orientation="vertical"
                sx={{
                  height: 32,
                  marginX: 2,
                  display: { lg: 'flex', md: 'none', xs: 'none' },
                }}
              />
              <Box sx={{ display: { xs: 'contents', md: 'flex' }, gap: 1 }}>
                <IconButton
                  component="a"
                  href={`/parametres`}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    navigateSafely(`/parametres`);
                  }}
                  aria-label="Paramètres"
                  color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'}
                  sx={{ order: { xs: 7, md: 0 } }}
                >
                  <Tooltip title="Paramètres">
                    <SettingsIcon fontSize="medium" />
                  </Tooltip>
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    order: { xs: 2, md: 0 },
                  }}
                >
                  <AppMenu current="rental-management" />
                  {auth.ssoEnabled ? (
                    // La garde de saisie en cours vaut aussi pour « changer de
                    // compte » : les deux quittent l'application.
                    <AccountMenu beforeLeave={confirmNavigation} />
                  ) : (
                    <IconButton
                      onClick={() => {
                        if (confirmNavigation()) auth.logOut();
                      }}
                      aria-label="Déconnexion"
                      color={
                        theme.palette.mode === 'dark' ? 'warning' : 'inherit'
                      }
                    >
                      <Tooltip title="Déconnexion">
                        <LogoutIcon fontSize="medium" />
                      </Tooltip>
                    </IconButton>
                  )}
                </Box>
              </Box>
            </>
          )}
          <Divider
            orientation="vertical"
            sx={{
              height: 32,
              marginX: 2,
              display: { lg: 'flex', md: 'none', xs: 'none' },
            }}
          />
          {/* Saut de ligne (téléphone seulement) entre les deux rangées. */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              flexBasis: '100%',
              height: 0,
              order: 5,
            }}
          />
          <Box sx={{ display: 'flex', order: { xs: 3, md: 0 } }}>
            <IconButton
              onClick={colorMode.toggleColorMode}
              aria-label="Theme Mode"
              color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'}
            >
              {theme.palette.mode === 'dark' ? (
                <Tooltip title="Passer en mode clair">
                  <LightModeIcon fontSize="medium" />
                </Tooltip>
              ) : (
                <Tooltip title="Passer en mode sombre">
                  <DarkModeIcon fontSize="medium" />
                </Tooltip>
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
