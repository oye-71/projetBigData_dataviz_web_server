if (d3 == null) {
    throw new Error("D3.js does not exist");
}

var maxIdCV = 0;

$(document).ready(() => {
    // Main buttons
    $('button#btn_cv').on('click', (event) => {
        displayCVSearch();
    });
    $('button#btn_job').on('click', (event) => {
        displayJobsSearch();
    });

    // Id_CV button
    $('button#button_id_cv').on('click', (event) => {
        if (parseInt($('#input_id_cv').val()) > maxIdCV) {
            promptContentDiv("Aucun CV possédant cet id n'existe en base.", true);
        } else {
            $.get("/viz/id_cv/" + $('#input_id_cv').val())
                .done((data) => {
                    $('#dataviz_cv').show();
                    promptContentDiv();
                    displayCVStats(data);
                }).fail((err) => {
                    if (typeof err.responseText == "undefined")
                        err.responseText = "Une erreur s'est produite : impossible de contacter le serveur.";
                    promptContentDiv(err.responseText, true);
                });
        }
    });

    // Metier button
    $('button#button_select_metier').on('click', (event) => {
        if ($('#input_select_metier').val() == null) {
            promptContentDiv("Aucun métier n'a été sélectionné !", true);
        } else {
            $.get("/viz/metiers/" + $('#input_select_metier').val())
                .done(data => {
                    $("#dataviz_jobs").show();
                    promptContentDiv();
                    displayJobsStats(data);
                })
                .fail(err => {
                    if (typeof err.responseText == "undefined")
                        err.responseText = "Une erreur s'est produite : impossible de contacter le serveur.";
                    promptContentDiv(err.responseText, true);
                });
        }
    })
});

function promptContentDiv(message = null, isError = false) {
    let contentDiv = $('#content');
    if (message == null) {
        contentDiv.hide();
    } else {
        contentDiv.empty();
        contentDiv.show();
        contentDiv.parent().show();
        contentDiv.append("<span" + (isError ? " style='color:red;'" : "") + ">" + message + "</span>");
    }
}

function displayCVSearch() {
    promptContentDiv();
    let contentJobsDiv = $('#content_jobs');
    contentJobsDiv.attr("hidden", true);
    let contentCVDiv = $('#content_cv');
    contentCVDiv.attr("hidden", false);
    $.get("/viz/id_cv")
        .done((data) => {
            maxIdCV = parseInt(data);
            $("#input_label_id_cv").text(`Id du CV recherché (entre 0 et ${maxIdCV})`);
        }).fail((err) => {
            if (typeof err.responseText == "undefined")
                err.responseText = "Une erreur s'est produite : impossible de contacter le serveur.";
            promptContentDiv(err.responseText, true);
        });

    $("#input_id_cv").on("input", (event) => {
        let ct = $(event.currentTarget);
        ct.val(ct.val().replace(/[^0-9]/g, ''));
    });
}

function displayJobsSearch() {
    promptContentDiv();
    let contentJobsDiv = $('#content_jobs');
    contentJobsDiv.attr("hidden", false);
    let contentCVDiv = $('#content_cv');
    contentCVDiv.attr("hidden", true);
    let select = $("#input_select_metier");
    if (select.children('option').length <= 1) {
        promptContentDiv("Chargement de la liste des métiers...");
        $.get("/viz/metiers")
            .done((data) => {
                promptContentDiv();
                let dataObject = JSON.parse(data);
                dataObject.forEach(element => {
                    let option = `<option value='${element.metier}'>${element.metier}</option>`;
                    select.append(option);
                });
            }).fail((err) => {
                if (typeof err.responseText == "undefined")
                    err.responseText = "Une erreur s'est produite : impossible de contacter le serveur.";
                promptContentDiv(err.responseText, true);
            });
    }
}