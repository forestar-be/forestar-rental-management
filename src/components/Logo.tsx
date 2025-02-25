import { Box } from '@mui/material';

export const Logo = ({ isDark }: { isDark: boolean }): JSX.Element => {
  return (
    <Box
      component="img"
      src="/images/logo/logo_forestar_location.png"
      alt="Logo"
      sx={{
        height: 50,
      }}
    />
  );
};
