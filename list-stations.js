import { db } from './src/services/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

async function list() {
  const q = collection(db, 'stations');
  const snap = await getDocs(q);
  const targetLat = 6.4675;
  const targetLng = 3.2836;
  
  const stations = snap.docs.map(d => {
      const data = d.data();
      return {
          id: d.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          distance: calculateDistance(targetLat, targetLng, data.lat, data.lng)
      };
  }).filter(s => s.distance !== null).sort((a, b) => a.distance - b.distance);
  
  stations.slice(0, 10).forEach(s => {
      console.log(`${s.name.padEnd(30)} | Distance: ${s.distance.toFixed(3)} km | ID: ${s.id} | Coords: ${s.lat}, ${s.lng}`);
  });
}
list();
