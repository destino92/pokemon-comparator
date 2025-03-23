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
    <div class="pokemon-header">
      <div class="pokemon-name">${name} #${pokemon.id}</div>
      <div class="pokemon-types">
        ${pokemon.types.map(type => `
          <div class="type-badge ${type.type.name}">
            ${type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)}
          </div>
        `).join('')}
      </div>
      ${visualElement}
    </div>
    <div class="pokemon-stats">
      <div class="stats-container">
        <div class="stats-bars">
          ${renderStatBars(pokemon)}
        </div>
      </div>
    </div>
  `;
  
  // Set the HTML
  cardElement.innerHTML = html;
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
      <div class="stat-label">
        <span>${stat.name}</span>
        <span>${stat.value}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(stat.value / 200) * 100}%"></div>
      </div>
    </div>
  `).join('');
}