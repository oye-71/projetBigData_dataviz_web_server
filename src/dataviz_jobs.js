function displayJobsStats(dataAsString) {
    //#region Constantes
    const width = document.getElementById("job_wc_container").offsetWidth * 0.95,
        height = width,
        // fontFamily = "Segoe UI",
        fontScale = d3.scaleLinear().range([18, 68]),
        fillScale = d3.scaleOrdinal(d3.schemeCategory10);

    const pmargin = 50,
        pradius = (Math.min(width, height) / 2) - pmargin,
        pcolor = {
            "M": "rgb(60, 86, 185)",
            "F": "rgb(227, 119, 194)"
        };
    //#endregion

    //#region Useful methods
    function redisplay(gendr) {
        let wor;
        switch (gendr) {
            case "neu":
                wor = job_data.general.words;
                break;
            case "man":
                wor = job_data.genders.find(x => x.gender == "M").words;
                break;
            case "wom":
                wor = job_data.genders.find(x => x.gender == "F").words;
                break;
            default:
                wor = job_data.general.words;
        }

        drawWordCloud(wor);
    }

    function drawWordCloud(words) {
        $('#job_wc_container').empty();

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
            .on("end", e => draw(words)) // Appel a la fonction permettant de dessiner le nuage svg
            .start();

        // TODO Etienne ajouter le tootlip au survol
        //#endregion

    }

    function draw(w) {
        d3.select("#job_wc_container").append("svg") // Ajout d'un élément SVG sur un DIV existant de la page
            .attr("id", "svgNuage")
            .attr("class", "svg")
            .attr("width", width)
            .attr("height", height)
            .append("g") // Ajout du groupe qui contiendra tout les mots
            .attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")") // Centrage du groupe
            .selectAll("text")
            .data(w)
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

    // Efface le contenu des conteneurs si un métier a déjà été visualisé auparavant
    $('#job_wc_container').empty();
    $('#job_g_pie_container').empty();

    // Récupère les données sous forme d'objet
    let job_data = JSON.parse(dataAsString);

    //#region Nuage de mots general
    let gen_words = job_data.general.words;
    drawWordCloud(gen_words);

    //#region Pie Chart gender
    let pData = [];
    job_data.genders.forEach(element => {
        pData.push({ text: element.gender, size: element.nb });
    });

    // Création du svg pour placer le chart
    let svg = d3.select("#job_g_pie_container")
        .append("svg")
        .attr("id", "svgPie")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    let pie = d3.pie()
        .value((d) => d.size);

    let dataReady = pie(pData);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg.selectAll('whatever')
        .data(dataReady)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(pradius)
        )
        .attr('fill', d => pcolor[d.data.text])
        .attr("stroke", "#dddddd")
        .style("stroke-width", "1px")
        .style("opacity", 0.8)
        //.on("mouseover", pieMouseOver)
        //.on("mouseout", pieMouseOut)
        // TODO Etienne ajouter les mouseover mouseout
        //#endregion

    //#region En cas de nouveau rendu du wordcloud
    $('.btn-switchwc').on('click', (event) => {
        let btn = $(event.currentTarget);
        $('#btn_job_man').prop("disabled", false);
        $('#btn_job_wom').prop("disabled", false);
        $('#btn_job_neu').prop("disabled", false);
        btn.prop('disabled', true);

        if (btn[0].id.includes("man")) {
            $("#job_wc_editable_title").text("Mots les plus souvent liés au métier (hommes)");
            redisplay("man");
        } else if (btn[0].id.includes("wom")) {
            $("#job_wc_editable_title").text("Mots les plus souvent liés au métier (femmes)");
            redisplay("wom");
        } else {
            $("#job_wc_editable_title").text("Mots les plus souvent liés au métier");
            redisplay("neu");
        }
    });
    //#endregion
}