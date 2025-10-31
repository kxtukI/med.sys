const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const coords = [lat1, lon1, lat2, lon2];
  const isValid = coords.every(
    (coord) => typeof coord === 'number' && !isNaN(coord)
  );

  if (!isValid) throw new Error('Coordenadas inválidas');
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90) {
    throw new Error('Latitude deve estar entre -90 e 90');
  }
  if (Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
    throw new Error('Longitude deve estar entre -180 e 180');
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    distanceMeters: Math.round(distanceKm * 1000),
  };
}

async function getAddressFromCEP(zipCode) {
  const cepClean = zipCode.replace(/\D/g, '');
  if (cepClean.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.erro) return null;

  return `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade}, ${data.uf}, Brasil`
    .replace(/,\s*,/g, ',')
    .replace(/^,\s*|\s*,$/g, '')
    .trim();
}

async function geocodeWithNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Med.Sys/1.0' },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data || data.length === 0) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

export async function geocodeAddress(address, city, state, zipCode) {
  try {
    let fullAddress = '';

    if (zipCode) {
      fullAddress = await getAddressFromCEP(zipCode);
      if (!fullAddress) return null;
    } else if (address && city && state) {
      fullAddress = `${address}, ${city}, ${state}, Brasil`.trim();
    } else {
      return null;
    }

    const coords = await geocodeWithNominatim(fullAddress);
    return coords;
  } catch (error) {
    console.error('Erro ao fazer geocoding:', error.message);
    return null;
  }
}
