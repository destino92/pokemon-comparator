import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Fonction appelée lors du clic sur le bouton
function comparePokemon() {
  const pokemon1Name = document.getElementById("pokemon1").value.toLowerCase();
  const pokemon2Name = document.getElementById("pokemon2").value.toLowerCase();

  if (!pokemon1Name || !pokemon2Name) {
    alert("Veuillez entrer les noms des Pokémon");
    return;
  }

  // URL de l'API pour récupérer les données des deux Pokémon
  const pokemonUrls = [
    `https://pokeapi-proxy.freecodecamp.rocks/api/pokemon/${pokemon1Name}`,
    `https://pokeapi-proxy.freecodecamp.rocks/api/pokemon/${pokemon2Name}`
  ];

  Promise.all(pokemonUrls.map(url => fetch(url).then(res => res.json())))
    .then(pokemonData => {
      // Extraction des statistiques souhaitées pour chaque Pokémon
      const stats = pokemonData.map(pokemon => ({
        name: pokemon.name,
        hp: pokemon.stats.find(stat => stat.stat.name === "hp").base_stat,
        attack: pokemon.stats.find(stat => stat.stat.name === "attack").base_stat,
        defense: pokemon.stats.find(stat => stat.stat.name === "defense").base_stat,
        speed: pokemon.stats.find(stat => stat.stat.name === "speed").base_stat
      }));

      // Formatage des données pour RadarChart : tableau de deux séries de {axis, value}
      const radarData = [
        [
          { axis: "HP", value: stats[0].hp },
          { axis: "Attack", value: stats[0].attack },
          { axis: "Defense", value: stats[0].defense },
          { axis: "Speed", value: stats[0].speed }
        ],
        [
          { axis: "HP", value: stats[1].hp },
          { axis: "Attack", value: stats[1].attack },
          { axis: "Defense", value: stats[1].defense },
          { axis: "Speed", value: stats[1].speed }
        ]
      ];

      // Calcul de la valeur maximale parmi les stats pour l'échelle
      const maxStat = Math.max(
        stats[0].hp, stats[0].attack, stats[0].defense, stats[0].speed,
        stats[1].hp, stats[1].attack, stats[1].defense, stats[1].speed
      );

      // Options de configuration pour le RadarChart
      const options = {
        w: 700,  // Augmentation de la largeur pour laisser de la place aux labels
        h: 700,  // Augmentation de la hauteur
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
        levels: 5,
        maxValue: maxStat,
        labelFactor: 1.1,  // Légèrement réduit pour que les labels ne dépassent pas
        wrapWidth: 60,
        opacityArea: 0.35,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 2,
        roundStrokes: false,
        color: d3.scaleOrdinal(d3.schemeCategory10)
      };

      // Dessiner le radar
      RadarChart("#radar-chart-container", radarData, options);
      
      // Ajouter la légende sous le graphique
      addLegend("#radar-chart-container", stats, options);
    })
    .catch(error => {
      alert("Impossible de trouver les données, vérifiez les noms des Pokémon");
      console.error(error);
    });
}

// Expose la fonction au niveau global pour l'appel depuis le HTML
window.comparePokemon = comparePokemon;

//////////////////////////////////////////////////////////
// Fonction RadarChart (adaptée de Nadieh Bremer)
//////////////////////////////////////////////////////////
function RadarChart(id, data, options) {
  var cfg = {
    w: 600,
    h: 600,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    levels: 3,
    maxValue: 0,
    labelFactor: 1.25,
    wrapWidth: 60,
    opacityArea: 0.35,
    dotRadius: 4,
    opacityCircles: 0.1,
    strokeWidth: 2,
    roundStrokes: false,
    color: d3.scaleOrdinal(d3.schemeCategory10)
  };

  // Incorporer les options fournies
  if (typeof options !== "undefined") {
    for (var i in options) {
      if (typeof options[i] !== "undefined") {
        cfg[i] = options[i];
      }
    }
  }

  // Calcul de la valeur maximale parmi les données
  var maxValue = Math.max(
    cfg.maxValue,
    d3.max(data, function(series) {
      return d3.max(series, function(o) { return o.value; });
    })
  );

  // Récupération des axes (labels)
  var allAxis = data[0].map(function(i) { return i.axis; }),
      total = allAxis.length,
      radius = Math.min(cfg.w / 2, cfg.h / 2),
      angleSlice = Math.PI * 2 / total;

  // Échelle radiale
  var rScale = d3.scaleLinear()
    .range([0, radius])
    .domain([0, maxValue]);

  // Supprimer tout SVG existant dans le conteneur
  d3.select(id).select("svg").remove();

  // Création du SVG
  var svg = d3.select(id).append("svg")
    .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
    .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr("class", "radar" + id);

  // Groupe principal centré
  var g = svg.append("g")
    .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

  /////////////////////////////////////////////////////////
  // Filtre glow pour effet lumineux
  /////////////////////////////////////////////////////////
  var filter = g.append('defs').append('filter').attr('id', 'glow'),
      feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
      feMerge = filter.append('feMerge'),
      feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
      feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  /////////////////////////////////////////////////////////
  // Dessiner la grille circulaire et les niveaux
  /////////////////////////////////////////////////////////
  var axisGrid = g.append("g").attr("class", "axisWrapper");

  // Cercles de fond
  axisGrid.selectAll(".levels")
    .data(d3.range(1, (cfg.levels + 1)).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", function(d) { return radius / cfg.levels * d; })
    .style("fill", "#CDCDCD")
    .style("stroke", "#CDCDCD")
    .style("fill-opacity", cfg.opacityCircles)
    .style("filter", "url(#glow)");

  // Labels des niveaux
  axisGrid.selectAll(".axisLabel")
    .data(d3.range(1, (cfg.levels + 1)).reverse())
    .enter()
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 4)
    .attr("y", function(d) { return -d * radius / cfg.levels; })
    .attr("dy", "0.4em")
    .style("font-size", "10px")
    .attr("fill", "#737373")
    .text(function(d) { return d3.format(".0f")(maxValue * d / cfg.levels); });

  /////////////////////////////////////////////////////////
  // Dessiner les axes radiaux
  /////////////////////////////////////////////////////////
  var axis = axisGrid.selectAll(".axis")
    .data(allAxis)
    .enter()
    .append("g")
    .attr("class", "axis");

  // Lignes radiales
  axis.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", function(d, i) { return rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2); })
    .attr("y2", function(d, i) { return rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2); })
    .attr("class", "line")
    .style("stroke", "white")
    .style("stroke-width", "2px");

  // Labels des axes (ici, les noms comme HP, Attack, etc.)
  axis.append("text")
    .attr("class", "legend")
    .style("font-size", "11px")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("x", function(d, i) { 
      return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2); 
    })
    .attr("y", function(d, i) { 
      return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2); 
    })
    .text(function(d) { return d; })
    .attr("fill", "#000"); // Texte en noir

  /////////////////////////////////////////////////////////
  // Dessiner les zones (blobs) du radar
  /////////////////////////////////////////////////////////
  var radarLine = d3.lineRadial()
    .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
    .radius(function(d) { return rScale(d.value); })
    .angle(function(d, i) { return i * angleSlice; });

  // Groupes pour chaque série de données
  var blobWrapper = g.selectAll(".radarWrapper")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "radarWrapper");

  // Zones remplies
  blobWrapper.append("path")
    .attr("class", "radarArea")
    .attr("d", function(d) { return radarLine(d); })
    .style("fill", function(d, i) { return cfg.color(i); })
    .style("fill-opacity", cfg.opacityArea)
    .on('mouseover', function(event, d) {
      d3.selectAll(".radarArea")
        .transition().duration(200)
        .style("fill-opacity", 0.1);
      d3.select(this)
        .transition().duration(200)
        .style("fill-opacity", 0.7);
    })
    .on('mouseout', function() {
      d3.selectAll(".radarArea")
        .transition().duration(200)
        .style("fill-opacity", cfg.opacityArea);
    });

  // Contours
  blobWrapper.append("path")
    .attr("class", "radarStroke")
    .attr("d", function(d) { return radarLine(d); })
    .style("stroke-width", cfg.strokeWidth + "px")
    .style("stroke", function(d, i) { return cfg.color(i); })
    .style("fill", "none")
    .style("filter", "url(#glow)");

  // Points sur le radar
  blobWrapper.selectAll(".radarCircle")
    .data(function(d) { return d; })
    .enter()
    .append("circle")
    .attr("class", "radarCircle")
    .attr("r", cfg.dotRadius)
    .attr("cx", function(d, i) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
    .attr("cy", function(d, i) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
    .style("fill", function(d, i, j) { return cfg.color(j); })
    .style("fill-opacity", 0.8);

  // Cercles invisibles pour tooltip
  var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "radarCircleWrapper");

  blobCircleWrapper.selectAll(".radarInvisibleCircle")
    .data(function(d) { return d; })
    .enter()
    .append("circle")
    .attr("class", "radarInvisibleCircle")
    .attr("r", cfg.dotRadius * 1.5)
    .attr("cx", function(d, i) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
    .attr("cy", function(d, i) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function(event, d) {
      var newX = parseFloat(d3.select(this).attr("cx")) - 10;
      var newY = parseFloat(d3.select(this).attr("cy")) - 10;
      tooltip
        .attr("x", newX)
        .attr("y", newY)
        .text(d.value)
        .transition().duration(200)
        .style("opacity", 1);
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200)
        .style("opacity", 0);
    });

  var tooltip = g.append("text")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Fonction d'enveloppement du texte (wrap)
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.4, // ems
          y = text.attr("y"),
          x = text.attr("x"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }
}

//////////////////////////////////////////////////////////
// Fonction d'ajout de la légende sous le graphique
//////////////////////////////////////////////////////////
function addLegend(containerId, stats, cfg) {
  // Supprimer toute légende existante
  d3.select(containerId).select(".legend-container").remove();

  // Créer un conteneur pour la légende
  var legend = d3.select(containerId)
    .append("div")
    .attr("class", "legend-container")
    .style("margin-top", "10px")
    .style("font-family", "sans-serif")
    .style("font-size", "14px");

  // Pour chaque Pokémon, afficher une boîte colorée et son nom
  stats.forEach((pokemon, i) => {
    legend.append("div")
      .style("display", "inline-block")
      .style("margin-right", "20px")
      .html(`<span style="display:inline-block;width:12px;height:12px;background:${cfg.color(i)};margin-right:5px;"></span>${pokemon.name}`);
  });
}
