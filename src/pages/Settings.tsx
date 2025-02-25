import { Box } from '@mui/material';
import EditConfig from '../components/settings/EditConfig';

const Settings = (): JSX.Element => {
  return (
    <Box sx={{ padding: 4, height: '100%', position: 'relative' }}>
      <EditConfig />
    </Box>
  );
};

export default Settings;
