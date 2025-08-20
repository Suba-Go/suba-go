export const statusCodes: { [key: string]: { [key: number]: string } } = {
  GetAccountErrors: {
    409: 'El número de celular ya está registrado',
  },
  default: {
    401: 'No autorizado',
    403: 'Prohibido',
    404: 'No encontrado',
    409: 'Conflicto en el servidor',
    500: 'Error del servidor',
  },
};
