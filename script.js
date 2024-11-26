//keys to access recipe api (for recipes) and edamam nutrition api for nutritional info
const API_KEY = 'k3leQtmeOp2QMg0ueEpTUw==cqYetIwrfqzseikQ'; //recipe api key
const EDAMAM_APP_ID = '9efca270';   //edamam api app ID
const EDAMAM_APP_KEY = '226a49380e938316c44962253b7a4508';  //edamam api app key

//array to store recipe suggestions from the search
let recipeSuggestions = [];

//function to search for recipes using the api and getting users search input and diet type selection
async function searchRecipes() {
    const query = document.getElementById('recipe-search').value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('suggestions');
    const dietType = document.getElementById('diet-type').value;

    //if the search box is empty, hide the suggestions dropdown
    if (!query) return (suggestionsBox.style.display = 'none');

    //create URL to request recipes from api
    const apiUrl = `https://api.api-ninjas.com/v1/recipe?query=${query}`;

    //try-catch block to handle errors
    //try block for fetching recipes from api
    try {
        //send request to recipe api and waits until it completes and returns a response
        const response = await fetch(apiUrl, { headers: { 'X-Api-Key': API_KEY } });
        const recipes = await response.json();

        console.log('Recipes from API:', recipes);  //debugging

        //filter recipes based on the selected diet
        const filteredRecipes = dietType
            ? recipes.filter(recipe => isRecipeSuitableForDiet(recipe, dietType))
            : recipes;

        console.log('Filtered Recipes:', filteredRecipes);  //debugging

        //display filtered recipes or show "No recipes found"
        if (filteredRecipes.length > 0) {
            displaySuggestions(filteredRecipes);
        } else {
            suggestionsBox.innerHTML = '<div>No recipes match your criteria.</div>';
            suggestionsBox.style.display = 'block';
        }
        //catch block logs error and hides suggestion box
    } catch (error) {
        console.error('Error fetching recipes:', error);
        suggestionsBox.style.display = 'none';
    }
}

//check if a recipe matches the selected diet type and manually adding restrictions for filter for specific diet type
function isRecipeSuitableForDiet(recipe, dietType) {
    
    //forbidden ingredients for each diet type
    const forbidden = {
        vegetarian: ['chicken', 'beef', 'pork', 'fish', 'lamb', 'shrimp', 'turkey'],
        vegan: ['milk', 'cheese', 'butter', 'eggs', 'honey'],
        'gluten-free': ['wheat', 'barley', 'rye', 'oats'],
        keto: ['sugar', 'bread', 'pasta', 'rice', 'potato']
    };

    //gets list of ingredients from recipe, combines them into a single string if they are in an array, if not then turns into a empty string
    const ingredients = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.join(' ').toLowerCase() 
    : (recipe.ingredients || '').toString().toLowerCase();

    //gets forbidden items for selected diet type
    const forbiddenItems = forbidden[dietType] || [];

    //check if any forbidden ingredient is present
    const hasForbiddenItem = forbiddenItems.some(item => ingredients.includes(item));

    console.log(`Diet Type: ${dietType}, Ingredients: ${ingredients}, Forbidden: ${hasForbiddenItem}`); //debugging

    return !hasForbiddenItem;
}

//display recipe suggestions
function displaySuggestions(recipes) {
    const suggestionsBox = document.getElementById('suggestions');
    recipeSuggestions = recipes; //store recipes globally for reference
    //clear existing suggestions
    suggestionsBox.innerHTML = '';
    recipes.forEach((recipe, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        //display recipe title
        suggestionItem.textContent = recipe.title;
        suggestionItem.addEventListener('click', () => addRecipeToList(index)); //add click event
        suggestionsBox.appendChild(suggestionItem);
    });
    suggestionsBox.style.display = 'block'; //show dropdown
}

//event listener that hides dropdown when user clicks somewhere else on the page
document.addEventListener('click', (event) => {
    const suggestionsBox = document.getElementById('suggestions');
    const searchBox = document.getElementById('recipe-search');
    
    // Check if the click happened outside the suggestions or search box
    if (!suggestionsBox.contains(event.target) && !searchBox.contains(event.target)) {
        suggestionsBox.style.display = 'none';
    }
});

//add selected recipe to the list with nutrition info
async function addRecipeToList(index) {
    const recipe = recipeSuggestions[index]; //get the selected recipe
    if (!recipe) {
        console.error('Recipe not found at index:', index);
        return;
    }
    //ensure ingredients is an array, if not convert it to an array
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.ingredients];

    //fetch nutrition info for the ingredients
    const nutritionData = await fetchNutritionInfo(ingredients);
    const nutrition = nutritionData ? aggregateNutrition(nutritionData) : null;

    //display the recipe in the list
    displayRecipe({
        name: recipe.title,
        ingredients: ingredients.join(', '), //join array into a string
        instructions: recipe.instructions || 'No instructions available',
        nutrition
    });
    document.getElementById('recipe-search').value = ''; //clear search input
    document.getElementById('suggestions').style.display = 'none'; //hide dropdown
}

//function to clear the recipe list
function clearRecipeList() {
    const recipeTable = document.getElementById('recipe-table');

    //keep the table header and remove all other rows
    recipeTable.innerHTML = `<tr>
        <th>Recipe Name</th>
        <th>Ingredients</th>
        <th>Instructions</th>
        <th>Nutrition</th>
    </tr>`;
    console.log('Recipe list cleared.');
}

//fetch nutrition info for a list of ingredients
async function fetchNutritionInfo(ingredients) {

    //create URL to request recipes from API
    const apiUrl = `https://api.edamam.com/api/nutrition-details?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;
    try {
        //try-catch block to handle errors
        //try block for fetching recipes from api
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingr: ingredients })
        });
        const data = await response.json();
        return data.totalNutrients || null;
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
        return null;
    }
}

//combine nutrition data into a simple format with whole numbers
function aggregateNutrition(data) {
    return {
        calories: Math.round(data.ENERC_KCAL?.quantity || 0),
        protein: Math.round(data.PROCNT?.quantity || 0),
        fat: Math.round(data.FAT?.quantity || 0),
        carbs: Math.round(data.CHOCDF?.quantity || 0)
    };
}

//display recipe in the table
function displayRecipe(recipe) {
    const recipeTable = document.getElementById('recipe-table');
    const row = `
        <tr>
            <td>${recipe.name}</td>
            <td>${recipe.ingredients}</td>
            <td>${recipe.instructions}</td>
            <td>${recipe.nutrition ? `
                Calories: ${recipe.nutrition.calories} kcal<br>
                Protein: ${recipe.nutrition.protein} g<br>
                Fat: ${recipe.nutrition.fat} g<br>
                Carbs: ${recipe.nutrition.carbs} g` : 'Nutritional data not available'}
            </td>
        </tr>`;
    recipeTable.insertAdjacentHTML('beforeend', row);
}

//adding ingredient to shopping list
function addToShoppingList() {
    const input = document.getElementById('shopping-item-input');
    const shoppingListTable = document.getElementById('shopping-list-items');
    const itemName = input.value.trim();

    //check if input is empty
    if (!itemName) {
        alert('Please enter an item before adding.');
        return;
    }

    //create a new row
    const row = document.createElement('tr');

    //create a cell for the checkbox
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; //add a checkbox
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    //create a cell for the item name
    const itemCell = document.createElement('td');
    itemCell.textContent = itemName; //add the item name
    row.appendChild(itemCell);

    //add the new row to the shopping list table
    shoppingListTable.appendChild(row);

    //clear the input field
    input.value = '';
}

//clearing shopping list
function clearShoppingList() {
    const shoppingListTable = document.getElementById('shopping-list-items');
    while (shoppingListTable.rows.length > 1) {
        shoppingListTable.deleteRow(1); //remove all rows except the header
    }
}

//event listener that lets user add item to shopping list by pressing enter key after inputting it
document.getElementById('shopping-item-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { //check if the enter key is pressed
        event.preventDefault(); //prevent the default form submission behavior
        addToShoppingList(); //calls the addToShoppingList function
    }
});