import { useState, useEffect } from 'react';
import { AuctionStatusEnum } from '@suba-go/shared-validation';

interface AuctionStatusResult {
  displayStatus: string;
  isActive: boolean;
  isPending: boolean;
  isCompleted: boolean;
  isCanceled: boolean;
  timeRemaining: string | null;
  timeRemainingDetailed: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

/**
 * Hook to automatically determine and update auction status based on current time
 * @param status - The auction status from the database
 * @param startTime - The auction start time
 * @param endTime - The auction end time
 * @returns Object with display status and time information
 */
export function useAuctionStatus(
  status: string,
  startTime: string | Date,
  endTime: string | Date
): AuctionStatusResult {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = currentTime;

  // Determine actual status based on time and database status
  let displayStatus = status;
  let isActive = false;
  let isPending = false;
  let isCompleted = false;
  let isCanceled = false;
  let timeRemaining: string | null = null;
  let timeRemainingDetailed: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null = null;

  // If auction is CANCELADA or ELIMINADA, respect that status
  if (status === AuctionStatusEnum.CANCELADA) {
    isCanceled = true;
    displayStatus = AuctionStatusEnum.CANCELADA;
  } else if (status === AuctionStatusEnum.ELIMINADA) {
    displayStatus = AuctionStatusEnum.ELIMINADA;
  } else {
    // Auto-determine status based on time
    if (now < start) {
      // Auction hasn't started yet
      isPending = true;
      displayStatus = AuctionStatusEnum.PENDIENTE;

      // Calculate time until start
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Detailed time for countdown (hours includes days)
      timeRemainingDetailed = { hours: hours + days * 24, minutes, seconds };

      if (days > 0) {
        timeRemaining = `${days} día${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        timeRemaining = `${hours} hora${hours > 1 ? 's' : ''}`;
      } else {
        timeRemaining = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
      }
    } else if (now >= start && now < end) {
      // Auction is currently active
      isActive = true;
      displayStatus = AuctionStatusEnum.ACTIVA;

      // Calculate time until end
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Detailed time for countdown (hours includes days)
      timeRemainingDetailed = { hours: hours + days * 24, minutes, seconds };

      if (days > 0) {
        timeRemaining = `${days} día${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        timeRemaining = `${hours} hora${hours > 1 ? 's' : ''}`;
      } else {
        timeRemaining = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
      }
    } else {
      // Auction has ended
      isCompleted = true;
      displayStatus = AuctionStatusEnum.COMPLETADA;
    }
  }

  return {
    displayStatus,
    isActive,
    isPending,
    isCompleted,
    isCanceled,
    timeRemaining,
    timeRemainingDetailed,
  };
}
