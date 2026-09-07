/**
 * Helpers to work with the vehicles of an Item ("lote").
 *
 * An Item is a lot that groups one or more vehicles under a single price.
 * These helpers keep the UI resilient whether a lot has one vehicle (behaves
 * like a single-car listing) or several (a lot).
 */

export interface VehicleLike {
  id?: string;
  plate?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  version?: string | null;
  kilometraje?: number | null;
}

export interface ItemWithVehiclesLike {
  vehicles?: VehicleLike[] | null;
  // Legacy single-vehicle fields (older payloads / realtime summaries)
  plate?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  version?: string | null;
  kilometraje?: number | null;
}

/** Returns the vehicles array, falling back to a synthetic single vehicle
 * built from legacy top-level fields when `vehicles` is absent. */
export function getVehicles(item?: ItemWithVehiclesLike | null): VehicleLike[] {
  if (!item) return [];
  if (Array.isArray(item.vehicles) && item.vehicles.length > 0) {
    return item.vehicles;
  }
  // Backward compatibility with payloads that still carry a single vehicle inline.
  if (item.plate || item.brand || item.model) {
    return [
      {
        plate: item.plate ?? undefined,
        brand: item.brand ?? undefined,
        model: item.model ?? undefined,
        year: item.year ?? undefined,
        version: item.version ?? undefined,
        kilometraje: item.kilometraje ?? undefined,
      },
    ];
  }
  return [];
}

export function getPrimaryVehicle(
  item?: ItemWithVehiclesLike | null
): VehicleLike | undefined {
  return getVehicles(item)[0];
}

export function getVehicleCount(item?: ItemWithVehiclesLike | null): number {
  return getVehicles(item).length;
}

export function isLot(item?: ItemWithVehiclesLike | null): boolean {
  return getVehicleCount(item) > 1;
}

export function getPrimaryPlate(item?: ItemWithVehiclesLike | null): string {
  return getPrimaryVehicle(item)?.plate || '';
}

/** A short vehicle name like "Toyota Corolla" (brand + model). */
export function vehicleName(vehicle?: VehicleLike | null): string {
  if (!vehicle) return '';
  return [vehicle.brand, vehicle.model].filter(Boolean).join(' ').trim();
}

/** Title for cards/headers: the plate for a single vehicle, or a lot label. */
export function getItemTitle(item?: ItemWithVehiclesLike | null): string {
  const vehicles = getVehicles(item);
  if (vehicles.length === 0) return 'Sin patente';
  if (vehicles.length === 1) return vehicles[0].plate || 'Sin patente';
  return `Lote · ${vehicles.length} vehículos`;
}

/** Lowercased searchable text across all vehicles of the lot. */
export function getItemSearchText(item?: ItemWithVehiclesLike | null): string {
  return getVehicles(item)
    .map((v) => [v.plate, v.brand, v.model, v.version].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();
}

/**
 * A one-line "auto" label: "Brand Model Year" of the primary vehicle, with a
 * "+N" suffix when the lot has more vehicles. Handy for tables and summaries.
 */
export function getItemAutoLabel(item?: ItemWithVehiclesLike | null): string {
  const vehicles = getVehicles(item);
  if (vehicles.length === 0) return '-';
  const v = vehicles[0];
  const base = [v.brand, v.model, v.year].filter(Boolean).join(' ').trim();
  const extra = vehicles.length > 1 ? ` +${vehicles.length - 1}` : '';
  return (base || 'Vehículo') + extra;
}
