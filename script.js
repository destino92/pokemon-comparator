import { comparePokemon } from './compare.js'

let pokemon1Data = null;
let pokemon2Data = null;
let isLoading1 = false;
let isLoading2 = false;

const pokemon1Search = document.getElementById('pokemon1-search');
const pokemon2Search = document.getElementById('pokemon2-search');
const pokemon1Button = document.getElementById('pokemon1-button');
const pokemon2Button = document.getElementById('pokemon2-button');
const pokemon1Card = document.getElementById('pokemon1-card');
const pokemon2Card = document.getElementById('pokemon2-card');
const comparisonCard = document.getElementById('comparison-card');
const pokemon1Name = document.getElementById('pokemon1-name');
const pokemon2Name = document.getElementById('pokemon2-name');
const pokemon1Total = document.getElementById('pokemon1-total');
const pokemon2Total = document.getElementById('pokemon2-total');
const winner = document.getElementById('winner');

const typeColors = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  dark: "#EE99AC",
};

function setElementStyles(elements, cssProperty, value) {
  elements.forEach((element) => {
    element.style[cssProperty] = value;
  });
}

function rgbaFromHex(hexColor) {
  return [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16),
  ].join(", ");
}

document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  pokemon1Button.addEventListener('click', () => fetchPokemon(pokemon1Search.value, 1));
  pokemon2Button.addEventListener('click', () => fetchPokemon(pokemon2Search.value, 2));
  
  pokemon1Search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchPokemon(pokemon1Search.value, 1);
  });
  
  pokemon2Search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchPokemon(pokemon2Search.value, 2);
  });
  
  // Load initial Pokemon
  fetchPokemon('pikachu', 1);
  fetchPokemon('venusaur', 2);
});

// Fetch Pokemon data from the API
async function fetchPokemon(name, pokemonNumber) {
  if (!name) return;
  
  name = name.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Set loading state
  if (pokemonNumber === 1) {
    isLoading1 = true;
    pokemon1Card.innerHTML = '<div class="loading">Loading...</div>';
    pokemon1Button.disabled = true;
  } else {
    isLoading2 = true;
    pokemon2Card.innerHTML = '<div class="loading">Loading...</div>';
    pokemon2Button.disabled = true;
  }
  
  try {
    const response = await fetch(`https://pokeapi-proxy.freecodecamp.rocks/api/pokemon/${name}`);
    
    if (!response.ok) {
      throw new Error(`Pokemon not found: ${name}`);
    }
    
    const data = await response.json();
    
    // Process the data
    const processedData = {
      id: data.id,
      name: data.name,
      weight: data.weight,
      height: data.height,
      base_experience: data.base_experience,
      hp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
      attack: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
      defense: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
      sp_atk: data.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
      sp_def: data.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
      speed: data.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
      types: data.types || [],
      sprite: getSpriteUrl(data)
    };
    
    // Store the data and render the card
    if (pokemonNumber === 1) {
      pokemon1Data = processedData;
      renderPokemonCard(processedData, pokemon1Card);
    } else {
      pokemon2Data = processedData;
      renderPokemonCard(processedData, pokemon2Card);
    }

    if (pokemon1Data && pokemon2Data) {
      renderComparison();
    }
    
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    
    // Show error message
    if (pokemonNumber === 1) {
      pokemon1Card.innerHTML = `
        <div class="loading">
          Pokemon not found. Please try another name.
          <div class="error-message">${error.message}</div>
        </div>
      `;
    } else {
      pokemon2Card.innerHTML = `
        <div class="loading">
          Pokemon not found. Please try another name.
          <div class="error-message">${error.message}</div>
        </div>
      `;
    }
  } finally {
    // Reset loading state
    if (pokemonNumber === 1) {
      isLoading1 = false;
      pokemon1Button.disabled = false;
    } else {
      isLoading2 = false;
      pokemon2Button.disabled = false;
    }

    comparePokemon(pokemon1Data, pokemon2Data, typeColors);
  }
}

// Get the sprite URL with fallbacks
function getSpriteUrl(data) {
  try {
    // Try to get official artwork first
    if (data.sprites?.other?.['official-artwork']?.front_default) {
      return data.sprites.other['official-artwork'].front_default;
    } 
    // Fallback to regular front sprite
    else if (data.sprites?.front_default) {
      return data.sprites.front_default;
    }
    // Fallback to any available sprite
    else {
      const allSprites = data.sprites || {};
      for (const key in allSprites) {
        if (typeof allSprites[key] === 'string' && allSprites[key].startsWith('http')) {
          return allSprites[key];
        }
      }
    }
  } catch (error) {
    console.error('Error getting sprite:', error);
  }
  
  // If all else fails, use a placeholder
  return 'https://via.placeholder.com/180?text=No+Image';
}

async function getPokemon3dModel(pokemonName) {
  let filteredPokemon = [];
  try {
    const response = await fetch('./models/Merged.json');
    if (!response.ok) {
      throw new Error('Failed to fetch 3D model data');
    }
    const data = await response.json();
    console.log({data});
    filteredPokemon = data.pokemon.filter(pokemon =>
      pokemon.forms.some(form => form.name.toLowerCase().includes(pokemonName))
  );
  } catch (error) {
    console.error('Error loading data:', error);
  }

  console.log({filteredPokemon});

  return filteredPokemon[0].forms[0].model;
}

async function renderPokemon3dModel(pokemonName) {
  const pokemonModel = await getPokemon3dModel(pokemonName);

  const modelViewer = document.createElement('model-viewer');
  modelViewer.setAttribute('camera-controls', '');
  modelViewer.setAttribute('auto-rotate', '');
  modelViewer.setAttribute('autoplay', '');
  modelViewer.setAttribute('environment-image', 'neutral');
  modelViewer.setAttribute('alt', `Model of ${pokemonName}`);
  modelViewer.setAttribute('src', pokemonModel);

  return modelViewer;
}

function setTypeBackgroundColor(pokemon, cardId) {
  console.log({name: pokemon.name, types: pokemon.types});

  const mainType = pokemon.types[0].type.name;
  const color = typeColors[mainType];

  console.log({cardId})

  if (!color) {
    console.warn(`Color not defined for type: ${mainType}`);
    return;
  }

  setElementStyles(
    document.querySelectorAll(`#${cardId} .stat-label`),
    "color",
    color
  );

  setElementStyles(
    document.querySelectorAll(`#${cardId} .progress-bar`),
    "color",
    color
  );

  const rgbaColor = rgbaFromHex(color);
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    #${cardId} .progress-bar::-webkit-progress-bar {
        background-color: rgba(${rgbaColor}, 0.5);
    }
    #${cardId} .progress-bar::-webkit-progress-value {
        background-color: ${color};
    }
  `;
  document.head.appendChild(styleTag);
}

// Render a Pokemon card
async function renderPokemonCard(pokemon, cardElement) {
  // Capitalize the first letter of the name
  const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

  // Store the 3D model in a variable
  const modelViewer = await renderPokemon3dModel(pokemon.name);

  // Render the 3D model if available, otherwise render the image
  const visualElement = modelViewer 
    ? modelViewer.outerHTML 
    : `<img src="${pokemon.sprite}" alt="${name}" class="pokemon-image">`;

  
  // Create the HTML for the card
  const html = `
    <div class="pokemon-header ${pokemon.types[0].type.name}">
      <img src="./assets/pokedex.svg" alt="pokedex" class="pokemon-header-bg" />
      <div class="pokemon-name">${name} #${pokemon.id}</div>
      ${visualElement}
    </div>
    <div class="pokemon-details">
      <div class="pokemon-types">
        ${pokemon.types.map(type => `
          <div class="type-badge ${type.type.name}">
            <img src="./assets/${type.type.name}.svg" alt="${type.type.name} icon" style="width: 20px; height: 20px;"/>
            <span>${type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)}</span>
          </div>
        `).join('')}
      </div>
      <h4>About</h4>
      <div class="pokemon-about-container">
        <div class="pokemon-about-item">
          <div class="pokemon-about">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#313131" d="M128 176a128 128 0 1 1 256 0 128 128 0 1 1 -256 0zM391.8 64C359.5 24.9 310.7 0 256 0S152.5 24.9 120.2 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-56.2 0zM296 224c0-10.6-4.1-20.2-10.9-27.4l33.6-78.3c3.5-8.1-.3-17.5-8.4-21s-17.5 .3-21 8.4L255.7 184c-22 .1-39.7 18-39.7 40c0 22.1 17.9 40 40 40s40-17.9 40-40z"/></svg>
            <p class="text-semibold">${pokemon.weight / 10} Kg</p>
          </div>
          <p class="caption-fonts">Weight</p>
        </div>
        <div class="pokemon-about-item">
          <div class="pokemon-about">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="10" viewBox="0 0 256 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#313131" d="M0 48C0 21.5 21.5 0 48 0L208 0c26.5 0 48 21.5 48 48l0 48-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 64-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 64-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 64-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 48z"/></svg>
            <p class="text-semibold">${pokemon.height / 10} m</p>
          </div>
          <p class="caption-fonts">Height</p>
        </div>
        <div class="pokemon-about-item">
          <div class="pokemon-about">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#313131" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3 0 289.2zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
            <p class="text-semibold">${pokemon.base_experience}</p>
          </div>
          <p class="caption-fonts">XP</p>
        </div>
      </div>
    </div>
    <div class="pokemon-stats">
      <div class="stats-container">
        <div class="stats-bars">
          ${renderStatBars(pokemon)}
        </div>
      </div>
    </div>
  `;

  const pokemonCardId = cardElement.getAttribute("id");
  // Set the HTML
  cardElement.innerHTML = html;

  setTypeBackgroundColor(pokemon, pokemonCardId)
}

// Render the stat bars for a Pokemon
function renderStatBars(pokemon) {
  const stats = [
    { name: 'HP', value: pokemon.hp },
    { name: 'Attack', value: pokemon.attack },
    { name: 'Defense', value: pokemon.defense },
    { name: 'Sp. Atk', value: pokemon.sp_atk },
    { name: 'Sp. Def', value: pokemon.sp_def },
    { name: 'Speed', value: pokemon.speed }
  ];
  
  return stats.map(stat => `
    <div class="stat-bar">
      <div class="stat-label text-bold">
        <span>${stat.name}</span>
        <span>${stat.value}</span>
      </div>
      <progress value="${stat.value}" max="200" class="progress-bar"></progress>
    </div>
  `).join('');
}

function renderComparison() {
  if (!pokemon1Data || !pokemon2Data) return;
  
  // Show the comparison card
  comparisonCard.style.display = 'block';

  const legendItem1 = document.getElementById("pokemon-1-legend");
  const colorBox1 = legendItem1.querySelector(".color-box");
  colorBox1.className = `color-box new-class ${pokemon1Data.types[0].type.name}`;

  const legendItem2 = document.getElementById("pokemon-2-legend");
  const colorBox2 = legendItem2.querySelector(".color-box");
  colorBox2.className = `color-box new-class ${pokemon2Data.types[0].type.name}`;
  
  // Update the Pokemon names and total stats
  const name1 = pokemon1Data.name.charAt(0).toUpperCase() + pokemon1Data.name.slice(1);
  const name2 = pokemon2Data.name.charAt(0).toUpperCase() + pokemon2Data.name.slice(1);
  
  pokemon1Name.textContent = name1;
  pokemon2Name.textContent = name2;
  
  const total1 = pokemon1Data.hp + pokemon1Data.attack + pokemon1Data.defense + 
                pokemon1Data.sp_atk + pokemon1Data.sp_def + pokemon1Data.speed;
  
  const total2 = pokemon2Data.hp + pokemon2Data.attack + pokemon2Data.defense + 
                pokemon2Data.sp_atk + pokemon2Data.sp_def + pokemon2Data.speed;

                
  pokemon1Total.textContent = `Total: ${total1}`;
  pokemon2Total.textContent = `Total: ${total2}`;
  if(total1 > total2) {
    winner.innerHTML = `<h2 class="text-bold">Winner !!!</h2><img src="${pokemon1Data.sprite}" alt="${pokemon1Data.name}" class="pokemon-image">`
  }
  else {
    winner.innerHTML = `<h2 class="text-bold">Winner !!!</h2><img src="${pokemon2Data.sprite}" alt="${pokemon2Data.name}" class="pokemon-image">`
  }
}