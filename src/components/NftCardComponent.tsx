import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

interface CollectionProps {
  cltName: string;
  cltURL: string;
  cltAdr: string;
}


export default function NftCardComponent({cltName, cltURL, cltAdr}: CollectionProps) {
  const theme = useTheme();

  return (
    <Card sx={{ display: 'flex' }}>
      <CardMedia
        component="img"
        sx={{ width: 91 }}
        image={cltURL}
        alt="Fetched Collection"
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Typography component="div" variant="h5">
            {cltName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="div">
            {cltAdr}
          </Typography>
        </CardContent>
      </Box>
    </Card>
  );
}
