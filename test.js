// Import the axios library
const axios = require('axios');

// Function to generate random coordinates within Lahore
function getRandomCoordsInLahore() {
    const latMin = 31.4; // Approximate minimum latitude for Lahore
    const latMax = 31.6; // Approximate maximum latitude for Lahore
    const lonMin = 74.2; // Approximate minimum longitude for Lahore
    const lonMax = 74.4; // Approximate maximum longitude for Lahore

    const latitude = (Math.random() * (latMax - latMin) + latMin).toFixed(6);
    const longitude = (Math.random() * (lonMax - lonMin) + lonMin).toFixed(6);

    return { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
}

// Base URL for API
const baseUrl = 'http://localhost:4000/api';

// Main function to update vendor locations
async function updateVendorLocations() {
    try {
        // Step 1: Get all vendors
        const vendorsResponse = await axios.get(`${baseUrl}/vendors`);
        const vendors = vendorsResponse.data;

        if (!Array.isArray(vendors) || vendors.length === 0) {
            console.log('No vendors found.');
            return;
        }

        // Step 2: Update each vendor's location
        for (const vendor of vendors) {
            const vendorId = vendor.id; // Adjust according to the actual structure of the response

            // Generate random coordinates within Lahore
            const newCoords = getRandomCoordsInLahore();

            // Step 3: Make PUT request to update the vendor's location
            try {
                await axios.put(`${baseUrl}/vendor/${vendorId}`, {
                    location: {
                        latitude: newCoords.latitude,
                        longitude: newCoords.longitude
                    }
                });
                console.log(`Updated vendor ${vendorId} with new location:`, newCoords);
            } catch (updateError) {
                console.error(`Failed to update vendor ${vendorId}:`, updateError.message);
            }
        }
    } catch (error) {
        console.error('Error fetching vendors:', error.message);
    }
}

// Run the function
updateVendorLocations();
                                                                                                                                                                                                                                                                                                                                                                                                                                  