import React from 'react';
import { H, W, SAFE } from '../theme';

/** QA only (never in a final render): shades the zones platform UI covers. */
export const SafeGuides: React.FC = () => {
  const red = 'rgba(255,0,0,0.28)';
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: SAFE.top, background: red }} />
      <div style={{ position: 'absolute', left: 0, top: SAFE.bottom, width: W, height: H - SAFE.bottom, background: red }} />
      <div style={{ position: 'absolute', left: SAFE.right, top: SAFE.top, width: W - SAFE.right, height: SAFE.bottom - SAFE.top, background: red }} />
      <div style={{ position: 'absolute', left: 0, top: SAFE.top, width: SAFE.left, height: SAFE.bottom - SAFE.top, background: 'rgba(255,160,0,0.18)' }} />
    </>
  );
};
