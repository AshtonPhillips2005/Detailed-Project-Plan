//keys to access recipe api (for recipes) and edamam nutrition api for nutritional info
const API_KEY = 'k3leQtmeOp2QMg0ueEpTUw==cqYetIwrfqzseikQ'; //recipe api key
const EDAMAM_APP_ID = '9efca270';   //edamam api app ID
const EDAMAM_APP_KEY = '226a49380e938316c44962253b7a4508';  //edamam api app key

//array to store recipe suggestions from the search
let recipeSuggestions = [];

//function to search for recipes using the API and getting users search input and diet type selection
async function searchRecipes() {
    const query = document.getElementById('recipe-search').value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('suggestions');
    const dietType = document.getElementById('diet-type').value;
    //if the search box is empty, hide the suggestions dropdown
    if (!query) return (suggestionsBox.style.display = 'none');
    //create URL to request recipes from API
    const apiUrl = `https://api.api-ninjas.com/v1/recipe?query=${query}`;
    //try-catch block to handle errors
    //try block for fetching recipes from api
    try {
        //send request to recipe API and waits until it completes and returns a response
        const response = await fetch(apiUrl, { headers: { 'X-Api-Key': API_KEY } });
        
        //converts response from API to an array and waits until fully converted
        const recipes = await response.json();
        const filteredRecipes = dietType
            ? recipes.filter(recipe => isRecipeSuitableForDiet(recipe, dietType))
            : recipes;
        
        //if recipes are found it displays them in the suggestion dropdown, otherwise hides suggestion
        //catch block logs error and hides suggestion box
        filteredRecipes.length > 0
            ? displaySuggestions(filteredRecipes)
            : (suggestionsBox.style.display = 'none');
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
    const ingredients = recipe.ingredients?.join(' ').toLowerCase() || '';
    return !forbidden[dietType]?.some(item => ingredients.includes(item));
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
    //create a new row and cell for the item
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = itemName; //add item name to the cell
    row.appendChild(cell); //add the cell to the row
    shoppingListTable.appendChild(row); //add the row to the table
    input.value = ''; //clear the input field
}

//clearing shopping list
function clearShoppingList() {
    const shoppingListTable = document.getElementById('shopping-list-items');
    while (shoppingListTable.rows.length > 1) {
        shoppingListTable.deleteRow(1); //remove all rows except the header
    }
}