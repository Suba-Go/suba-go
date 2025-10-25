/**
 * @file bidding-dialogs.tsx
 * @description Dialog components for bidding warnings and confirmations
 */
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@suba-go/shared-components/components/ui/dialog';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { AlertCircle, Zap } from 'lucide-react';

interface SelfBidWarningDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SelfBidWarningDialog({
  isOpen,
  onConfirm,
  onCancel,
}: SelfBidWarningDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Advertencia: Puja Propia
          </DialogTitle>
          <DialogDescription>
            Estás a punto de pujar sobre tu propia oferta. Esto incrementará el
            precio sin beneficio estratégico.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Continuar de todas formas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AutoBidConfirmDialogProps {
  isOpen: boolean;
  maxPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function AutoBidConfirmDialog({
  isOpen,
  maxPrice,
  onConfirm,
  onCancel,
}: AutoBidConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Confirmar Puja Automática
          </DialogTitle>
          <DialogDescription>
            ¿Deseas activar la puja automática con un precio máximo de{' '}
            <strong>{formatCurrency(maxPrice)}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            • El sistema pujará automáticamente por ti cuando otros usuarios
            pujen
          </p>
          <p>• Solo pujará hasta el precio máximo que estableciste</p>
          <p>• Puedes desactivarlo en cualquier momento</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700">
            Activar Puja Automática
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

