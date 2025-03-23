import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function comparePokemon() {
  const pokemon1Name = document.getElementById("pokemon1").value.toLowerCase();
  const pokemon2Name = document.getElementById("pokemon2").value.toLowerCase();

  if (!pokemon1Name || !pokemon2Name) {
    alert("Veuillez entrer les noms des Pokémon");
    return;
  }

  const pokemonUrls = [
    `https://pokeapi-proxy.freecodecamp.rocks/api/pokemon/${pokemon1Name}`,
    `https://pokeapi-proxy.freecodecamp.rocks/api/pokemon/${pokemon2Name}`
  ];

  Promise.all(pokemonUrls.map(url => fetch(url).then(res => res.json())))
    .then(pokemonData => {
      const stats = pokemonData.map(pokemon => ({
        name: pokemon.name,
        hp: pokemon.stats.find(stat => stat.stat.name === "hp").base_stat,
        attack: pokemon.stats.find(stat => stat.stat.name === "attack").base_stat,
        defense: pokemon.stats.find(stat => stat.stat.name === "defense").base_stat,
        speed: pokemon.stats.find(stat => stat.stat.name === "speed").base_stat
      }));

      const comparisonData = [
        { stat: "HP", p1: stats[0].hp, p2: stats[1].hp },
        { stat: "Attack", p1: stats[0].attack, p2: stats[1].attack },
        { stat: "Defense", p1: stats[0].defense, p2: stats[1].defense },
        { stat: "Speed", p1: stats[0].speed, p2: stats[1].speed }
      ];

      drawComparisonBarChart(comparisonData);
      addLegend("#chart-container", stats);
    })
    .catch(error => {
      alert("Impossible de trouver les données, vérifiez les noms des Pokémon");
      console.error(error);
    });
}

window.comparePokemon = comparePokemon;

function drawComparisonBarChart(data) {
  const margin = { top: 20, right: 40, bottom: 20, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = data.length * 50;

  const maxValue = d3.max(data, d => Math.max(d.p1, d.p2));

  const xScale = d3.scaleLinear()
    .domain([-maxValue, maxValue])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(data.map(d => d.stat))
    .range([0, height])
    .padding(0.2);

  d3.select("#chart-container").select("svg").remove();

  const svg = d3.select("#chart-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("line")
    .attr("x1", xScale(0))
    .attr("x2", xScale(0))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "black");

  // Pokémon 1 (Bleu, vers la gauche)
  svg.selectAll(".bar1")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar1")
    .attr("x", xScale(0))  // Démarre du centre
    .attr("y", d => yScale(d.stat))
    .attr("width", 0)  // Largeur initiale 0 pour l'animation
    .attr("height", yScale.bandwidth())
    .attr("fill", "blue")
    .transition()
    .duration(1000)  // Animation de 1s
    .attr("x", d => xScale(-d.p1))  // Ajuste la position
    .attr("width", d => xScale(0) - xScale(-d.p1));

  // Pokémon 2 (Rouge, vers la droite)
  svg.selectAll(".bar2")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar2")
    .attr("x", xScale(0))  // Démarre du centre
    .attr("y", d => yScale(d.stat))
    .attr("width", 0)  // Largeur initiale 0 pour l'animation
    .attr("height", yScale.bandwidth())
    .attr("fill", "red")
    .transition()
    .duration(1000)  // Animation de 1s
    .attr("width", d => xScale(d.p2) - xScale(0));

  // Étiquettes des statistiques (labels)
  svg.selectAll(".stat-label")
    .data(data)
    .enter().append("text")
    .attr("class", "stat-label")
    .attr("x", xScale(0))
    .attr("y", d => yScale(d.stat) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => d.stat)
    .attr("fill", "#000");
}

function addLegend(containerId, stats) {
  d3.select(containerId).select(".legend-container").remove();

  var legend = d3.select(containerId)
    .append("div")
    .attr("class", "legend-container")
    .style("margin-top", "10px")
    .style("font-family", "sans-serif")
    .style("font-size", "14px");

  stats.forEach((pokemon, i) => {
    legend.append("div")
      .style("display", "inline-block")
      .style("margin-right", "20px")
      .html(`<span style="display:inline-block;width:12px;height:12px;background:${i === 0 ? "blue" : "red"};margin-right:5px;"></span>${pokemon.name}`);
  });
}
