import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import getTheme from './theme/theme';
import ColorModeContext from './utils/ColorModeContext';
import Layout from './layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthRoute from './components/AuthRoute';
import AuthProvider from './hooks/AuthProvider';
import SingleMachine from './pages/SingleMachine';
import MachineRentedTable from './pages/MachineRentedTable';
import NotFoundPage from './pages/NotFoundPage';
import MachineRentalTable from './pages/MachineRentalTable';
import SingleRental from './pages/SingleRental';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GlobalDataProvider } from './contexts/GlobalDataContext';
import Settings from './pages/Settings';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const defaultTheme = 'light';

const App = (): JSX.Element => {
  const [mode, setMode] = useState('dark');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        window.localStorage.setItem(
          'themeMode',
          mode === 'dark' ? 'light' : 'dark',
        );
        setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
      },
    }),
    [mode],
  );

  useEffect(() => {
    try {
      const localTheme = window.localStorage.getItem('themeMode');
      localTheme ? setMode(localTheme) : setMode(defaultTheme);
    } catch {
      setMode(defaultTheme);
    }
  }, []);

  return (
    <HelmetProvider>
      <Helmet
        titleTemplate="%s | Forestar Location"
        defaultTitle="Forestar Location"
      />
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={getTheme(mode)}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <GlobalDataProvider>
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale={'fr'}
                >
                  <Layout>
                    <ToastContainer />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route element={<AuthRoute />}>
                        <Route path="/" element={<Home />} />
                        <Route
                          path="/machines"
                          element={<MachineRentedTable />}
                        />
                        <Route
                          path="/machines/:id"
                          element={<SingleMachine />}
                        />
                        <Route
                          path="/locations"
                          element={<MachineRentalTable />}
                        />
                        <Route
                          path="/locations/:id"
                          element={<SingleRental />}
                        />
                        <Route path="/parametres" element={<Settings />} />
                      </Route>
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Layout>
                </LocalizationProvider>
              </GlobalDataProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </HelmetProvider>
  );
};

export default App;
