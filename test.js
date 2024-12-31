// Array of categories to create
const categories = ["Electronics", "Books", "Clothing", "Home", "Beauty"];

// Function to create a random image URL
function getRandomImage() {
    return `https://picsum.photos/200?random=${Math.floor(Math.random() * 1000)}`;
}

// Function to create a category
async function createCategory(category) {
    const url = "http://localhost:4000/api/createCategory";
    const categoryData = {
        title: category,
        image: getRandomImage(),
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`Category '${category}' created successfully:`, result);
        } else {
            console.error(`Failed to create category '${category}':`, response.status, response.statusText);
        }
    } catch (error) {
        console.error(`Error while creating category '${category}':`, error);
    }
}

// Iterate through the categories array and create each category
categories.forEach((category) => {
    createCategory(category);
});
