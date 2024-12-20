console.log('Script is loaded');

//dark mode toggle script

const darkMode = document.getElementById('drk-toggle');

// Check local storage for saved dark mode preference
if (localStorage.getItem('isDarkMode') === 'true') {
    document.body.classList.add('dark-theme');
    darkMode.textContent = 'Light mode';
} else {
    document.body.classList.remove('dark-theme');
    darkMode.textContent = 'Dark mode';
}

darkMode.addEventListener('click', function () {
    // Toggle dark mode
    document.body.classList.toggle('dark-theme');

    // Save theme preference to local storage
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('isDarkMode', 'true');
        darkMode.textContent = 'Light mode';
    } else {
        localStorage.setItem('isDarkMode', 'false');
        darkMode.textContent = 'Dark mode';
    }
});

//keys to access recipe api (for recipes) and edamam nutrition api for nutritional info
const API_KEY = 'k3leQtmeOp2QMg0ueEpTUw==cqYetIwrfqzseikQ'; //recipe api key
const EDAMAM_APP_ID = '9efca270';   //edamam api app ID
const EDAMAM_APP_KEY = '226a49380e938316c44962253b7a4508';  //edamam api app key

//array to store recipe suggestions from the search
let recipeSuggestions = [];

//function to search for recipes using the api and getting users search input and diet type selection
async function searchRecipes() {
    const query = document.getElementById('recipe-search')?.value.trim().toLowerCase();
    const suggestionsBox = document.getElementById('suggestions');
    const dietType = document.getElementById('diet-type')?.value;

    if (!suggestionsBox) {
        console.warn('Suggestions box not found on this page.');
        return;
    }

    //if the search box is empty, hide the suggestions dropdown
    if (!query) return (suggestionsBox.style.display = 'none');

    //create URL to request recipes from api
    const apiUrl = `https://api.api-ninjas.com/v1/recipe?query=${query}`;

    //try-catch block to handle errors
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
    } catch (error) {
        console.error('Error fetching recipes:', error);
        suggestionsBox.style.display = 'none';
    }
}

//check if a recipe matches the selected diet type and manually adding restrictions for filter for specific diet type
function isRecipeSuitableForDiet(recipe, dietType) {
    //forbidden ingredients for each diet type
    const forbidden = {
        vegetarian: ['chicken', 'beef', 'pork', 'fish', 'lamb', 'shrimp', 'turkey', 'veal', 'goat'],
        vegan: ['milk', 'cheese', 'butter', 'eggs', 'honey', 'chicken', 'beef', 'pork', 'fish', 'lamb', 'shrimp', 'turkey', 'veal', 'goat'],
        'gluten-free': ['wheat', 'barley', 'rye', 'oats'],
        keto: ['sugar', 'bread', 'pasta', 'rice', 'potato','wheat', 'barley', 'rye', 'oats', 'banana', 'strawberry', 'honey', 'syrup', 'agave', 'corn']
    };

    const ingredients = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.join(' ').toLowerCase() 
    : (recipe.ingredients || '').toString().toLowerCase();

    const forbiddenItems = forbidden[dietType] || [];

    const hasForbiddenItem = forbiddenItems.some(item => ingredients.includes(item));

    console.log(`Diet Type: ${dietType}, Ingredients: ${ingredients}, Forbidden: ${hasForbiddenItem}`); //debugging

    return !hasForbiddenItem;
}

//display recipe suggestions
function displaySuggestions(recipes) {
    const suggestionsBox = document.getElementById('suggestions');
    if (!suggestionsBox) {
        console.warn('Suggestions box not found on this page.');
        return;
    }

    recipeSuggestions = recipes; //store recipes globally for reference
    suggestionsBox.innerHTML = ''; //clear existing suggestions

    recipes.forEach((recipe, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
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
    if (!suggestionsBox || !searchBox) {
        console.warn('Suggestions box or search box not found on this page.');
        return;
    }

    if (!suggestionsBox.contains(event.target) && !searchBox.contains(event.target)) {
        suggestionsBox.style.display = 'none';
    }
});

//add selected recipe to the list with nutrition info
async function addRecipeToList(index) {
    const recipe = recipeSuggestions[index];
    if (!recipe) return;

    //ensure ingredients are in array format
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.ingredients];

    //fetch nutrition info (await the result)
    const nutritionData = await fetchNutritionInfo(ingredients);

    //aggregate the nutrition data
    const nutrition = nutritionData
        ? aggregateNutrition(nutritionData)
        : null;

    //create recipe details object
    const recipeDetails = {
        name: recipe.title,
        ingredients: ingredients.join(', '),
        instructions: recipe.instructions || 'No instructions available',
        nutrition,
    };

    //save to localStorage
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    savedRecipes.push(recipeDetails);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));

    //display the recipe in the table
    displayRecipe(recipeDetails);

    //clear search box and suggestions
    document.getElementById('recipe-search').value = '';
    document.getElementById('suggestions').style.display = 'none';
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

//loads and displays recipes from recipe list on homepage to planner page
function loadPlannerRecipes() {
    const recipeTable = document.getElementById('planner-recipe-table');
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];

    //clear table except header
    recipeTable.innerHTML = `
        <tr>
            <th>Recipe Name</th>
            <th>Action</th>
        </tr>
    `;

    //add rows with recipe names and delete buttons
    savedRecipes.forEach((recipe, index) => {
        const row = `
            <tr>
                <td>${recipe.name}</td>
                <td><button class="delete-btn" onclick="deleteRecipe(${index})">Delete</button></td>
            </tr>`;
        recipeTable.insertAdjacentHTML('beforeend', row);
    });
}

//reload recipes when localStorage changes
window.addEventListener('storage', (event) => {
    if (event.key === 'savedRecipes') {
        loadPlannerRecipes(); 
    }
});

//function to delete a recipe in recipe list on weekly planner page
function deleteRecipe(index) {
    //delete from saved recipes
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    const deletedRecipe = savedRecipes[index]?.name;
    savedRecipes.splice(index, 1);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));

    //update meal plan to remove the deleted recipe
    const mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};
    Object.keys(mealPlan).forEach((mealId) => {
        //filter out the deleted recipe
        mealPlan[mealId] = mealPlan[mealId].filter(recipeName => recipeName !== deletedRecipe);
    });
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));

    //reload the planner and meal slots
    loadPlannerRecipes();
    loadMealPlan();

    console.log(`Recipe deleted: ${deletedRecipe}`);
}

//adding drag and drop using Sortable.js
//make the saved recipes draggable
const savedRecipesList = document.querySelector('#planner-recipe-table');
if (savedRecipesList) {
    new Sortable(savedRecipesList, {
        group: 'recipes', 
        animation: 150, 
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
            console.log('Recipe dragged:', evt.item.textContent); //debugging log recipe name when dragging ends
        }
    });
}

//select all the meal slots where recipes can be dropped
const mealSlots = document.querySelectorAll('.meal-slot .meal-list');

//loop through each meal slot and make it a drop zone
//modify how recipes are added to meal slots
mealSlots.forEach(mealList => {
    new Sortable(mealList, {
        group: 'recipes',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onAdd: (evt) => {
            const draggedItem = evt.item;
            
            //remove any delete buttons from the dragged item
            const deleteButton = draggedItem.querySelector('.delete-btn');
            if (deleteButton) deleteButton.remove();

            draggedItem.innerHTML = draggedItem.textContent.trim();

            console.log(`Recipe added to ${mealList.id}:`, draggedItem.textContent); //debugging

            //save changes to localStorage
            saveMealPlan();
        }
    });
});

//adding a clear planner button
document.addEventListener('DOMContentLoaded', () => {
    //get the clear planner button
    const clearPlannerButton = document.getElementById('clear-planner');

    if (clearPlannerButton) {
        //add event listener to clear the planner
        clearPlannerButton.addEventListener('click', () => {
            //clear all meal slots
            const mealSlots = document.querySelectorAll('.meal-slot .meal-list');
            mealSlots.forEach(mealList => {
                mealList.innerHTML = ''; //remove all recipes from the meal slot
            });

            //clear the meal plan from localStorage
            localStorage.removeItem('mealPlan');

            console.log('Planner cleared successfully!');
        });
    } else {
        console.error('Clear Planner button not found.');
    }
});

//save the current meal plan to localStorage
function saveMealPlan() {
    const mealPlan = {};

    //loop through all meal slots
    mealSlots.forEach(mealList => {
        const mealId = mealList.id;
        const recipes = Array.from(mealList.children).map(item => item.textContent.trim());
        mealPlan[mealId] = recipes; //save recipes to the meal plan
    });
    //save meal object to localStorage as a string
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    console.log('Meal plan saved:', mealPlan);
}

//load the meal plan from localStorage
function loadMealPlan() {
    const savedMealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};

    //loop through all meal slots
    mealSlots.forEach(mealList => {
        const mealId = mealList.id;
        const recipes = savedMealPlan[mealId] || [];

        //display only the recipe name in the meal slot
        mealList.innerHTML = recipes.map(recipe => `<li class="simple-recipe">${recipe}</li>`).join('');
    });
}

//load meal plan when the page is ready
document.addEventListener('DOMContentLoaded', loadMealPlan);

//call function when the planner page loads
if (document.getElementById('planner-recipe-table')) {
    loadPlannerRecipes();
}

//get shopping item input element
const shoppingInput = document.getElementById('shopping-item-input');

//check if element exists on the page
if (shoppingInput) {
    //event listener to detect when enter key is pressed
    shoppingInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); //prevent the default form submission behavior
            addToShoppingList(); //calls the addToShoppingList function
        }
    });
} else {
    console.warn("Shopping item input not found on this page.");    //debugging 
}

//get back to top button element
const backToTopButton = document.getElementById('back-to-top');

//checks if back to top button exists
if (backToTopButton) {
    console.log("Back-to-Top button detected.");

    //show or hide the button when scrolling
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add("show");
        } else {
            backToTopButton.classList.remove("show");
        }
    });

    //scroll to the top when the button is clicked
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    });
} else {
    console.error("Back-to-Top button not found.");     //debugging
}
