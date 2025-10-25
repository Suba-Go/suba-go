/**
 * @file use-auto-bid-settings.ts
 * @description Hook for managing auto-bid settings with cookie persistence
 */
import { useState, useEffect } from 'react';

export interface AutoBidSetting {
  enabled: boolean;
  maxPrice: number;
}

export interface AutoBidSettings {
  [auctionItemId: string]: AutoBidSetting;
}

export function useAutoBidSettings(auctionId: string) {
  const [autoBidSettings, setAutoBidSettings] = useState<AutoBidSettings>({});

  // Load from cookies on mount
  useEffect(() => {
    const cookieName = `autoBid_${auctionId}`;
    const savedSettings = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${cookieName}=`));

    if (savedSettings) {
      try {
        const settings = JSON.parse(
          decodeURIComponent(savedSettings.split('=')[1])
        );
        setAutoBidSettings(settings);
      } catch (error) {
        console.error('Error loading auto-bid settings:', error);
      }
    }
  }, [auctionId]);

  // Save to cookies whenever settings change
  useEffect(() => {
    if (Object.keys(autoBidSettings).length > 0) {
      const cookieName = `autoBid_${auctionId}`;
      const cookieValue = encodeURIComponent(JSON.stringify(autoBidSettings));
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${cookieName}=${cookieValue}; expires=${expires}; path=/`;
    }
  }, [autoBidSettings, auctionId]);

  const updateAutoBidSetting = (auctionItemId: string, setting: AutoBidSetting) => {
    setAutoBidSettings((prev) => ({
      ...prev,
      [auctionItemId]: setting,
    }));
  };

  const removeAutoBidSetting = (auctionItemId: string) => {
    setAutoBidSettings((prev) => {
      const newSettings = { ...prev };
      delete newSettings[auctionItemId];
      return newSettings;
    });
  };

  return {
    autoBidSettings,
    updateAutoBidSetting,
    removeAutoBidSetting,
  };
}

