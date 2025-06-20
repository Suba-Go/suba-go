'use client';

import { AppProgressBar } from 'next-nprogress-bar';

const ProgressBar = () => {
  return (
    <AppProgressBar
      color="#343434"
      options={{ showSpinner: false }}
      height="5px"
    />
  );
};

export default ProgressBar;
