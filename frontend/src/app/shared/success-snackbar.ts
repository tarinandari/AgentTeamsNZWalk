import { MatSnackBar } from '@angular/material/snack-bar';

export function showSuccessSnackbar(snackBar: MatSnackBar, message: string): void {
  snackBar.open(message, 'Close', {
    duration: 3000,
    panelClass: ['snackbar-success'],
    horizontalPosition: 'center',
    verticalPosition: 'top',
  });
}
