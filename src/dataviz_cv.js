function displayCVStats(dataAsString) {
    //#region Constantes
    const width = document.getElementById("cv_wc_container").offsetWidth * 0.95,
        height = width,
        // fontFamily = "Segoe UI",
        fontScale = d3.scaleLinear().range([18, 68]),
        fillScale = d3.scaleOrdinal(d3.schemeCategory10),
        words = [],
        predicts = [];
    //#endregion

    //#region Useful methods
    function draw() {
        d3.select("#cv_wc_container").append("svg") // Ajout d'un élément SVG sur un DIV existant de la page
            .attr("id", "svgNuage")
            .attr("class", "svg")
            .attr("width", width)
            .attr("height", height)
            .append("g") // Ajout du groupe qui contiendra tout les mots
            .attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")") // Centrage du groupe
            .selectAll("text")
            .data(words)
            .enter()
            .append("text") // Ajout de chaque mot avec ses propriétés
            .style("font-size", d => d.size + "px")
            //.style("font-family", fontFamily)
            .style("fill", d => fillScale(d.size))
            .attr("text-anchor", "middle")
            .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
            .text(d => d.text);
        //.on("mouseover", wordMouseOver)
        //.on("mouseout", wordMouseOut);
    }
    //#endregion

    // Efface le contenu des conteneurs si un CV a déjà été visualisé auparavant
    $('#cv_wc_container').empty();
    $('#cv_top_container').empty();
    $('#cv_gender_container').empty();

    // Récupère les données sous forme d'objet
    let cv_data = JSON.parse(dataAsString);

    //#region Nuage de mots
    let wordArray = cv_data.description.split(' ');
    wordArray.forEach(element => {
        if (words.find(x => x.text == element)) {
            objIndex = words.findIndex(x => x.text == element);
            words[objIndex].size++;
        } else {
            words.push({
                text: element,
                size: 1
            })
        }
    });

    // Définition de la taille minimale et maximale des mots en fonction de leur poids
    let minSize = d3.min(words, d => d.size);
    let maxSize = d3.max(words, d => d.size);

    // Ajustement de l'échelle de taille des mots
    fontScale.domain([minSize, maxSize]);

    // Construction du nuage de mots
    d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(1)
        .rotate(() => {
            return ~~(Math.random() * 2) * 45; // Rotation aléatoire de 45°
        })
        .spiral("rectangular")
        //.font(fontFamily)
        .fontSize(d => fontScale(d.size))
        .on("end", draw) // Appel a la fonction permettant de dessiner le nuage svg
        .start();

    // TODO Etienne ajouter le tootlip au survol
    //#endregion

    //#region Bar chart top 3
    let predObj = JSON.parse(cv_data.predict.replace(/'/g, '"'));
    for (let predProp in predObj) {
        predicts.push({
            name: predProp,
            value: predObj[predProp]
        });
    }

    predicts.sort((a, b) => {
        return d3.ascending(a.value, b.value);
    });
    console.log(predicts);

    // On laisse plus de marge à gauche pour les labels
    let margin = {
        top: 15,
        right: 60,
        bottom: 15,
        left: 60
    };

    let pwidth = width - margin.left - margin.right,
        pheight = height - 100 - margin.top - margin.bottom; // Moins haut que large 

    let svg = d3.select("#cv_top_container").append("svg")
        .attr("width", pwidth + margin.left + margin.right)
        .attr("height", pheight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x = d3.scaleLinear()
        .range([0, pwidth])
        .domain([0, d3.max(predicts, (d) => {
            return d.value;
        })]);

    let y = d3.scaleBand()
        .rangeRound([pheight, 0])
        .padding(0.1)
        .domain(predicts.map((d) => {
            return d.name;
        }));

    // Création de l'axe y pour y ajouter les données
    let yAxis = d3.axisLeft()
        .scale(y)
        .tickSize(0); // Pas de points

    let gy = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    let bars = svg.selectAll(".bar")
        .data(predicts)
        .enter()
        .append("g")

    // Ajout des rectangles
    bars.append("rect")
        .attr("class", "bar")
        .attr("y", (d) => {
            return y(d.name);
        })
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", (d) => {
            return x(d.value);
        })
        .style("fill", "rgba(255, 127, 14, 0.75)")
        .style("stroke", "#222222")
        .style("stroke-width", "1px");

    // Texte de la barre
    bars.append("text")
        .attr("class", "label")
        // Position de la valeur au milieu de la barre
        .attr("y", (d) => {
            return y(d.name) + y.bandwidth() / 2 + 4;
        })
        .attr("x", (d) => {
            // 3px a coté de la fin de la barre
            return x(d.value) + 3;
        })
        .text((d) => {
            return (d.value * 100).toFixed(2) + " %";
        });

    //#endregion

    //#region Gender 
    let gender = cv_data.gender;

    if (gender == "F") {
        d3.select("#cv_gender_container").append("h3")
            .style("color", "rgb(219,112,147)")
            .text("Genre : Femme")
            .style("font-weight", "bold");
    } else {
        d3.select("#cv_gender_container").append("h3")
            .style("color", "rgb(100,149,237)")
            .text("Genre : Homme")
            .style("font-weight", "bold");
    }
    //#endregion
}