import React, { useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { requiresParentUnlock } from './parentLock';

export function useParentAccess() {
  const [isLocked, setIsLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      requiresParentUnlock().then((needed) => {
        if (isMounted) {
          setIsLocked(needed);
          setChecking(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  const handleUnlockCancel = () => {
    setIsLocked(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return {
    isLocked,
    checking,
    handleUnlockSuccess,
    handleUnlockCancel,
  };
}
