import { Box, Paper } from '@mui/material';
import EditConfig from '../components/settings/EditConfig';

const Settings = (): JSX.Element => {
  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      id="settingsPage"
    >
      <EditConfig />
    </Paper>
  );
};

export default Settings;
