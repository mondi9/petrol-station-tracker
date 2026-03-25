// Netlify Functions (Node 18+) have global fetch available

exports.handler = async (event, context) => {
    const { type, ...params } = event.queryStringParameters;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Google Maps API key not configured on server' })
        };
    }

    try {
        let url;
        if (type === 'geocode') {
            const { address, latlng } = params;
            if (latlng) {
                url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${apiKey}`;
            } else {
                url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
            }
        } else if (type === 'distance') {
            const { origin, destination } = params;
            url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
        } else {
            // Default/Fallback (Backward compatibility)
            const { origin, destination } = params;
            url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch from Google Maps' })
        };
    }
};
