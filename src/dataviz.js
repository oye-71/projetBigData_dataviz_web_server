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
                    displayCVStats(data);
                }).fail((err) => {
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
                    displayJobsStats(data);
                })
                .fail(err => {
                    promptContentDiv(err.responseText, true);
                });
        }
    })
});

function promptContentDiv(message, isError = false) {
    let contentDiv = $('#content');
    contentDiv.empty();
    contentDiv.append("<p" + (isError ? " style='color:red;'" : "") + ">" + message + "</p>");
}

function displayCVSearch() {
    let contentDiv = $('#content');
    contentDiv.empty();
    let contentJobsDiv = $('#content_jobs');
    contentJobsDiv.attr("hidden", true);
    let contentCVDiv = $('#content_cv');
    contentCVDiv.attr("hidden", false);
    $.get("/viz/id_cv")
        .done((data) => {
            maxIdCV = parseInt(data);
            $("#input_label_id_cv").text(`Id du CV recherché (entre 0 et ${maxIdCV})`);
        }).fail((err) => {
            promptContentDiv(err.responseText, true);
        });

    $("#input_id_cv").on("input", (event) => {
        let ct = $(event.currentTarget);
        ct.val(ct.val().replace(/[^0-9]/g, ''));
    });
}

function displayJobsSearch() {
    let contentDiv = $('#content');
    contentDiv.empty();
    let contentJobsDiv = $('#content_jobs');
    contentJobsDiv.attr("hidden", false);
    let contentCVDiv = $('#content_cv');
    contentCVDiv.attr("hidden", true);
    $.get("/viz/metiers")
        .done((data) => {
            let dataObject = JSON.parse(data);
            let select = $("#input_select_metier");
            dataObject.forEach(element => {
                let option = `<option value='${element.metier}'>${element.metier}</option>`;
                select.append(option);
            });
        }).fail((err) => {
            promptContentDiv(err.responseText, true);
        });
}